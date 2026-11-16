// src/utils/cards.ts
// Data builders + school info hook for ID cards and exam admit cards.
import { useMemo } from 'react';
import { useApiGet } from '@/hooks/useApi';
import { buildAdmissionForm, txt } from '@/utils/admissionForm';
import { classLabel } from '@/utils/classes';

export interface CardStudent {
  id: string;
  studentId: string;
  name: string;
  classId: string;
  sessionId: string;
  roll?: number | string;
  isActive?: boolean;
  [key: string]: unknown;
  application?: Record<string, unknown> | null;
}

export interface SchoolInfo {
  nameEn: string;
  nameBn: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
}

export const DEFAULT_SCHOOL: SchoolInfo = {
  nameEn: 'The Little Flower School',
  nameBn: 'দি লিটল ফ্লাওয়ার স্কুল',
  tagline: 'Learn • Grow • Shine',
  address: '',
  phone: '',
  email: '',
};

/** Reads the public school settings (name, address, phone, email). Falls back to defaults. */
export function useSchoolInfo(): SchoolInfo {
  const res = useApiGet<Record<string, unknown>>('/api/settings/public', []);
  return useMemo(() => {
    const raw = res.data as Record<string, unknown> | null | undefined;
    const s = (raw && typeof raw === 'object' && 'item' in raw ? (raw.item as Record<string, unknown>) : raw) ?? {};
    return {
      nameEn: txt(s.schoolNameEn) || DEFAULT_SCHOOL.nameEn,
      nameBn: txt(s.schoolNameBn) || DEFAULT_SCHOOL.nameBn,
      tagline: DEFAULT_SCHOOL.tagline,
      address: txt(s.address),
      phone: txt(s.phone),
      email: txt(s.email),
    };
  }, [res.data]);
}

export interface IdCardData {
  studentId: string;
  nameBn: string;
  nameEn: string;
  classLabel: string;
  roll: string;
  session: string;
  dob: string;
  bloodGroup: string;
  photo: string;
  fatherName: string;
  motherName: string;
  guardianName: string;
  guardianMobile: string;
}

export interface AdmitSubject {
  name: string;
  fullMarks: number;
  examDate?: string;
  startTime?: string;
  endTime?: string;
  isOptional?: boolean;
}

export interface AdmitCardData extends IdCardData {
  examId: string;
  examName: string;
  admitNo: string;
  subjects: AdmitSubject[];
}

/** 2013-08-15 → 15-08-2013 (other formats are returned as they are). */
export function fmtDob(v?: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v ?? '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : (v ?? '').replace(/\//g, '-');
}

export function buildIdCard(student: CardStudent): IdCardData {
  const form = buildAdmissionForm(student, student.application ?? null);
  const photoUrl = /^https?:\/\//.test(form.photo) ? form.photo : '';
  return {
    studentId: student.studentId,
    nameBn: txt(form.student.nameBn) || txt(student.name),
    nameEn: txt(form.student.nameEn),
    classLabel: classLabel(student.classId, false),
    roll: student.roll != null ? String(student.roll) : '',
    session: txt(student.sessionId),
    dob: fmtDob(txt(form.student.dateOfBirth)),
    bloodGroup: txt(form.student.bloodGroup),
    photo: photoUrl,
    fatherName: txt(form.guardian.fatherName),
    motherName: txt(form.guardian.motherName),
    guardianName: txt(form.guardian.guardianName) || txt(form.guardian.fatherName),
    guardianMobile: txt(form.guardian.mobile),
  };
}

export function admitNumber(session: string, roll: string, studentId: string): string {
  const tail = roll ? roll.padStart(3, '0') : studentId.replace(/\D/g, '').slice(-3).padStart(3, '0');
  return `TLFSE-${session || 'XXXX'}-${tail}`;
}

export function buildAdmitCard(
  student: CardStudent,
  exam: { id: string; name: string; sessionId?: string; subjects: AdmitSubject[] },
): AdmitCardData {
  const base = buildIdCard(student);
  return {
    ...base,
    examId: exam.id,
    examName: exam.name,
    admitNo: admitNumber(exam.sessionId || base.session, base.roll, base.studentId),
    subjects: exam.subjects,
  };
}

/** Sort by roll (numbers first), then by student id. */
export function sortByRoll<T extends { roll?: number | string; studentId?: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const ra = Number(a.roll);
    const rb = Number(b.roll);
    const na = Number.isFinite(ra) && a.roll !== '' && a.roll != null ? ra : 99999;
    const nb = Number.isFinite(rb) && b.roll !== '' && b.roll != null ? rb : 99999;
    if (na !== nb) return na - nb;
    return String(a.studentId ?? '').localeCompare(String(b.studentId ?? ''));
  });
}
