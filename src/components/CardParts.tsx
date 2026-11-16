// src/components/CardParts.tsx
// Shared colours + small pieces for the ID card and the admit card (navy & gold design).
import type { CSSProperties, ReactNode } from 'react';

export const NAVY = '#0b1f4f';
export const NAVY_2 = '#12306e';
export const GOLD = '#c9a227';
export const GOLD_LIGHT = '#f3d77a';

export const exact: CSSProperties = {
  WebkitPrintColorAdjust: 'exact',
  printColorAdjust: 'exact',
} as CSSProperties;

/** Gold gradient definition – include once inside an <svg>. */
export function GoldDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#9a7414" />
        <stop offset="0.5" stopColor={GOLD_LIGHT} />
        <stop offset="1" stopColor="#b8901f" />
      </linearGradient>
    </defs>
  );
}

/** Round school logo (public/images/logo.png) with a gold ring. */
export function RoundLogo({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#fff',
        border: `${Math.max(1.5, size / 40)}px solid ${GOLD}`,
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...exact,
      }}
    >
      <img src="/images/logo.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
}

export function Icon({ d, size, bg = NAVY }: { d: string; size: number; bg?: string }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...exact,
      }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="#fff">
        <path d={d} />
      </svg>
    </span>
  );
}

export const ICONS = {
  person: 'M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-3 0-8 1.5-8 4v2h16v-2c0-2.5-5-4-8-4z',
  cap: 'M12 3L1 9l11 6 9-4.9V17h2V9L12 3zM5 13.2v4L12 21l7-3.8v-4L12 17l-7-3.8z',
  group:
    'M16 11a3 3 0 100-6 3 3 0 000 6zM8 11a3 3 0 100-6 3 3 0 000 6zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13zm8 0c-.3 0-.6 0-1 .1 1.2.8 2 2 2 3.4V19h6v-2.5c0-2.3-4.7-3.5-7-3.5z',
  calendar:
    'M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V9h14v11z',
  drop: 'M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z',
  pin: 'M12 2a7 7 0 00-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 119.5 9 2.5 2.5 0 0112 11.5z',
  phone:
    'M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 11.4 11.4 0 003.6.6 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.6 3.6a1 1 0 01-.25 1z',
  mail: 'M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
};

/** Gold open-book mark used in the footers. */
export function BookMark({ width }: { width: number }) {
  return (
    <svg width={width} height={width * 0.6} viewBox="0 0 60 36" fill={GOLD} style={exact}>
      <path d="M30 8C24 3 12 2 2 4v26c10-2 22-1 28 4 6-5 18-6 28-4V4C48 2 36 3 30 8z" opacity="0.95" />
      <path d="M30 10v22" stroke={NAVY} strokeWidth="1.6" fill="none" />
    </svg>
  );
}

export function Box({ children, style }: { children?: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: 'absolute', ...style }}>{children}</div>;
  }
