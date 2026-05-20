'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { ActiveTool, AspectRatio, BrushOptions } from '@/types';
import { cn } from '@/lib/utils';
import { blobToImageData, cloneImageData, imageDataToBlob } from '@/lib/canvas/utils';
import { applyBrush, applyBrushStroke } from '@/lib/canvas/retouch';
import { autoTrim, cropImageData, type TrimRect } from '@/lib/canvas/trim';

export interface CanvasViewHandle {
  applyAutoTrim: (margin: number) => Promise<boolean>;
  applyManualCrop: () => Promise<boolean>;
  cancelManualCrop: () => void;
  revertToPristine: () => Promise<void>;
}

interface CanvasViewProps {
  /** マウント時に Canvas へ最初に描画する blob/file (編集を継続する場合は processed)。 */
  source: Blob | File | null;
  /** レタッチ「戻す」モードで参照する元データ。背景透過直後の原版。
   *  source と別データを渡す必要がある場合に指定。省略時は source を流用。 */
  pristineSource?: Blob | File | null;
  activeTool: ActiveTool;
  brushOptions: BrushOptions;
  aspectRatio: AspectRatio;
  /** 編集確定時 (ブラシ mouseup / トリミング適用) に呼ばれる */
  onCommit: (newBlob: Blob) => void;
  onCropAvailable?: (available: boolean) => void;
  className?: string;
}

function aspectRatioValue(ratio: AspectRatio): number | null {
  switch (ratio) {
    case '1:1': return 1;
    case '16:9': return 16 / 9;
    case '9:16': return 9 / 16;
    case '4:3': return 4 / 3;
    default: return null;
  }
}

function clampRect(rect: TrimRect, width: number, height: number): TrimRect {
  const x = Math.max(0, Math.min(width - 1, Math.round(rect.x)));
  const y = Math.max(0, Math.min(height - 1, Math.round(rect.y)));
  const right = Math.max(x + 1, Math.min(width, Math.round(rect.x + rect.width)));
  const bottom = Math.max(y + 1, Math.min(height, Math.round(rect.y + rect.height)));
  return { x, y, width: right - x, height: bottom - y };
}

