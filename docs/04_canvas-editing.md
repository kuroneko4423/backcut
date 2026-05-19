# 04. Canvas API 編集処理 — 技術詳細

> Phase 2〜4で実装する `lib/canvas/` の設計指針。
> すべての処理は標準Canvas APIで実装し、外部の画像編集ライブラリ（Fabric.js等）は使わない。

---

## 基本方針

- **2枚のCanvasで二重管理**：
  - `originalCanvas`: アップロード直後のオリジナル画像
  - `workingCanvas`: 編集中の画像（透過後 → 各種編集が適用される）
- **ImageDataの直接操作**でピクセル単位の処理を行う
- **重い処理**は `requestAnimationFrame` または Web Worker に分離

---

## レタッチ（戻す / 消す）

### `lib/canvas/retouch.ts`

```ts
export type BrushMode = 'restore' | 'erase';

export interface BrushOptions {
  size: number;       // ブラシ半径（px）
  hardness: number;   // 0.0〜1.0
  mode: BrushMode;
}

/**
 * ブラシ範囲内のアルファ値を更新する
 * - restore: originalImageData の alpha 値を targetImageData にコピー
 * - erase: targetImageData の alpha を 0 に設定
 */
export function applyBrush(
  targetImageData: ImageData,
  originalImageData: ImageData,
  x: number,
  y: number,
  options: BrushOptions
): ImageData {
  // 円形マスクを生成（hardnessでフェザリング）
  // ピクセルを走査し、マスク値に応じてalpha更新
  // ...
}
```

### ブラシのフェザリング
- `hardness = 1.0`: 完全な円（境界がシャープ）
- `hardness = 0.0`: 完全なソフトブラシ（中心から距離に応じて減衰）

---

## トリミング

### 自動トリミング `lib/canvas/trim.ts`

```ts
export interface TrimOptions {
  margin: number; // 余白px（0〜50）
  alphaThreshold: number; // この値以下は透明とみなす（既定: 0）
}

export function autoTrim(imageData: ImageData, options: TrimOptions): {
  x: number; y: number; width: number; height: number;
} {
  // 上下左右から非透明ピクセルを走査し、bbox を計算
  // margin を加味して矩形を返す
}
```

### 手動トリミング
- Canvas上でマウスドラッグして矩形選択
- アスペクト比固定オプション
  - `1:1` / `16:9` / `9:16` / `4:3` / `自由`
- 選択範囲を `ctx.drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh)` で切り出し

---

## エッジ調整

### `lib/canvas/edge.ts`

#### 硬さ調整（アルファ閾値）

```ts
export function adjustEdgeHardness(imageData: ImageData, threshold: number): ImageData {
  const data = imageData.data;
  for (let i = 3; i < data.length; i += 4) {
    data[i] = data[i] < threshold ? 0 : 255;
  }
  return imageData;
}
```

#### ぼかし（アルファチャンネルのみガウシアン）

```ts
export function blurAlpha(imageData: ImageData, radius: number): ImageData {
  // アルファチャンネル（4n+3 インデックス）にのみ
  // StackBlurアルゴリズム または箱型ブラーで処理
  // RGB値は変更しない
}
```

> 注: `ctx.filter = 'blur(Npx)'` は全チャンネルにかかるため、ここでは使わない。

---

## 背景合成

### `lib/canvas/background.ts`

合成順序: **背景 → (影 →) 透過画像** の順に上書き描画する。

#### 単色背景

```ts
export function drawSolidBackground(ctx: CanvasRenderingContext2D, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}
```

#### グラデーション

```ts
export function drawGradient(
  ctx: CanvasRenderingContext2D,
  start: string,
  end: string,
  angleDeg: number
) {
  const { width: w, height: h } = ctx.canvas;
  const rad = (angleDeg * Math.PI) / 180;
  const x0 = w / 2 - (Math.cos(rad) * w) / 2;
  const y0 = h / 2 - (Math.sin(rad) * h) / 2;
  const x1 = w / 2 + (Math.cos(rad) * w) / 2;
  const y1 = h / 2 + (Math.sin(rad) * h) / 2;
  const grad = ctx.createLinearGradient(x0, y0, x1, y1);
  grad.addColorStop(0, start);
  grad.addColorStop(1, end);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}
```

#### 画像背景

別Canvas に背景画像を `drawImage` し、その上に透過画像を合成。

---

## リサイズ

### `lib/canvas/resize.ts`

```ts
export interface ResizeOptions {
  width: number;
  height: number;
  preserveAspect: boolean;
  fit: 'contain' | 'cover'; // preserveAspect=trueのとき
}

export function resize(source: Canvas | ImageBitmap, options: ResizeOptions): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = options.width;
  canvas.height = options.height;
  const ctx = canvas.getContext('2d')!;
  // imageSmoothingQuality = 'high' で品質確保
  ctx.imageSmoothingQuality = 'high';
  // contain/cover でフィット
  // ...
  return canvas;
}
```

### プリセット（`lib/presets/sizePresets.ts`）

```ts
export const sizePresets = {
  youtubeThumb:    { width: 1280, height: 720,  label: 'YouTubeサムネイル' },
  xPost:           { width: 1200, height: 675,  label: 'X(Twitter)投稿' },
  instagramSquare: { width: 1080, height: 1080, label: 'Instagram正方形' },
  instagramPortrait:{width: 1080, height: 1350, label: 'Instagram縦長' },
  gameAsset:       { width: 512,  height: 512,  label: 'ゲーム素材' },
};
```

---

## 出力

### `lib/canvas/export.ts`

```ts
export type ExportFormat = 'png' | 'jpeg' | 'webp';

export interface ExportOptions {
  format: ExportFormat;
  quality?: number; // 0.0〜1.0（JPEG/WebPのみ有効）
  whiteBackgroundForJpeg?: boolean; // JPEG時に背景を白で塗りつぶし
}

export async function exportCanvas(
  canvas: HTMLCanvasElement,
  options: ExportOptions
): Promise<Blob> {
  // JPEGの場合は透過を維持できないため、白背景に合成
  if (options.format === 'jpeg' && options.whiteBackgroundForJpeg) {
    const tmp = document.createElement('canvas');
    tmp.width = canvas.width;
    tmp.height = canvas.height;
    const ctx = tmp.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tmp.width, tmp.height);
    ctx.drawImage(canvas, 0, 0);
    canvas = tmp;
  }

  const mime = `image/${options.format}`;
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('toBlob failed')),
      mime,
      options.quality ?? 0.92
    );
  });
}
```

### フォーマット別の特性

| フォーマット | 透過維持 | 推奨用途 |
|---|---|---|
| PNG  | ○ | 透過維持が必要な場合の既定 |
| WebP | ○ | 軽量化したい場合 |
| JPEG | × | 不透明な仕上げ画像、ファイルサイズ優先 |

---

## メモリ管理の注意

- 一時的に作った `OffscreenCanvas` / `ImageBitmap` は **必ず `close()` で解放**
- 大きな `ImageData` は処理後に変数参照を切る（GCに任せる）
- レタッチで未消化のヒストリーが溜まりすぎないよう、Undo履歴は **最大20件** などに制限
