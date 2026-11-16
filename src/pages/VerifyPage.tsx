// src/pages/VerifyPage.tsx
// Opens when someone scans the QR code on an ID card / admit card. Shows only basic, non-sensitive details.
import { Link, useParams } from 'react-router-dom';
import { BadgeCheck, ShieldAlert } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useApiGet } from '@/hooks/useApi';
import { classLabel } from '@/utils/classes';
import SEOHead from '@/components/SEOHead';

interface VerifyItem {
  studentId: string;
  name: string;
  classId: string;
  roll: number | string | null;
  sessionId: string;
  isActive: boolean;
}

export default function VerifyPage() {
  const { isBengali } = useLanguage();
  const tr = (bn: string, en: string) => (isBengali ? bn : en);
  const { studentId = '' } = useParams();
  const res = useApiGet<{ item: VerifyItem }>(`/api/verify/student/${encodeURIComponent(studentId)}`, [studentId]);
  const item = res.data?.item;
  const loading = res.isLoading || (!res.data && !res.error);

  const row = (k: string, v: string) => (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
      <span className="text-ink-light">{k}</span>
      <span className="text-right font-semibold text-navy">{v || '—'}</span>
    </div>
  );

  return (
    <>
      <SEOHead title={tr('কার্ড যাচাই', 'Card verification')} noIndex />
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="card space-y-4 text-center">
          {loading ? (
            <p className="text-sm text-ink-light">
              {tr('যাচাই হচ্ছে… (সার্ভার ঘুমিয়ে থাকলে ১ মিনিট লাগতে পারে)', 'Verifying… (may take a minute if the server was asleep)')}
            </p>
          ) : item ? (
            <>
              <div className={`mx-auto inline-flex rounded-full p-3 ${item.isActive ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                {item.isActive ? <BadgeCheck size={40} /> : <ShieldAlert size={40} />}
              </div>
              <h1 className="text-lg font-bold text-navy font-bengali">
                {item.isActive
                  ? tr('এটি আমাদের স্কুলের বৈধ শিক্ষার্থী', 'Valid student of our school')
                  : tr('এই শিক্ষার্থী এখন সক্রিয় নয়', 'This student is no longer active')}
              </h1>
              <div className="text-left">
                {row(tr('নাম', 'Name'), item.name)}
                {row(tr('শ্রেণি', 'Class'), classLabel(item.classId, isBengali))}
                {row(tr('রোল', 'Roll'), item.roll != null ? String(item.roll) : '')}
                {row(tr('শিক্ষার্থী আইডি', 'Student ID'), item.studentId)}
                {row(tr('সেশন', 'Session'), item.sessionId)}
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto inline-flex rounded-full bg-error/10 p-3 text-error">
                <ShieldAlert size={40} />
              </div>
              <h1 className="text-lg font-bold text-navy font-bengali">
                {tr('কার্ডটি যাচাই করা যায়নি', 'Could not verify this card')}
              </h1>
              <p className="text-sm text-ink-light">
                {tr('এই আইডি দিয়ে কোনো শিক্ষার্থী পাওয়া যায়নি।', 'No student was found for this ID.')}
              </p>
            </>
          )}
          <Link to="/" className="btn-primary inline-flex">{tr('হোম', 'Home')}</Link>
        </div>
      </div>
    </>
  );
    }
