// src/components/SignaturePad.tsx
// Draw a signature with a finger / mouse. Saves a small, tightly cropped, transparent PNG (data URL).
import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as RPointerEvent } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

const W = 900;
const H = 360;
const INK = '#0a143c';

export default function SignaturePad({ onSave, onCancel }: { onSave: (dataUrl: string) => void; onCancel: () => void }) {
  const { isBengali } = useLanguage();
  const tr = (bn: string, en: string) => (isBengali ? bn : en);
  const ref = useRef<HTMLCanvasElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const pos = (e: RPointerEvent<HTMLCanvasElement>) => {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  const down = (e: RPointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    ref.current?.setPointerCapture(e.pointerId);
    const p = pos(e);
    last.current = p;
    const ctx = ref.current!.getContext('2d')!;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
    setHasInk(true);
    setMsg('');
  };

  const move = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (!last.current) return;
    e.preventDefault();
    const p = pos(e);
    const ctx = ref.current!.getContext('2d')!;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const up = () => {
    last.current = null;
  };

  const clear = () => {
    ref.current?.getContext('2d')?.clearRect(0, 0, W, H);
    setHasInk(false);
    setMsg('');
  };

  const save = () => {
    const c = ref.current!;
    const ctx = c.getContext('2d')!;
    const { data } = ctx.getImageData(0, 0, W, H);
    let minX = W, minY = H, maxX = -1, maxY = -1;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (data[(y * W + x) * 4 + 3] > 20) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0 || maxX - minX < 20) {
      setMsg(tr('আগে সাদা জায়গায় সই করুন।', 'Please sign in the white box first.'));
      return;
    }
    const pad = 8;
    const sx = Math.max(0, minX - pad);
    const sy = Math.max(0, minY - pad);
    const sw = Math.min(W, maxX + pad) - sx;
    const sh = Math.min(H, maxY + pad) - sy;
    const scale = Math.min(1, 480 / sw);
    const out = document.createElement('canvas');
    out.width = Math.max(1, Math.round(sw * scale));
    out.height = Math.max(1, Math.round(sh * scale));
    out.getContext('2d')!.drawImage(c, sx, sy, sw, sh, 0, 0, out.width, out.height);
    onSave(out.toDataURL('image/png'));
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-3" role="dialog" aria-modal="true">
      <div className="card w-full max-w-lg space-y-3">
        <h2 className="text-lg font-semibold text-navy">{tr('সই করুন', 'Draw the signature')}</h2>
        <p className="text-xs text-ink/60">
          {tr('আঙুল দিয়ে নিচের সাদা বক্সে সই করুন। ভুল হলে "মুছুন" চাপুন।', 'Sign in the white box with your finger. Tap "Clear" to redo.')}
        </p>
        <div className="relative overflow-hidden rounded border-2 border-dashed border-navy/30 bg-white">
          <div className="pointer-events-none absolute bottom-[28%] left-[6%] right-[6%] border-b border-navy/20" />
          <canvas
            ref={ref}
            width={W}
            height={H}
            className="block w-full"
            style={{ touchAction: 'none', aspectRatio: `${W} / ${H}` }}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            onPointerLeave={up}
          />
        </div>
        {msg && <p className="error-text">{msg}</p>}
        <div className="flex flex-wrap justify-between gap-2">
          <button type="button" onClick={clear} disabled={!hasInk} className="rounded border border-navy/30 px-4 py-2 text-sm text-navy disabled:opacity-50">
            {tr('মুছুন', 'Clear')}
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="rounded border border-navy/30 px-4 py-2 text-sm text-navy">
              {tr('বাতিল', 'Cancel')}
            </button>
            <button type="button" onClick={save} className="btn-primary">
              {tr('সই সংরক্ষণ', 'Save signature')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
