// src/components/IdCardSheet.tsx
// Student ID card (54 × 86 mm, navy & gold design) – front + back, printable on A4.
import type { CSSProperties } from 'react';
import QrCode from './QrCode';
import { Box, BookMark, GoldDefs, ICONS, Icon, NAVY, GOLD, RoundLogo, exact, useFitZoom } from './CardParts';
import type { IdCardData, SchoolInfo } from '@/utils/cards';

export const CARD_W = 204; // px  ≈ 54 mm
export const CARD_H = 325; // px  ≈ 86 mm

const base: CSSProperties = {
  width: CARD_W,
  height: CARD_H,
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 11,
  background: '#fff',
  border: '0.5px solid #d6dbe6',
  boxSizing: 'border-box',
  color: NAVY,
  lineHeight: 1.15,
  ...exact,
};

function nameSize(n: string): number {
  if (n.length <= 13) return 15;
  if (n.length <= 18) return 12.5;
  if (n.length <= 25) return 10.5;
  return 9;
}

function Row({ icon, k, v }: { icon: string; k: string; v: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: 12.5, gap: 5, whiteSpace: 'nowrap' }}>
      <Icon d={icon} size={11} />
      <span style={{ width: 62, fontSize: 8, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>{k}</span>
      <span style={{ fontSize: 8, fontWeight: 700 }}>:</span>
      <span style={{ fontSize: 8.3, fontWeight: 800, marginLeft: 1, whiteSpace: 'nowrap' }}>{v || '—'}</span>
    </div>
  );
}

export function IdCardFront({ c, school }: { c: IdCardData; school: SchoolInfo }) {
  const main = c.nameEn || c.nameBn;
  const sub = c.nameEn && c.nameBn ? c.nameBn : 'Student';
  const words = school.nameEn.toUpperCase().split(' ');
  const mid = Math.ceil(words.length / 2);
  const line1 = words.slice(0, mid).join(' ');
  const line2 = words.slice(mid).join(' ');
  return (
    <div style={base}>
      <svg width={CARD_W} height={124} viewBox="0 0 204 124" style={{ position: 'absolute', left: 0, top: 0, ...exact }}>
        <GoldDefs id="idg1" />
        <path d="M0 0H204V58C150 58 80 76 0 124Z" fill={NAVY} />
        <path d="M204 54C150 54 80 72 0 118L0 124C80 76 150 58 204 58Z" fill="url(#idg1)" />
      </svg>

      <Box style={{ left: 7, top: 8 }}>
        <RoundLogo size={56} />
      </Box>
      <Box style={{ left: 68, top: 11, width: 130, textAlign: 'center', color: '#fff', whiteSpace: 'nowrap' }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.2, lineHeight: 1.15 }}>{line1}</div>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.2, lineHeight: 1.15 }}>{line2}</div>
        <div style={{ fontSize: 8, fontStyle: 'italic', color: '#f3d77a', marginTop: 3 }}>
          — {school.tagline} —
        </div>
      </Box>

      <Box
        style={{
          left: 60,
          top: 70,
          width: 84,
          height: 100,
          borderRadius: 8,
          border: `2px solid ${GOLD}`,
          boxSizing: 'border-box',
          background: '#1e88e5',
          overflow: 'hidden',
          ...exact,
        }}
      >
        {c.photo ? (
          <img src={c.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ color: '#fff', fontSize: 9, textAlign: 'center', paddingTop: 44 }}>PHOTO</div>
        )}
      </Box>

      <Box
        style={{
          left: 10,
          top: 177,
          width: 184,
          height: 30,
          background: NAVY,
          color: '#fff',
          textAlign: 'center',
          clipPath: 'polygon(6px 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 6px 100%, 0 50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          ...exact,
        }}
      >
        <div style={{ fontSize: nameSize(main), fontWeight: 800, lineHeight: 1.05, whiteSpace: 'nowrap' }}>{main}</div>
        <div style={{ fontSize: 8.5, color: '#f3d77a', fontWeight: 700, lineHeight: 1.1, whiteSpace: 'nowrap' }}>{sub}</div>
      </Box>

      <Box style={{ left: 12, top: 213, width: 184 }}>
        <Row icon={ICONS.person} k="Student ID" v={c.studentId} />
        <Row icon={ICONS.cap} k="Class" v={c.classLabel} />
        <Row icon={ICONS.group} k="Roll No." v={c.roll} />
        <Row icon={ICONS.calendar} k="Date of Birth" v={c.dob} />
        {c.bloodGroup ? <Row icon={ICONS.drop} k="Blood Group" v={c.bloodGroup} /> : null}
      </Box>

      <Box style={{ left: 155, top: 262, width: 42, height: 42, background: '#fff', padding: 2, boxSizing: 'border-box', border: `1px solid ${GOLD}`, borderRadius: 3 }}>
        <QrCode value={`TLFS|${c.studentId}`} size={36} />
      </Box>

      {school.signature ? (
        <Box style={{ left: 24, top: 276, width: 64, height: 18, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <img src={school.signature} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </Box>
      ) : null}
      <Box style={{ left: 14, top: 296, width: 84, borderTop: `1px solid ${NAVY}`, paddingTop: 1.5, fontSize: 7, fontWeight: 700, textAlign: 'center' }}>
        Principal’s Signature
      </Box>

      <svg width={CARD_W} height={16} viewBox="0 0 204 16" style={{ position: 'absolute', left: 0, bottom: 0, ...exact }}>
        <path d="M0 16V6C50 14 150 -4 204 5V16Z" fill={NAVY} />
        <path d="M0 6C50 14 150 -4 204 5" stroke={GOLD} strokeWidth="1.4" fill="none" />
      </svg>
    </div>
  );
}

