// server/src/routes/verify.ts
// Public: what you see after scanning the QR code on an ID card / admit card.
// Only non-sensitive fields are returned (no guardian, mobile, address, photo).
import { Router } from 'express';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { rateLimit } from '../middleware/rateLimit';
import { findStudentByStudentId } from '../services/student.service';
import { notFound } from '../utils/errors';

const router = Router();

const ah =
  (fn: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

router.get(
  '/student/:studentId',
  rateLimit({ windowMs: 60_000, max: 30 }),
  ah(async (req, res) => {
    const id = String(req.params.studentId ?? '').trim();
    if (!/^[A-Za-z0-9_-]{3,40}$/.test(id)) throw notFound('Student');
    const s = await findStudentByStudentId(id);
    if (!s) throw notFound('Student');
    res.set('Cache-Control', 'no-store');
    res.json({
      item: {
        studentId: s.studentId,
        name: s.name,
        classId: s.classId,
        roll: s.roll ?? null,
        sessionId: s.sessionId,
        isActive: s.isActive !== false,
      },
    });
  }),
);

export default router;
