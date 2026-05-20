import type { BrushOptions } from '@/types';

function strengthAt(distance: number, size: number, hardness: number): number {
  if (distance >= size) return 0;
  const hardRadius = size * hardness;
  if (distance <= hardRadius) return 1;
  const fade = (distance - hardRadius) / (size - hardRadius);
  return 1 - fade;
}

export function applyBrush(
  target: ImageData,
  original: ImageData,
  cx: number,
  cy: number,
  options: BrushOptions,
): void {
  const { size, hardness, mode } = options;
  const { width, height, data } = target;
  const orig = original.data;

  const x0 = Math.max(0, Math.floor(cx - size));
  const y0 = Math.max(0, Math.floor(cy - size));
  const x1 = Math.min(width - 1, Math.ceil(cx + size));
  const y1 = Math.min(height - 1, Math.ceil(cy + size));

  for (let y = y0; y <= y1; y++) {
    const dy = y - cy;
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const mask = strengthAt(dist, size, hardness);
      if (mask <= 0) continue;
      const idx = (y * width + x) * 4;

      if (mode === 'erase') {
        const currentAlpha = data[idx + 3];
        data[idx + 3] = Math.round(currentAlpha * (1 - mask));
      } else {
        const originalAlpha = orig[idx + 3];
        const currentAlpha = data[idx + 3];
        const blendedAlpha = Math.round(currentAlpha + (originalAlpha - currentAlpha) * mask);
        data[idx + 3] = blendedAlpha;
        if (originalAlpha > 0 && mask > 0) {
          const currentR = data[idx];
          const currentG = data[idx + 1];
          const currentB = data[idx + 2];
          const origR = orig[idx];
          const origG = orig[idx + 1];
          const origB = orig[idx + 2];
          data[idx] = Math.round(currentR + (origR - currentR) * mask);
          data[idx + 1] = Math.round(currentG + (origG - currentG) * mask);
          data[idx + 2] = Math.round(currentB + (origB - currentB) * mask);
        }
      }
    }
  }
}

export function applyBrushStroke(
  target: ImageData,
  original: ImageData,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  options: BrushOptions,
): void {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const step = Math.max(1, options.size / 4);
  const steps = Math.max(1, Math.ceil(distance / step));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    applyBrush(target, original, fromX + dx * t, fromY + dy * t, options);
  }
}
