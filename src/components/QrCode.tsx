// src/components/QrCode.tsx
import { useMemo } from 'react';
import { qrMatrix } from '@/utils/qr';

/** Crisp SVG QR code (works in print / PDF). */
export default function QrCode({ value, size }: { value: string; size: number }) {
  const m = useMemo(() => {
    try {
      return qrMatrix(value);
    } catch {
      return null;
    }
  }, [value]);
  if (!m) return <div style={{ width: size, height: size }} />;
  const n = m.length;
  let d = '';
  for (let y = 0; y < n; y++) {
    let x = 0;
    while (x < n) {
      if (m[y][x]) {
        let w = 1;
        while (x + w < n && m[y][x + w]) w++;
        d += `M${x} ${y}h${w}v1h-${w}z`;
        x += w;
      } else x++;
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" style={{ display: 'block' }}>
      <path d={d} fill="#0b1f4f" />
    </svg>
  );
      }
