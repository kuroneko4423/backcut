'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { useEditorStore } from '@/lib/store/editorStore';
import { cn } from '@/lib/utils';

const ACCEPT = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'image/bmp': ['.bmp'],
};

export function DropZone() {
  const router = useRouter();
  const setFiles = useEditorStore((s) => s.setFiles);

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      if (rejections.length > 0) {
        const names = rejections.map((r) => r.file.name).join(', ');
        alert(`サポート外のファイル形式があります: ${names}`);
      }
      if (accepted.length === 0) return;
      setFiles(accepted);
      router.push('/editor');
    },
    [router, setFiles],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPT,
    multiple: true,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex w-full max-w-2xl flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 transition-colors',
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/30 bg-muted/30 hover:bg-muted/50',
      )}
    >
      <input {...getInputProps()} />
      <p className="text-center text-lg font-medium">
        画像をドラッグ&ドロップ
        <span className="text-muted-foreground"> または </span>
      </p>
      <Button type="button" onClick={open}>
        ファイルを選択
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        対応形式: PNG / JPEG / WebP / BMP（複数選択可）
      </p>
    </div>
  );
}