export const CanvasView = forwardRef<CanvasViewHandle, CanvasViewProps>(function CanvasView(
  {
    source,
    pristineSource,
    activeTool,
    brushOptions,
    aspectRatio,
    onCommit,
    onCropAvailable,
    className,
  },
  ref,
) {
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  // working = 現在の編集中の状態。base canvas に描画される。
  const workingRef = useRef<ImageData | null>(null);
  // pristine = source 読み込み時のスナップショット。レタッチ「戻す」モードで参照する。
  const pristineRef = useRef<ImageData | null>(null);

  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [cropRect, setCropRect] = useState<TrimRect | null>(null);

  const dragStateRef = useRef<{
    type: 'brush' | 'crop';
    fromX: number;
    fromY: number;
    lastX: number;
    lastY: number;
  } | null>(null);

  // マウント時に一度だけ source と pristineSource を読み込む。
  // インデックス切替時は EditorPage 側で key={currentIndex} を指定し、
  // コンポーネントを再構築させる前提。同じインデックス内で source の参照が変わっても再読み込みしない。
  useEffect(() => {
    let cancelled = false;
    if (!source) {
      workingRef.current = null;
      pristineRef.current = null;
      setCanvasSize(null);
      setCropRect(null);
      return;
    }
    (async () => {
      try {
        const imageData = await blobToImageData(source);
        if (cancelled) return;
        workingRef.current = imageData;

        if (pristineSource && pristineSource !== source) {
          try {
            const pristineData = await blobToImageData(pristineSource);
            if (cancelled) return;
            pristineRef.current = pristineData;
          } catch (err) {
            console.error('[CanvasView] pristine 読み込み失敗', err);
            pristineRef.current = cloneImageData(imageData);
          }
        } else {
          pristineRef.current = cloneImageData(imageData);
        }

        setCanvasSize({ w: imageData.width, h: imageData.height });
        setCropRect(null);
      } catch (err) {
        console.error('[CanvasView] ImageData 読み込み失敗', err);
      }
    })();
    return () => {
      cancelled = true;
    };
    // 意図: source / pristineSource の identity が変わっても再ロードしない。
    // インデックス切替時は親が key={currentIndex} で再マウントさせる。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // canvasSize の変更（初期ロード or トリミング）に応じて base canvas を再描画。
  useEffect(() => {
    const canvas = baseCanvasRef.current;
    const data = workingRef.current;
    if (!canvas || !data || !canvasSize) return;
    canvas.width = canvasSize.w;
    canvas.height = canvasSize.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(data, 0, 0);
  }, [canvasSize]);

  // overlay の描画（cropRect / cursor）。
  useEffect(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay || !canvasSize) return;
    overlay.width = canvasSize.w;
    overlay.height = canvasSize.h;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    if (activeTool === 'crop' && cropRect) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, overlay.width, overlay.height);
      ctx.clearRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = Math.max(1, Math.min(canvasSize.w, canvasSize.h) / 400);
      ctx.strokeRect(cropRect.x + 0.5, cropRect.y + 0.5, cropRect.width - 1, cropRect.height - 1);
    }
    if (activeTool === 'retouch' && cursor) {
      ctx.strokeStyle = brushOptions.mode === 'erase' ? '#ef4444' : '#3b82f6';
      ctx.lineWidth = Math.max(1, Math.min(canvasSize.w, canvasSize.h) / 400);
      ctx.beginPath();
      ctx.arc(cursor.x, cursor.y, brushOptions.size, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [activeTool, cropRect, cursor, brushOptions.size, brushOptions.mode, canvasSize]);

  useEffect(() => {
    onCropAvailable?.(cropRect !== null);
  }, [cropRect, onCropAvailable]);

  const getCanvasCoords = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const canvas = overlayCanvasRef.current;
      if (!canvas || !canvasSize) return null;
      const rect = canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * canvasSize.w;
      const y = ((clientY - rect.top) / rect.height) * canvasSize.h;
      return { x, y };
    },
    [canvasSize],
  );

  const commitWorking = useCallback(async () => {
    const data = workingRef.current;
    if (!data) return;
    try {
      const blob = await imageDataToBlob(data, 'image/png');
      onCommit(blob);
    } catch (err) {
      console.error('[CanvasView] Blob 変換失敗', err);
    }
  }, [onCommit]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'retouch' && activeTool !== 'crop') return;
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);

    if (activeTool === 'retouch') {
      const working = workingRef.current;
      const pristine = pristineRef.current;
      if (!working || !pristine) return;
      applyBrush(working, pristine, coords.x, coords.y, brushOptions);
      const ctx = baseCanvasRef.current?.getContext('2d');
      if (ctx) ctx.putImageData(working, 0, 0);
      dragStateRef.current = {
        type: 'brush',
        fromX: coords.x,
        fromY: coords.y,
        lastX: coords.x,
        lastY: coords.y,
      };
    } else {
      dragStateRef.current = {
        type: 'crop',
        fromX: coords.x,
        fromY: coords.y,
        lastX: coords.x,
        lastY: coords.y,
      };
      setCropRect({ x: coords.x, y: coords.y, width: 0, height: 0 });
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;

    if (activeTool === 'retouch') {
      setCursor(coords);
    }

    const drag = dragStateRef.current;
    if (!drag) return;

    if (drag.type === 'brush') {
      const working = workingRef.current;
      const pristine = pristineRef.current;
      if (!working || !pristine) return;
      applyBrushStroke(working, pristine, drag.lastX, drag.lastY, coords.x, coords.y, brushOptions);
      const ctx = baseCanvasRef.current?.getContext('2d');
      if (ctx) ctx.putImageData(working, 0, 0);
      drag.lastX = coords.x;
      drag.lastY = coords.y;
    } else if (drag.type === 'crop' && canvasSize) {
      let w = coords.x - drag.fromX;
      let h = coords.y - drag.fromY;
      const ratio = aspectRatioValue(aspectRatio);
      if (ratio) {
        const sign = Math.sign(w) || 1;
        const signH = Math.sign(h) || 1;
        const absW = Math.abs(w);
        const absH = Math.abs(h);
        if (absW / absH > ratio) {
          h = signH * (absW / ratio);
        } else {
          w = sign * (absH * ratio);
        }
      }
      const x = w < 0 ? drag.fromX + w : drag.fromX;
      const y = h < 0 ? drag.fromY + h : drag.fromY;
      const rect = clampRect(
        { x, y, width: Math.abs(w), height: Math.abs(h) },
        canvasSize.w,
        canvasSize.h,
      );
      setCropRect(rect);
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const target = e.target as HTMLCanvasElement;
    if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
    const drag = dragStateRef.current;
    dragStateRef.current = null;
    if (!drag) return;
    if (drag.type === 'brush') {
      void commitWorking();
    } else if (drag.type === 'crop') {
      if (cropRect && (cropRect.width < 2 || cropRect.height < 2)) {
        setCropRect(null);
      }
    }
  };

  const onPointerLeave = () => {
    if (activeTool === 'retouch') setCursor(null);
  };

  useImperativeHandle(
    ref,
    () => ({
      applyAutoTrim: async (margin: number) => {
        const working = workingRef.current;
        if (!working) return false;
        const trimmed = autoTrim(working, { margin });
        if (!trimmed) return false;
        workingRef.current = trimmed;
        pristineRef.current = cloneImageData(trimmed);
        setCanvasSize({ w: trimmed.width, h: trimmed.height });
        await commitWorking();
        return true;
      },
      applyManualCrop: async () => {
        const working = workingRef.current;
        if (!working || !cropRect || cropRect.width < 1 || cropRect.height < 1) return false;
        const cropped = cropImageData(working, cropRect);
        workingRef.current = cropped;
        pristineRef.current = cloneImageData(cropped);
        setCanvasSize({ w: cropped.width, h: cropped.height });
        setCropRect(null);
        await commitWorking();
        return true;
      },
      cancelManualCrop: () => {
        setCropRect(null);
      },
      revertToPristine: async () => {
        const pristine = pristineRef.current;
        if (!pristine) return;
        workingRef.current = cloneImageData(pristine);
        setCanvasSize({ w: pristine.width, h: pristine.height });
        await commitWorking();
      },
    }),
    [commitWorking, cropRect],
  );

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
      <div className="relative inline-block max-h-full max-w-full">
        <canvas
          ref={baseCanvasRef}
          className="block max-h-[70vh] max-w-full object-contain shadow-sm"
        />
        <canvas
          ref={overlayCanvasRef}
          className={cn(
            'absolute inset-0 h-full w-full',
            activeTool === 'retouch' && 'cursor-crosshair',
            activeTool === 'crop' && 'cursor-crosshair',
            activeTool !== 'retouch' && activeTool !== 'crop' && 'pointer-events-none',
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerLeave}
        />
      </div>
    </div>
  );
});
