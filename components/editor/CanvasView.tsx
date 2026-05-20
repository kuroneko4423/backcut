'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface CanvasViewProps {
  source: Blob | File | null;
  className?: string;
}

export function CanvasView({ source, className }: CanvasViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !source) return;

    let bitmap: ImageBitmap | null = null;
    let cancelled = false;

    (async () => {
      try {
        bitmap = await createImageBitmap(source);
        if (cancelled || !bitmap) return;
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, 0, 0);
      } catch (err) {
        console.error('[CanvasView] 描画失敗', err);
      }
    })();

    return () => {
      cancelled = true;
      bitmap?.close();
    };
  }, [source]);

  if (!source) {
    return (
      <div
        className={cn(
          'flex h-full w-full items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground',
          className,
        )}
      >
        プレビューする画像がありません
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center overflow-auto rounded-lg checkerboard p-4',
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        className="max-h-full max-w-full object-contain shadow-sm"
      />
    </div>
  );
}