function InfoLine({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 5 }}>
      <Icon d={icon} size={13} />
      <span style={{ fontSize: 8.3, fontWeight: 600, lineHeight: 1.2, wordBreak: 'break-word' }}>{text}</span>
    </div>
  );
}

export function IdCardBack({ c, school }: { c: IdCardData; school: SchoolInfo }) {
  const notice = [
    'This ID Card is non-transferable.',
    'Keep it safe and show it when required.',
    'Loss of this card should be reported immediately to the school authority.',
  ];
  return (
    <div style={base}>
      <svg width={CARD_W} height={86} viewBox="0 0 204 86" style={{ position: 'absolute', left: 0, top: 0, ...exact }}>
        <GoldDefs id="idg2" />
        <path d="M0 0H204V60C150 56 60 78 0 52Z" fill={NAVY} />
        <path d="M0 52C60 78 150 56 204 60L204 66C150 62 60 84 0 58Z" fill="url(#idg2)" />
      </svg>
      <Box style={{ left: 0, top: 14, width: CARD_W, textAlign: 'center', color: '#fff', fontStyle: 'italic', fontWeight: 600 }}>
        <div style={{ fontSize: 12.5 }}>“Education Today…</div>
        <div style={{ fontSize: 12.5 }}>A Brighter Tomorrow”</div>
      </Box>

      <Box
        style={{
          left: 38, top: 84, width: 128, height: 17, borderRadius: 9, background: NAVY, color: '#fff',
          fontSize: 9.5, fontWeight: 800, textAlign: 'center', lineHeight: '17px', ...exact,
        }}
      >
        School Information
      </Box>
      <Box style={{ left: 14, top: 108, width: 178 }}>
        {school.address ? <InfoLine icon={ICONS.pin} text={school.address} /> : null}
        {school.phone ? <InfoLine icon={ICONS.phone} text={school.phone} /> : null}
        {school.email ? <InfoLine icon={ICONS.mail} text={school.email} /> : null}
      </Box>

      <Box style={{ left: 14, top: 172, width: 176, height: 1.5, background: GOLD, ...exact }} />

      <Box
        style={{
          left: 50, top: 178, width: 104, height: 16, borderRadius: 8, background: NAVY, color: '#fff',
          fontSize: 9.5, fontWeight: 800, textAlign: 'center', lineHeight: '16px', ...exact,
        }}
      >
        Important Notice
      </Box>
      <Box style={{ left: 16, top: 199, width: 174 }}>
        {notice.map((t) => (
          <div key={t} style={{ display: 'flex', gap: 5, marginBottom: 2.5, fontSize: 7.6, fontWeight: 600, lineHeight: 1.2 }}>
            <span style={{ width: 4, height: 4, borderRadius: 2, background: NAVY, marginTop: 3, flexShrink: 0, ...exact }} />
            <span>{t}</span>
          </div>
        ))}
      </Box>

      {c.guardianMobile ? (
        <Box
          style={{
            left: 14, top: 243, width: 176, boxSizing: 'border-box', border: `1px solid ${GOLD}`, borderRadius: 5,
            padding: '3px 6px', fontSize: 7.4, lineHeight: 1.3,
          }}
        >
          <div><b>Guardian:</b> {c.guardianName || '—'}</div>
          <div><b>Mobile:</b> {c.guardianMobile}{c.session ? <>  ·  <b>Session:</b> {c.session}</> : null}</div>
        </Box>
      ) : null}

      <svg width={CARD_W} height={50} viewBox="0 0 204 50" style={{ position: 'absolute', left: 0, bottom: 0, ...exact }}>
        <GoldDefs id="idg3" />
        <path d="M0 50V12C60 -2 150 20 204 5V50Z" fill={NAVY} />
        <path d="M0 12C60 -2 150 20 204 5L204 9C150 24 60 2 0 16Z" fill="url(#idg3)" />
      </svg>
      <Box style={{ left: 0, bottom: 5, width: CARD_W, textAlign: 'center', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 1 }}>
          <BookMark width={26} />
        </div>
        <div style={{ fontSize: 10.5, fontWeight: 800 }}>{school.nameEn}</div>
        <div style={{ fontSize: 7.6, fontStyle: 'italic', color: '#f3d77a' }}>— {school.tagline} —</div>
      </Box>
    </div>
  );
}

