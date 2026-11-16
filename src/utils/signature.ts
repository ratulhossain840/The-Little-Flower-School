// src/utils/signature.ts
/**
 * Turns a phone photo of a signature (dark ink on white paper) into a small transparent PNG
 * data URL, so it prints cleanly on cards, marksheets and forms. Free – no upload service.
 */
export async function signatureFromFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Not an image');
  const bitmap = await createImageBitmap(file);
  for (const maxW of [460, 360, 280]) {
    const scale = Math.min(1, maxW / bitmap.width);
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.drawImage(bitmap, 0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    // estimate paper brightness (bright pixels) and make everything near it transparent
    let sum = 0;
    let n = 0;
    for (let i = 0; i < d.length; i += 16) {
      const lum = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
      if (lum > 120) {
        sum += lum;
        n++;
      }
    }
    const paper = n ? sum / n : 235;
    const hi = paper - 18;
    const lo = Math.max(40, paper - 130);
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
      const a = lum >= hi ? 0 : lum <= lo ? 255 : Math.round(((hi - lum) / (hi - lo)) * 255);
      d[i] = 10;
      d[i + 1] = 20;
      d[i + 2] = 60;
      d[i + 3] = a;
    }
    ctx.putImageData(img, 0, 0);
    const url = canvas.toDataURL('image/png');
    if (url.length <= 180_000) return url;
  }
  throw new Error('Image too large');
  }
