// src/components/AdmitCardSheet.tsx
// Exam admit card (190 × 132 mm, navy & gold design) – 2 cards per A4 page.
import type { CSSProperties, ReactNode } from 'react';
import QrCode from './QrCode';
import { Box, GoldDefs, ICONS, NAVY, GOLD, RoundLogo, exact } from './CardParts';
import type { AdmitCardData, AdmitSubject, SchoolInfo } from '@/utils/cards';

const mm = (n: number) => `${n}mm`;

function fmtDate(v?: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v ?? '');
  if (!m) return v ?? '';
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const day = d.toLocaleDateString('en-US', { weekday: 'long' });
  return `${date} (${day})`;
}

function fmtTime(v?: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v ?? '');
  if (!m) return v ?? '';
  const h = Number(m[1]);
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${m[2]} ${h >= 12 ? 'PM' : 'AM'}`;
}

function timeRange(s: AdmitSubject): string {
  if (s.startTime && s.endTime) return `${fmtTime(s.startTime)} – ${fmtTime(s.endTime)}`;
  if (s.startTime) return fmtTime(s.startTime);
  return '';
}

const lbl: CSSProperties = {
  background: NAVY,
  color: '#fff',
  fontWeight: 800,
  fontSize: 10.5,
  padding: '0 7px',
  width: mm(37),
  border: '0.4mm solid #fff',
  boxSizing: 'border-box',
  ...exact,
};
const val: CSSProperties = {
  fontWeight: 800,
  fontSize: 10.5,
  padding: '0 7px',
  border: `0.3mm solid ${NAVY}`,
  boxSizing: 'border-box',
  background: '#fff',
  color: '#111',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  ...exact,
};

export function AdmitCard({ c, school }: { c: AdmitCardData; school: SchoolInfo }) {
  const words = school.nameEn.toUpperCase();
  const hasSchedule = c.subjects.some((s) => s.examDate || s.startTime);
  const rowH = Math.min(4.4, 30 / (c.subjects.length + 1.2));
  const rowPx = `${rowH}mm`;
  const fs = rowH >= 4 ? 9 : rowH >= 3.5 ? 8 : 7;
  const th: CSSProperties = {
    background: NAVY, color: '#fff', fontWeight: 800, fontSize: fs, border: `0.2mm solid ${NAVY}`,
    height: rowPx, padding: 0, lineHeight: 1, ...exact,
  };
  const td: CSSProperties = {
    fontSize: fs, fontWeight: 700, border: `0.2mm solid ${NAVY}`, height: rowPx, padding: '0 4px', lineHeight: 1,
    textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', color: '#111',
  };

  const infoRows: Array<[string, ReactNode]> = [
    [
      'Student Name',
      <>
        {c.nameEn || c.nameBn}
        {c.nameEn && c.nameBn ? <span style={{ fontWeight: 700, fontSize: 9.5 }}>  ({c.nameBn})</span> : null}
      </>,
    ],
    ["Father's Name", c.fatherName || '—'],
    ['Class', c.classLabel],
    ['Roll Number', c.roll || '—'],
    ['Student ID', c.studentId],
    ['Exam Name', c.examName],
    ['Admit Card No', c.admitNo],
  ];

  return (
    <div
      style={{
        width: mm(190), height: mm(132), position: 'relative', overflow: 'hidden', background: '#fff',
        border: '0.3mm solid #cfd6e4', boxSizing: 'border-box', color: NAVY, lineHeight: 1.15, ...exact,
      }}
    >
      {/* header */}
      <svg viewBox="0 0 190 32" style={{ position: 'absolute', left: 0, top: 0, width: mm(190), height: mm(32), ...exact }}>
        <GoldDefs id="adg" />
        <path d="M0 0H190V25C140 22 70 31 0 26Z" fill={NAVY} />
        <path d="M0 26C70 31 140 22 190 25L190 27C140 24 70 33 0 28Z" fill="url(#adg)" />
        <path d="M153 0H157L145 27H141Z" fill="url(#adg)" />
      </svg>
      <Box style={{ left: mm(4), top: mm(2.5) }}>
        <RoundLogo size={Math.round(22 * 3.78)} />
      </Box>
      <Box style={{ left: mm(30), top: mm(3), width: mm(125), textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: 0.4, whiteSpace: 'nowrap' }}>{words}</div>
        <div style={{ fontSize: 12, fontStyle: 'italic', color: '#f3d77a', fontWeight: 600 }}>— {school.tagline} —</div>
        {school.address ? (
          <div style={{ fontSize: 8.5, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="#fff"><path d={ICONS.pin} /></svg>
            <span>{school.address}</span>
          </div>
        ) : null}
      </Box>
      <Box style={{ left: mm(160), top: mm(5), width: mm(28), textAlign: 'center', color: '#fff', fontStyle: 'italic', fontWeight: 600, fontSize: 10, lineHeight: 1.25 }}>
        Education<br />Builds a<br />Better Future
      </Box>

      {/* title */}
      <Box style={{ left: mm(55), top: mm(25), width: mm(80), height: mm(8), background: NAVY, border: `0.5mm solid ${GOLD}`, borderRadius: mm(3), boxSizing: 'border-box', color: '#fff', textAlign: 'center', fontWeight: 800, fontSize: 15, lineHeight: mm(7), letterSpacing: 0.5, ...exact }}>
        EXAM ADMIT CARD
      </Box>

      {/* info table */}
      <table style={{ position: 'absolute', left: mm(6), top: mm(36), width: mm(116), borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <tbody>
          {infoRows.map(([k, v]) => (
            <tr key={k} style={{ height: mm(5.3) }}>
              <td style={lbl}>{k}</td>
              <td style={val}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* photo */}
      <Box style={{ left: mm(127), top: mm(36), width: mm(28), height: mm(34), border: `0.6mm solid ${NAVY}`, borderRadius: mm(1.5), boxSizing: 'border-box', background: '#1e88e5', overflow: 'hidden', ...exact }}>
        {c.photo ? (
          <img src={c.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ color: '#fff', fontSize: 9, textAlign: 'center', paddingTop: mm(14) }}>PHOTO</div>
        )}
      </Box>

      {/* QR */}
      <Box style={{ left: mm(159), top: mm(36), width: mm(26), height: mm(26), background: '#fff', border: '0.3mm solid #cfd6e4', boxSizing: 'border-box', padding: mm(1.2) }}>
        <QrCode value={`TLFS|${c.studentId}|${c.admitNo}`} size={Math.round(23.6 * 3.78)} />
      </Box>
      <Box style={{ left: mm(159), top: mm(63.5), width: mm(26), height: mm(7), background: NAVY, color: '#fff', borderRadius: mm(1.2), fontSize: 7.5, fontWeight: 800, textAlign: 'center', lineHeight: 1.15, display: 'flex', alignItems: 'center', justifyContent: 'center', ...exact }}>
        Scan for<br />Verification
      </Box>

      {/* routine */}
      <table style={{ position: 'absolute', left: mm(6), top: mm(74.5), width: mm(178), borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {hasSchedule && <th style={{ ...th, width: mm(52) }}>Exam Date</th>}
            {hasSchedule && <th style={{ ...th, width: mm(42) }}>Time</th>}
            <th style={th}>Subject</th>
            <th style={{ ...th, width: mm(24) }}>Full Marks</th>
          </tr>
        </thead>
        <tbody>
          {c.subjects.map((s, i) => (
            <tr key={`${s.name}-${i}`}>
              {hasSchedule && <td style={td}>{fmtDate(s.examDate) || '—'}</td>}
              {hasSchedule && <td style={td}>{timeRange(s) || '—'}</td>}
              <td style={{ ...td, textAlign: 'left' }}>{s.name}{s.isOptional ? ' (Optional)' : ''}</td>
              <td style={td}>{s.fullMarks}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* instructions */}
      <Box style={{ left: mm(6), top: mm(109), width: mm(108), height: mm(15.5), border: `0.3mm solid ${NAVY}`, borderRadius: mm(1.5), boxSizing: 'border-box', background: '#f4f7ff', ...exact }}>
        <div style={{ position: 'absolute', left: mm(1.5), top: mm(-2.2), background: NAVY, color: '#fff', borderRadius: mm(2), padding: '0 8px 0 4px', fontSize: 9, fontWeight: 800, height: mm(4.6), lineHeight: mm(4.6), display: 'flex', alignItems: 'center', gap: 4, ...exact }}>
          <svg width="11" height="11" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2z" fill="#ffd23f" /><path d="M11 9h2v6h-2zM11 16.5h2v2h-2z" fill={NAVY} /></svg> Important Instructions
        </div>
        <ol style={{ margin: 0, padding: `${mm(3)} 0 0 ${mm(7)}`, fontSize: 7.4, fontWeight: 600, lineHeight: 1.3 }}>
          <li>Bring this Admit Card to the Examination Hall.</li>
          <li>Follow all instructions of the Invigilator.</li>
          <li>No Electronic Device is allowed.</li>
          <li>Report at least 30 minutes before the exam.</li>
        </ol>
      </Box>

      {/* signatures */}
      <Box style={{ left: mm(120), top: mm(117), width: mm(32), borderTop: `0.3mm solid ${NAVY}`, paddingTop: mm(0.6), fontSize: 7.6, fontWeight: 800, textAlign: 'center' }}>
        Controller of Examinations
      </Box>
      <Box style={{ left: mm(156), top: mm(117), width: mm(28), borderTop: `0.3mm solid ${NAVY}`, paddingTop: mm(0.6), fontSize: 7.6, fontWeight: 800, textAlign: 'center' }}>
        Principal
      </Box>

      {/* footer */}
      <Box style={{ left: 0, top: mm(125.5), width: mm(190), height: mm(6.5), background: NAVY, color: '#fff', textAlign: 'center', fontSize: 11, fontStyle: 'italic', fontWeight: 700, lineHeight: mm(6.5), borderTop: `0.6mm solid ${GOLD}`, boxSizing: 'border-box', ...exact }}>
        Best of Luck for Your Examination
      </Box>
    </div>
  );
}

const css = `
@page { size: A4; margin: 8mm; }
.adc-page { width: 194mm; height: 280mm; overflow: hidden; page-break-after: always; break-after: page; display: flex; flex-direction: column; align-items: center; gap: 6mm; }
.adc-page:last-child { page-break-after: auto; break-after: auto; }
`;

export default function AdmitCardSheet({ cards, school }: { cards: AdmitCardData[]; school: SchoolInfo }) {
  const pages: AdmitCardData[][] = [];
  for (let i = 0; i < cards.length; i += 2) pages.push(cards.slice(i, i + 2));
  return (
    <div style={exact}>
      <style>{css}</style>
      {pages.map((list, p) => (
        <div className="adc-page" key={p}>
          {list.map((c) => (
            <AdmitCard key={`${c.examId}-${c.studentId}`} c={c} school={school} />
          ))}
        </div>
      ))}
    </div>
  );
      }