const sheetCss = `
@page { size: A4; margin: 8mm; }
.idc-page { width: 194mm; height: 280mm; overflow: hidden; page-break-after: always; break-after: page; }
.idc-page:last-child { page-break-after: auto; break-after: auto; }
.idc-grid { display: grid; grid-template-columns: repeat(3, ${CARD_W}px); column-gap: 8mm; row-gap: 6mm; justify-content: center; }
.idc-single { display: flex; gap: 8mm; justify-content: center; padding-top: 10mm; }
@media print { .fit-zoom { zoom: 1 !important; } }
@media screen { .idc-page { width: auto; height: auto; margin-bottom: 16px; } }
`;

/**
 * One card → front & back side by side.
 * Many cards → 9 per A4 page: a page of fronts, then a page of backs
 * (backs are mirrored left↔right so they line up when printed on both sides).
 */
export default function IdCardSheet({ cards, school }: { cards: IdCardData[]; school: SchoolInfo }) {
  const fit = useFitZoom(cards.length === 1 ? 470 : 700);
  if (cards.length === 1) {
    return (
      <div className="idc-page fit-zoom" style={{ ...exact, ...fit }}>
        <style>{sheetCss}</style>
        <div className="idc-single">
          <IdCardFront c={cards[0]} school={school} />
          <IdCardBack c={cards[0]} school={school} />
        </div>
      </div>
    );
  }
  const pages: IdCardData[][] = [];
  for (let i = 0; i < cards.length; i += 9) pages.push(cards.slice(i, i + 9));
  // backs: mirror every row of 3 (short rows are pushed to the right edge)
  const mirror = (list: IdCardData[]): Array<IdCardData | null> => {
    const out: Array<IdCardData | null> = [];
    for (let i = 0; i < list.length; i += 3) {
      const row: Array<IdCardData | null> = list.slice(i, i + 3).reverse();
      while (row.length < 3) row.unshift(null);
      out.push(...row);
    }
    return out;
  };
  return (
    <div className="fit-zoom" style={{ ...exact, ...fit }}>
      <style>{sheetCss}</style>
      {pages.flatMap((list, p) => [
        <div className="idc-page" key={`f${p}`}>
          <div className="idc-grid">
            {list.map((c) => (
              <IdCardFront key={`f-${c.studentId}`} c={c} school={school} />
            ))}
          </div>
        </div>,
        <div className="idc-page" key={`b${p}`}>
          <div className="idc-grid">
            {mirror(list).map((c, k) =>
              c ? <IdCardBack key={`b-${c.studentId}`} c={c} school={school} /> : <div key={`e${k}`} />,
            )}
          </div>
        </div>,
      ])}
    </div>
  );
}
