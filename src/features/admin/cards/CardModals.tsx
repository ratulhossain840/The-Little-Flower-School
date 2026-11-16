// src/features/admin/cards/CardModals.tsx
// ID cards for a whole class, and admit cards for an exam (whole class or one student).
import { useMemo, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useApiGet } from '@/hooks/useApi';
import PrintOverlay from '@/components/PrintOverlay';
import IdCardSheet from '@/components/IdCardSheet';
import AdmitCardSheet from '@/components/AdmitCardSheet';
import {
  buildAdmitCard,
  buildIdCard,
  sortByRoll,
  useSchoolInfo,
  type AdmitSubject,
  type CardStudent,
} from '@/utils/cards';

interface ClassOption {
  id: string;
  nameBn: string;
  nameEn: string;
}

interface CardsResponse {
  items: CardStudent[];
}

const shell = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4';

function Loading({ isBengali, error }: { isBengali: boolean; error: string | null }) {
  return (
    <div className={shell}>
      <div className="card w-full max-w-md text-center">
        <p className="text-sm text-ink/70">
          {error
            ? isBengali
              ? 'কার্ড তৈরি করা যায়নি। আবার চেষ্টা করুন।'
              : 'Could not build the cards. Please try again.'
            : isBengali
              ? 'শিক্ষার্থীর তথ্য লোড হচ্ছে… (সার্ভার ঘুমিয়ে থাকলে ১ মিনিট লাগতে পারে)'
              : 'Loading students… (may take up to a minute if the server was asleep)'}
        </p>
      </div>
    </div>
  );
}

/* ───────────── ID cards: whole class ───────────── */

function IdCardsLoader({ classId, onClose }: { classId: string; onClose: () => void }) {
  const { isBengali } = useLanguage();
  const school = useSchoolInfo();
  const res = useApiGet<CardsResponse>(`/api/students/cards?classId=${encodeURIComponent(classId)}`, [classId]);
  const cards = useMemo(() => sortByRoll(res.data?.items ?? []).map(buildIdCard), [res.data]);

  if (res.isLoading || (!res.data && !res.error)) return <Loading isBengali={isBengali} error={null} />;
  if (res.error) return <Loading isBengali={isBengali} error="err" />;
  if (cards.length === 0) {
    return (
      <div className={shell} onClick={onClose}>
        <div className="card w-full max-w-md text-center">
          <p className="text-sm text-ink/70">
            {isBengali ? 'এই শ্রেণিতে কোনো সক্রিয় শিক্ষার্থী নেই।' : 'No active students in this class.'}
          </p>
        </div>
      </div>
    );
  }
  return (
    <PrintOverlay onClose={onClose}>
      <IdCardSheet cards={cards} school={school} />
    </PrintOverlay>
  );
}

