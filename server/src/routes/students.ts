// server/src/routes/students.ts
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { verifyToken, requireRole } from '../middleware/auth';
import { badRequest, notFound } from '../utils/errors';
import { logAudit } from '../services/audit.service';
import { getActiveSessionId } from '../services/session.service';
import {
  listStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deactivateStudent,
  deleteStudentPermanently,
} from '../services/student.service';
import { getApplicationByApplicationId } from '../services/admission.service';

const router = Router();

const READ_ROLES = ['super_admin', 'school_admin', 'accountant', 'teacher', 'admission_officer'] as const;
const WRITE_ROLES = ['super_admin', 'school_admin'] as const;

const ah =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };

const actor = (req: Request): string =>
  (req as Request & { user?: { uid: string } }).user?.uid ?? 'unknown';

function parse<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) throw badRequest(result.error.issues[0]?.message ?? 'Invalid input');
  return result.data;
}

const emptyToUndefined = (v: unknown) => (v === '' || v === null ? undefined : v);
const bdMobile = z.string().trim().regex(/^(?:\+?88)?01[3-9]\d{8}$/, 'Invalid mobile number');

const listSchema = z.object({
  classId: z.preprocess(emptyToUndefined, z.string().trim().max(20).optional()),
  sessionId: z.preprocess(emptyToUndefined, z.string().trim().max(10).optional()),
  isActive: z.preprocess(
    (v) => (v === 'true' ? true : v === 'false' ? false : undefined),
    z.boolean().optional()
  ),
  search: z.preprocess(emptyToUndefined, z.string().trim().max(40).optional()),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(20),
});

const guardianSchema = z.object({
  name: z.string().trim().min(1).max(120),
  mobile: bdMobile,
});

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  classId: z.string().trim().min(1).max(20),
  sessionId: z.string().trim().min(1).max(10).optional(),
  roll: z.coerce.number().int().min(1).max(999).optional(),
  guardian: guardianSchema,
});

const updateSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    classId: z.string().trim().min(1).max(20).optional(),
    roll: z.coerce.number().int().min(1).max(999).optional(),
    guardian: guardianSchema.partial().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

router.get(
  '/',
  verifyToken,
  requireRole(...READ_ROLES),
  ah(async (req, res) => {
    const params = parse(listSchema, req.query);
    res.json(await listStudents(params));
  })
);

// All active students of a class with their admission data (photo, parents…) – for ID / admit cards.
// Must stay above '/:id'.
router.get(
  '/cards',
  verifyToken,
  requireRole(...READ_ROLES),
  ah(async (req, res) => {
    const { classId } = parse(z.object({ classId: z.string().trim().min(1).max(20) }), req.query);
    const { items } = await listStudents({ classId, isActive: true, page: 1, pageSize: 500 });
    items.sort((a, b) => {
      const ra = Number(a.roll);
      const rb = Number(b.roll);
      const na = Number.isFinite(ra) && a.roll != null ? ra : 99999;
      const nb = Number.isFinite(rb) && b.roll != null ? rb : 99999;
      return na - nb || String(a.studentId).localeCompare(String(b.studentId));
    });
    const out = await Promise.all(
      items.map(async (s) => {
        let application = null;
        if (s.applicationId) {
          application = await getApplicationByApplicationId(String(s.applicationId)).catch(() => null);
        }
        return { ...s, application };
      })
    );
    res.json({ items: out });
  })
);

router.get(
  '/:id',
  verifyToken,
  requireRole(...READ_ROLES),
  ah(async (req, res) => {
    const student = await getStudentById(req.params.id);
    if (!student) throw notFound('Student not found');
    // Full admission form data (guardian details, documents, ...) when the student came from an application
    let application = null;
    if (student.applicationId) {
      application = await getApplicationByApplicationId(String(student.applicationId)).catch(() => null);
    }
    res.json({ ...student, application });
  })
);

router.post(
  '/',
  verifyToken,
  requireRole(...WRITE_ROLES),
  ah(async (req, res) => {
    const input = parse(createSchema, req.body);
    const sessionId = input.sessionId ?? String(await getActiveSessionId());
    const student = await createStudent({ ...input, sessionId });
    await logAudit({
      actorUid: actor(req),
      action: 'student.create',
      targetCollection: 'students',
      targetId: student.id,
    });
    res.status(201).json(student);
  })
);

router.put(
  '/:id',
  verifyToken,
  requireRole(...WRITE_ROLES),
  ah(async (req, res) => {
    const updates = parse(updateSchema, req.body);
    const student = await updateStudent(req.params.id, updates);
    await logAudit({
      actorUid: actor(req),
      action: 'student.update',
      targetCollection: 'students',
      targetId: req.params.id,
    });
    res.json(student);
  })
);

// Soft delete: sets isActive=false (records are referenced by attendance, results, payments).
router.delete(
  '/:id',
  verifyToken,
  requireRole(...WRITE_ROLES),
  ah(async (req, res) => {
    await deactivateStudent(req.params.id);
    await logAudit({
      actorUid: actor(req),
      action: 'student.deactivate',
      targetCollection: 'students',
      targetId: req.params.id,
    });
    res.json({ success: true });
  })
);

// Permanent delete (test data / wrong entries): student + results + attendance + application.
router.delete(
  '/:id/permanent',
  verifyToken,
  requireRole(...WRITE_ROLES),
  ah(async (req, res) => {
    const removed = await deleteStudentPermanently(req.params.id);
    await logAudit({
      actorUid: actor(req),
      action: 'student.delete',
      targetCollection: 'students',
      targetId: req.params.id,
    });
    res.json({ success: true, removed });
  })
);

export default router;
