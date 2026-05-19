# 03. 背景透過処理 — 技術詳細

> 必要時のみ参照すること。Phase 1 で実装する `lib/bg-removal/` の設計指針。

---

## 使用ライブラリ

**`@imgly/background-removal`**
- ブラウザ完結型の背景除去ライブラリ
- ONNX Runtime Web を内部で使用
- WebGPU / WebAssembly に対応（自動フォールバック）
- モデルファイルは初回 fetch 後、IndexedDB にキャッシュ

公式: https://github.com/imgly/background-removal-js

---

## 実装方針

### `lib/bg-removal/removeBackground.ts`

```ts
import { removeBackground, Config } from '@imgly/background-removal';

export type ProgressCallback = (key: string, current: number, total: number) => void;

export async function processImage(
  file: File | Blob,
  onProgress?: ProgressCallback
): Promise<Blob> {
  const config: Config = {
    progress: (key, current, total) => {
      onProgress?.(key, current, total);
    },
    // モデルは公式CDNから取得（初回のみ）
    // 自社配信したい場合は publicPath を指定
  };

  const resultBlob = await removeBackground(file, config);
  return resultBlob;
}
```

### 一括処理

```ts
export async function processBatch(
  files: File[],
  onProgress?: (fileIndex: number, key: string, current: number, total: number) => void
): Promise<Blob[]> {
  const results: Blob[] = [];
  for (let i = 0; i < files.length; i++) {
    const blob = await processImage(files[i], (key, c, t) => {
      onProgress?.(i, key, c, t);
    });
    results.push(blob);
  }
  return results;
}
```

> 注: 並列実行はメモリ負荷が大きいため、逐次処理を推奨。

---

## 大画像の前処理

長辺 **2048px** を超える画像は、処理前に内部リサイズすること。

```ts
async function resizeIfNeeded(file: File, maxSide = 2048): Promise<Blob> {
  const img = await createImageBitmap(file);
  if (Math.max(img.width, img.height) <= maxSide) {
    return file;
  }
  const scale = maxSide / Math.max(img.width, img.height);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);
  img.close();
  return await canvas.convertToBlob({ type: file.type });
}
```

---

## エラーハンドリング

- モデルのDLに失敗 → ユーザーにオフライン状態を確認するよう促す
- メモリ不足 → 画像をさらに縮小して再試行（半分のサイズなど）
- ブラウザ非対応 → WebAssembly対応ブラウザを推奨するメッセージ

---

## パフォーマンス目安

| 画像サイズ | 推論時間（WebGPU） | 推論時間（WASM） |
|---|---|---|
| 512×512 | 〜2秒 | 〜5秒 |
| 1024×1024 | 〜5秒 | 〜10秒 |
| 2048×2048 | 〜15秒 | 〜30秒 |

※ 実機のGPU性能に依存。WebGPU非対応ブラウザではWASMフォールバック。

---

## 通信確認チェックリスト

実装後、必ず以下を確認すること：

- [ ] DevTools Network タブを開く
- [ ] 画像を1枚アップロードし背景透過を実行
- [ ] 初回のみモデルファイル（`.onnx` 等）のDLが発生することを確認
- [ ] 2回目以降の処理ではキャッシュからロードされ、**外部通信が一切発生しない**ことを確認
- [ ] 画像データを含む POST / PUT リクエストが発生していないことを確認
