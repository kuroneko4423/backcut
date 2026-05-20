'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/common/ProgressBar';
import { useEditorStore } from '@/lib/store/editorStore';
import { processImage } from '@/lib/bg-removal/removeBackground';

export function RemoveBgTool() {
  const files = useEditorStore((s) => s.files);
  const status = useEditorStore((s) => s.status);
  const progress = useEditorStore((s) => s.progress);
  const error = useEditorStore((s) => s.error);
  const processedCount = useEditorStore((s) => s.processed.size);
  const setProcessed = useEditorStore((s) => s.setProcessed);
  const setStatus = useEditorStore((s) => s.setStatus);
  const setProgress = useEditorStore((s) => s.setProgress);
  const setError = useEditorStore((s) => s.setError);

  const run = useCallback(async () => {
    if (files.length === 0) return;
    setStatus('processing');
    setError(null);
    try {
      for (let i = 0; i < files.length; i++) {
        setProgress({ fileIndex: i, key: 'starting', current: 0, total: 1 });
        const blob = await processImage(files[i], (key, current, total) => {
          setProgress({ fileIndex: i, key, current, total });
        });
        setProcessed(i, blob);
      }
      setStatus('done');
      setProgress(null);
    } catch (err) {
      console.error('[RemoveBgTool] 背景透過に失敗', err);
      setError(err instanceof Error ? err.message : '背景透過処理に失敗しました');
      setStatus('error');
      setProgress(null);
    }
  }, [files, setError, setProcessed, setProgress, setStatus]);

  const allDone = processedCount === files.length && files.length > 0;
  const isProcessing = status === 'processing';

  return (
    <div className="flex flex-col gap-3">
      <Button type="button" onClick={run} disabled={isProcessing || files.length === 0}>
        {isProcessing
          ? '処理中...'
          : allDone
            ? '再実行'
            : `背景透過を実行（${files.length} 枚）`}
      </Button>

      {isProcessing && progress && (
        <ProgressBar
          current={progress.current}
          total={progress.total}
          label={`${progress.fileIndex + 1}/${files.length} 枚目: ${progress.key}`}
        />
      )}

      {status === 'done' && (
        <p className="text-xs text-muted-foreground">
          {processedCount}/{files.length} 枚 処理完了
        </p>
      )}

      {status === 'error' && error && (
        <p className="text-xs text-destructive">エラー: {error}</p>
      )}
    </div>
  );
}
