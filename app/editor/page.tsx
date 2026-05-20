'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CanvasView, type CanvasViewHandle } from '@/components/editor/CanvasView';
import { RemoveBgTool } from '@/components/editor/tools/RemoveBgTool';
import { RetouchTool } from '@/components/editor/tools/RetouchTool';
import { CropTool } from '@/components/editor/tools/CropTool';
import { useEditorStore } from '@/lib/store/editorStore';
import { createZipBlob, toPngFilename, triggerDownload } from '@/lib/zip/createZip';
import { cn } from '@/lib/utils';
import type { ActiveTool, AspectRatio, BrushOptions } from '@/types';

const DEFAULT_BRUSH: BrushOptions = { size: 32, hardness: 0.7, mode: 'restore' };

export default function EditorPage() {
  const router = useRouter();
  const files = useEditorStore((s) => s.files);
  const processed = useEditorStore((s) => s.processed);
  const pristine = useEditorStore((s) => s.pristine);
  const currentIndex = useEditorStore((s) => s.currentIndex);
  const setCurrentIndex = useEditorStore((s) => s.setCurrentIndex);
  const setProcessed = useEditorStore((s) => s.setProcessed);
  const reset = useEditorStore((s) => s.reset);

  const [activeTool, setActiveTool] = useState<ActiveTool>('remove-bg');
  const [brushOptions, setBrushOptions] = useState<BrushOptions>(DEFAULT_BRUSH);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('free');
  const [margin, setMargin] = useState(0);
  const [hasCropSelection, setHasCropSelection] = useState(false);

  const canvasRef = useRef<CanvasViewHandle>(null);

  const onCommit = useCallback(
    (newBlob: Blob) => {
      setProcessed(currentIndex, newBlob);
    },
    [currentIndex, setProcessed],
  );

  useEffect(() => {
    if (files.length === 0) {
      router.replace('/');
    }
  }, [files.length, router]);

  if (files.length === 0) {
    return null;
  }

  const currentFile = files[currentIndex];
  const currentProcessed = processed.get(currentIndex) ?? null;
  const currentPristine = pristine.get(currentIndex) ?? null;
  // CanvasView の source: 編集を継続できるように processed があればそれを、なければ pristine / file。
  // CanvasView は key={currentIndex} で再構築されるため、インデックス切替時のみ source が反映される。
  // 同インデックス内で processed が更新されても、CanvasView は再ロードしない (workingRef で状態保持)。
  const source = currentProcessed ?? currentPristine ?? currentFile;
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

  const onAutoTrim = async () => {
    const ok = await canvasRef.current?.applyAutoTrim(margin);
    if (ok === false) {
      alert('透明なピクセルしか検出できませんでした。トリミングをスキップします。');
    }
  };

  const onApplyManualCrop = async () => {
    const ok = await canvasRef.current?.applyManualCrop();
    if (ok === false) {
      alert('範囲が選択されていません。Canvas 上でドラッグして範囲を指定してください。');
    }
  };

  const onCancelManualCrop = () => {
    canvasRef.current?.cancelManualCrop();
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
          <CanvasView
            // key: インデックス切替 + pristine 確定タイミングで再マウントする。
            // pristine identity を含めることで「透過完了直後」に Canvas が透過済み画像を取り込み直す。
            // 同インデックス内のレタッチ/トリミング (processed のみ更新) では再マウントしない。
            key={`${currentIndex}-${currentPristine ? 'p' : 'f'}`}
            ref={canvasRef}
            source={source}
            pristineSource={currentPristine}
            activeTool={activeTool}
            brushOptions={brushOptions}
            aspectRatio={aspectRatio}
            onCommit={onCommit}
            onCropAvailable={setHasCropSelection}
          />
        </div>

        <aside className="flex flex-col gap-4 rounded-lg border bg-card p-4">
          <Tabs
            value={activeTool}
            onValueChange={(value) => {
              if (typeof value === 'string') setActiveTool(value as ActiveTool);
            }}
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="remove-bg">透過</TabsTrigger>
              <TabsTrigger value="retouch" disabled={!currentProcessed}>
                レタッチ
              </TabsTrigger>
              <TabsTrigger value="crop" disabled={!currentProcessed}>
                トリム
              </TabsTrigger>
              <TabsTrigger value="download">DL</TabsTrigger>
            </TabsList>

            <TabsContent value="remove-bg" className="mt-4 flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                すべての画像を一括で処理します。初回は背景透過モデル（数十MB）をダウンロードします。
              </p>
              <RemoveBgTool />
            </TabsContent>

            <TabsContent value="retouch" className="mt-4">
              {currentProcessed ? (
                <RetouchTool
                  options={brushOptions}
                  onChange={setBrushOptions}
                  canRevert={true}
                  onRevert={() => {
                    void canvasRef.current?.revertToPristine();
                  }}
                />
              ) : (
                <p className="text-xs text-muted-foreground">
                  先に背景透過を実行してください。
                </p>
              )}
            </TabsContent>

            <TabsContent value="crop" className="mt-4">
              {currentProcessed ? (
                <CropTool
                  aspectRatio={aspectRatio}
                  margin={margin}
                  onAspectRatioChange={setAspectRatio}
                  onMarginChange={setMargin}
                  onAutoTrim={onAutoTrim}
                  onApply={onApplyManualCrop}
                  onCancel={onCancelManualCrop}
                  canApply={hasCropSelection}
                />
              ) : (
                <p className="text-xs text-muted-foreground">
                  先に背景透過を実行してください。
                </p>
              )}
            </TabsContent>

            <TabsContent value="download" className="mt-4 flex flex-col gap-2">
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
            </TabsContent>
          </Tabs>
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
