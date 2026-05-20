import { DropZone } from '@/components/upload/DropZone';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-4xl font-bold tracking-tight">BackCut</h1>
        <p className="text-muted-foreground">
          ブラウザ完結型の背景透過＋画像編集アプリ
        </p>
      </div>
      <DropZone />
      <p className="max-w-xl text-center text-xs text-muted-foreground">
        画像はすべてあなたのブラウザ内で処理されます。外部サーバーには送信されません。
      </p>
    </main>
  );
}
