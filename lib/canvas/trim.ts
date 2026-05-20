export interface TrimRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AutoTrimOptions {
  margin?: number;
  alphaThreshold?: number;
}

export function detectBounds(imageData: ImageData, alphaThreshold = 0): TrimRect | null {
  const { width, height, data } = imageData;
  let top = -1;
  let bottom = -1;
  let left = -1;
  let right = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > alphaThreshold) {
        if (top === -1) top = y;
        bottom = y;
        if (left === -1 || x < left) left = x;
        if (right === -1 || x > right) right = x;
      }
    }
  }

  if (top === -1) return null;
  return {
    x: left,
    y: top,
    width: right - left + 1,
    height: bottom - top + 1,
  };
}

export function cropImageData(imageData: ImageData, rect: TrimRect): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D コンテキストの取得に失敗しました');
  ctx.putImageData(imageData, 0, 0);
  return ctx.getImageData(rect.x, rect.y, rect.width, rect.height);
}

export function autoTrim(imageData: ImageData, options: AutoTrimOptions = {}): ImageData | null {
  const { margin = 0, alphaThreshold = 0 } = options;
  const bounds = detectBounds(imageData, alphaThreshold);
  if (!bounds) return null;

  const x = Math.max(0, bounds.x - margin);
  const y = Math.max(0, bounds.y - margin);
  const right = Math.min(imageData.width, bounds.x + bounds.width + margin);
  const bottom = Math.min(imageData.height, bounds.y + bounds.height + margin);
  const rect: TrimRect = { x, y, width: right - x, height: bottom - y };
  return cropImageData(imageData, rect);
}