export function IdCardsClassModal({ classes, onClose }: { classes: ClassOption[]; onClose: () => void }) {
  const { isBengali } = useLanguage();
  const tr = (bn: string, en: string) => (isBengali ? bn : en);
  const [classId, setClassId] = useState('');
  const [go, setGo] = useState(false);

  if (go && classId) return <IdCardsLoader classId={classId} onClose={onClose} />;

  return (
    <div className={shell} onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true">
      <div className="card w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold text-navy">{tr('শ্রেণির আইডি কার্ড', 'Class ID cards')}</h2>
        <div>
          <label className="label" htmlFor="idc-class">{tr('শ্রেণি', 'Class')}</label>
          <select id="idc-class" className="input-field" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">{tr('শ্রেণি নির্বাচন করুন', 'Select a class')}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{isBengali ? c.nameBn : c.nameEn}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-ink/60">
          {tr(
            'শ্রেণির সব সক্রিয় শিক্ষার্থীর কার্ড রোল অনুযায়ী তৈরি হবে। A4 পেজে ৯টি করে; আগে সামনের পেজ, তারপর পেছনের পেজ।',
            'Cards for all active students of the class, by roll. 9 per A4 page: fronts first, then backs.',
          )}
        </p>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded border border-navy/30 px-4 py-2 text-sm text-navy hover:bg-navy/5">
            {tr('বাতিল', 'Cancel')}
          </button>
          <button type="button" disabled={!classId} onClick={() => setGo(true)} className="btn-primary disabled:opacity-50">
            {tr('কার্ড তৈরি করুন', 'Generate cards')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Admit cards: exam ───────────── */

export interface AdmitExam {
  id: string;
  name: string;
  classId: string;
  sessionId?: string;
  subjects: AdmitSubject[];
}

function AdmitLoader({ exam, studentId, onClose }: { exam: AdmitExam; studentId: string; onClose: () => void }) {
  const { isBengali } = useLanguage();
  const school = useSchoolInfo();
  const res = useApiGet<CardsResponse>(`/api/students/cards?classId=${encodeURIComponent(exam.classId)}`, [exam.classId]);
  const cards = useMemo(() => {
    const list = sortByRoll(res.data?.items ?? []).filter((s) => !studentId || s.id === studentId);
    return list.map((s) => buildAdmitCard(s, exam));
  }, [res.data, exam, studentId]);

  if (res.isLoading || (!res.data && !res.error)) return <Loading isBengali={isBengali} error={null} />;
  if (res.error) return <Loading isBengali={isBengali} error="err" />;
  if (cards.length === 0) {
    return (
      <div className={shell} onClick={onClose}>
        <div className="card w-full max-w-md text-center">
          <p className="text-sm text-ink/70">
            {isBengali ? 'এই শ্রেণিতে কোনো সক্রিয় শিক্ষার্থী নেই।' : 'No active students in this class.'}
          </p>
        </div>
      </div>
    );
  }
  return (
    <PrintOverlay onClose={onClose}>
      <AdmitCardSheet cards={cards} school={school} />
    </PrintOverlay>
  );
}

export function AdmitCardsModal({ exam, onClose }: { exam: AdmitExam; onClose: () => void }) {
  const { isBengali } = useLanguage();
  const tr = (bn: string, en: string) => (isBengali ? bn : en);
  const [studentId, setStudentId] = useState('');
  const [go, setGo] = useState(false);
  const list = useApiGet<CardsResponse>(`/api/students/cards?classId=${encodeURIComponent(exam.classId)}`, [exam.classId]);
  const students = useMemo(() => sortByRoll(list.data?.items ?? []), [list.data]);

  if (go) return <AdmitLoader exam={exam} studentId={studentId} onClose={onClose} />;

  const noSchedule = !exam.subjects.some((s) => s.examDate || s.startTime);

  return (
    <div className={shell} onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true">
      <div className="card w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold text-navy">{tr('এডমিট কার্ড', 'Admit cards')}</h2>
        <p className="text-sm text-ink/80">{exam.name}</p>
        <div>
          <label className="label" htmlFor="adm-stu">{tr('শিক্ষার্থী', 'Student')}</label>
          <select id="adm-stu" className="input-field" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">{tr('শ্রেণির সবাই', 'All students of the class')}</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.roll ? `${s.roll} — ` : ''}{s.name}
              </option>
            ))}
          </select>
        </div>
        {noSchedule && (
          <p className="rounded bg-amber-50 p-2 text-xs text-amber-900">
            {tr(
              'এই পরীক্ষায় বিষয়ের তারিখ/সময় দেওয়া নেই। "সম্পাদনা"য় গিয়ে তারিখ ও সময় দিলে এডমিট কার্ডে আসবে।',
              'No date/time is set for the subjects. Add them via "Edit" to show them on the admit card.',
            )}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded border border-navy/30 px-4 py-2 text-sm text-navy hover:bg-navy/5">
            {tr('বাতিল', 'Cancel')}
          </button>
          <button type="button" onClick={() => setGo(true)} className="btn-primary">
            {tr('কার্ড তৈরি করুন', 'Generate cards')}
          </button>
        </div>
      </div>
    </div>
  );
}
