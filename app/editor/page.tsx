'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CanvasView } from '@/components/editor/CanvasView';
import { RemoveBgTool } from '@/components/editor/tools/RemoveBgTool';
import { useEditorStore } from '@/lib/store/editorStore';
import { createZipBlob, toPngFilename, triggerDownload } from '@/lib/zip/createZip';
import { cn } from '@/lib/utils';

export default function EditorPage() {
  const router = useRouter();
  const files = useEditorStore((s) => s.files);
  const processed = useEditorStore((s) => s.processed);
  const currentIndex = useEditorStore((s) => s.currentIndex);
  const setCurrentIndex = useEditorStore((s) => s.setCurrentIndex);
  const reset = useEditorStore((s) => s.reset);

  useEffect(() => {
    if (files.length === 0) {
      router.replace('/');
    }
  }, [files.length, router]);

  if (files.length === 0) {
    return null;
  }

  const currentFile = files[currentIndex];
  const currentProcessed = processed.get(currentIndex);
  const source = currentProcessed ?? currentFile;
  const allProcessed = processed.size === files.length;

  const onDownloadCurrent = () => {
    const blob = processed.get(currentIndex);
    if (!blob) return;
    triggerDownload(blob, toPngFilename(currentFile.name));
  };

  const onDownloadZip = async () => {
    if (!allProcessed) return;
    const entries = files.map((file, i) => ({
      name: toPngFilename(file.name),
      blob: processed.get(i)!,
    }));
    const zip = await createZipBlob(entries);
    triggerDownload(zip, `backcut-${Date.now()}.zip`);
  };

  const onBackToTop = () => {
    reset();
    router.push('/');
  };

  return (
    <main className="flex min-h-screen flex-col gap-4 p-4 md:p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">エディタ</h1>
        <Button type="button" variant="outline" onClick={onBackToTop}>
          別の画像を選ぶ
        </Button>
      </header>

      <section className="flex gap-2 overflow-x-auto rounded-lg border bg-card p-2">
        {files.map((file, i) => {
          const isDone = processed.has(i);
          const isActive = i === currentIndex;
          return (
            <button
              key={`${file.name}-${i}`}
              type="button"
              onClick={() => setCurrentIndex(i)}
              className={cn(
                'relative flex shrink-0 flex-col items-center gap-1 rounded-md border-2 p-1 text-xs transition-colors',
                isActive ? 'border-primary' : 'border-transparent hover:border-muted-foreground/40',
              )}
              title={file.name}
            >
              <ThumbImage file={isDone ? processed.get(i)! : file} />
              <span className="max-w-20 truncate">{file.name}</span>
              {isDone && (
                <span className="absolute top-1 right-1 rounded bg-primary px-1 text-[10px] text-primary-foreground">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </section>

      <section className="grid flex-1 gap-4 md:grid-cols-[1fr_320px]">
        <div className="min-h-[400px] rounded-lg border bg-card">
          <CanvasView source={source} />
        </div>

        <aside className="flex flex-col gap-4 rounded-lg border bg-card p-4">
          <div>
            <h2 className="text-sm font-semibold">背景透過</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              すべての画像を一括で処理します。初回は背景透過モデル（数十MB）をダウンロードします。
            </p>
          </div>

          <RemoveBgTool />

          <div className="flex flex-col gap-2 border-t pt-4">
            <h2 className="text-sm font-semibold">ダウンロード</h2>
            <Button
              type="button"
              variant="outline"
              onClick={onDownloadCurrent}
              disabled={!currentProcessed}
            >
              この画像をPNG保存
            </Button>
            <Button type="button" onClick={onDownloadZip} disabled={!allProcessed}>
              全画像をZIPで保存
            </Button>
            {!allProcessed && (
              <p className="text-xs text-muted-foreground">
                すべての画像を処理するとZIP保存が有効になります。
              </p>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}

function ThumbImage({ file }: { file: Blob | File }) {
  const url = URL.createObjectURL(file);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className="h-16 w-16 rounded object-contain"
      onLoad={() => URL.revokeObjectURL(url)}
    />
  );
}
