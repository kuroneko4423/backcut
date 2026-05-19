# 05. ドロップシャドウとプリセット設計

> Phase 4 で実装する `lib/canvas/shadow.ts` と `lib/presets/shadowPresets.ts` の設計指針。

---

## 影の構成要素

| パラメータ | 範囲（例） | 説明 |
|---|---|---|
| `spread` | 0.5〜2.0 | 影の横方向スケール |
| `flat` | 0.05〜1.0 | 扁平度（Y方向の潰れ。小さいほど地面接地に近い） |
| `offsetY` | 0〜200px | 影のY軸オフセット（下方向への移動） |
| `offsetX` | -100〜100px | 影のX軸オフセット |
| `blur` | 0〜50px | ぼかし量 |
| `opacity` | 0.0〜1.0 | 不透明度 |
| `color` | RGB hex | 影の色（既定 `#000000`） |

---

## 影の生成ロジック

### `lib/canvas/shadow.ts`

```ts
export interface ShadowOptions {
  spread: number;
  flat: number;
  offsetX: number;
  offsetY: number;
  blur: number;
  opacity: number;
  color: string;
}

/**
 * 透過画像のアルファチャンネルから影を生成する
 * 手順:
 * 1. 透過画像と同サイズの一時Canvasを作成
 * 2. 一時Canvasに画像を描画
 * 3. globalCompositeOperation = 'source-in' で全体を影色で塗りつぶし
 * 4. 別Canvasにアフィン変換（scale: spread x flat）で描画
 * 5. ctx.filter = `blur(${blur}px)` でぼかし
 * 6. globalAlpha = opacity で透明度
 */
export function renderShadow(
  sourceImage: HTMLCanvasElement,
  targetCtx: CanvasRenderingContext2D,
  options: ShadowOptions
): void {
  const { width, height } = sourceImage;
  
  // 1. シルエット用の一時Canvas
  const silhouette = document.createElement('canvas');
  silhouette.width = width;
  silhouette.height = height;
  const sCtx = silhouette.getContext('2d')!;
  sCtx.drawImage(sourceImage, 0, 0);
  sCtx.globalCompositeOperation = 'source-in';
  sCtx.fillStyle = options.color;
  sCtx.fillRect(0, 0, width, height);
  
  // 2. ターゲットに変形＋ぼかし＋不透明度を適用して描画
  targetCtx.save();
  targetCtx.globalAlpha = options.opacity;
  targetCtx.filter = `blur(${options.blur}px)`;
  // 中央基準で scale(spread, flat) を適用
  const cx = width / 2;
  const cy = height; // 画像の下端を基準にすると地面接地らしくなる
  targetCtx.translate(cx + options.offsetX, cy + options.offsetY);
  targetCtx.scale(options.spread, options.flat);
  targetCtx.translate(-cx, -cy);
  targetCtx.drawImage(silhouette, 0, 0);
  targetCtx.restore();
}
```

### 合成順序の注意

最終的な合成は **背景 → 影 → 透過画像** の順で重ねる。これにより影が背景の上、本体の下に描画される。

---

## プリセット定義

### `lib/presets/shadowPresets.ts`

```ts
import type { ShadowOptions } from '@/lib/canvas/shadow';

export type ShadowPresetKey = 'character' | 'item' | 'realistic' | 'soft' | 'longShadow';

export const shadowPresets: Record<ShadowPresetKey, { label: string; options: ShadowOptions }> = {
  character: {
    label: '立ち絵プリセット',
    options: {
      spread: 1.2,
      flat: 0.15,
      offsetX: 0,
      offsetY: 50,
      blur: 20,
      opacity: 0.5,
      color: '#000000',
    },
  },
  item: {
    label: 'アイテムプリセット',
    options: {
      spread: 1.0,
      flat: 0.3,
      offsetX: 0,
      offsetY: 10,
      blur: 8,
      opacity: 0.4,
      color: '#000000',
    },
  },
  realistic: {
    label: 'リアル接地影',
    options: {
      spread: 1.4,
      flat: 0.05,
      offsetX: 0,
      offsetY: 60,
      blur: 30,
      opacity: 0.6,
      color: '#000000',
    },
  },
  soft: {
    label: 'やわらか影',
    options: {
      spread: 1.1,
      flat: 0.6,
      offsetX: 5,
      offsetY: 8,
      blur: 25,
      opacity: 0.3,
      color: '#000000',
    },
  },
  longShadow: {
    label: 'ロングシャドウ',
    options: {
      spread: 1.0,
      flat: 1.0,
      offsetX: 30,
      offsetY: 30,
      blur: 0,
      opacity: 0.5,
      color: '#000000',
    },
  },
};
```

---

## UI想定

### プリセット選択UI
- プリセットボタンをカード形式で並べる
- クリックで全パラメータを上書き
- プリセット適用後、個別パラメータの微調整が可能（プリセットからの「差分」として表示）

### 個別調整UI
- スライダー6本（spread / flat / offsetX / offsetY / blur / opacity）
- カラーピッカー（影の色）
- リアルタイムプレビュー

---

## パフォーマンス注意

- 影の再計算は **入力が止まってから 50ms 後** に実行（debounce）
- スライダー操作中はサムネイル解像度で低品質プレビュー、操作終了後にフル解像度で再描画
- `ctx.filter = blur(...)` はGPUアクセラレーション対応ブラウザでは高速
