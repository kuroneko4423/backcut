import { removeBackground, type Config } from '@imgly/background-removal';

export type ProgressCallback = (key: string, current: number, total: number) => void;

const MAX_SIDE = 2048;

async function resizeIfNeeded(file: File | Blob, maxSide = MAX_SIDE): Promise<Blob> {
  const img = await createImageBitmap(file);
  try {
    if (Math.max(img.width, img.height) <= maxSide) {
      return file;
    }
    const scale = maxSide / Math.max(img.width, img.height);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas =
      typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(w, h)
        : Object.assign(document.createElement('canvas'), { width: w, height: h });
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D コンテキストの取得に失敗しました');
    }
    (ctx as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D).drawImage(img, 0, 0, w, h);
    const type = 'type' in file && file.type ? file.type : 'image/png';
    if (canvas instanceof OffscreenCanvas) {
      return await canvas.convertToBlob({ type });
    }
    return await new Promise<Blob>((resolve, reject) => {
      (canvas as HTMLCanvasElement).toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob が null を返しました'))),
        type,
      );
    });
  } finally {
    img.close();
  }
}

export async function processImage(
  file: File | Blob,
  onProgress?: ProgressCallback,
): Promise<Blob> {
  const input = await resizeIfNeeded(file);
  const config: Config = {
    progress: (key, current, total) => {
      onProgress?.(key, current, total);
    },
    output: {
      format: 'image/png',
    },
  };
  return await removeBackground(input, config);
}

export async function processBatch(
  files: File[],
  onProgress?: (fileIndex: number, key: string, current: number, total: number) => void,
): Promise<Blob[]> {
  const results: Blob[] = [];
  for (let i = 0; i < files.length; i++) {
    const blob = await processImage(files[i], (key, current, total) => {
      onProgress?.(i, key, current, total);
    });
    results.push(blob);
  }
  return results;
}
