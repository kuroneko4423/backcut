# 02. 実装計画 — BackCut

> 段階的に実装を進める。各 Phase は独立して完結し、Phase 完了時に必ず動作確認する。
> Claude Code に「Phase N を進めて」と指示することを想定したタスクリスト形式。

---

## Phase 0: 環境構築

**Goal**: ローカル `npm run dev` と Vercel プレビューデプロイが動く状態にする。

### Tasks
- [ ] `npx create-next-app@latest backcut --typescript --tailwind --app --eslint` で雛形作成
- [ ] 必要パッケージ追加
  ```bash
  npm install @imgly/background-removal jszip react-dropzone zustand
  npm install -D @types/jszip prettier
  npx shadcn-ui@latest init
  ```
- [ ] `tsconfig.json` で `strict: true` を確認
- [ ] `.prettierrc` を追加（任意）
- [ ] `app/page.tsx` に "Hello BackCut" を表示
- [ ] GitHubリポジトリ作成 → Vercel連携

### Done When
- [ ] `npm run dev` でローカル起動できる
- [ ] Vercelの本番URLでHello BackCutが表示される

---

## Phase 1: 背景透過コア機能

**Goal**: 画像をD&Dし、背景透過された結果をダウンロードできる。複数画像はZIPで一括DLできる。

### Tasks
- [ ] `components/upload/DropZone.tsx` を実装（`react-dropzone`）
  - 複数ファイル対応
  - サムネイル表示
  - サポート形式: PNG/JPEG/WebP/BMP
- [ ] `lib/bg-removal/removeBackground.ts` を実装
  - `@imgly/background-removal` をラップ
  - プログレスコールバックを取り出す
- [ ] `app/editor/page.tsx` を実装
  - 透過処理結果を `<canvas>` に描画
  - 単体ダウンロードボタン（PNG出力）
- [ ] `lib/zip/createZip.ts` を実装（`JSZip` ラッパー）
  - 複数Blob → ZIPダウンロード
- [ ] `lib/store/editorStore.ts`（Zustand）の基本構造を作成

### Done When
- [ ] 画像をD&Dすると背景が透過されてプレビュー表示される
- [ ] 単体PNGダウンロードできる
- [ ] 複数画像をZIPで一括ダウンロードできる
- [ ] Networkタブでモデル初回DL以外の通信が発生しないことを確認

### 詳細参照
→ `@docs/03_bg-removal.md`

---

## Phase 2: レタッチ＆トリミング

**Goal**: 自動透過後の手動補正と、画像の余白カットができる。

### Tasks
- [ ] `lib/canvas/retouch.ts` を実装
  - オリジナル画像のImageDataを保持
  - ブラシ描画ハンドラ（mousedown / move / up）
  - **戻すモード**: ブラシ範囲のアルファをオリジナルの値に復元
  - **消すモード**: ブラシ範囲のアルファを0に設定
  - ブラシサイズ・硬さスライダー
- [ ] `lib/canvas/trim.ts` を実装
  - **自動トリミング**: 非透明ピクセルの境界検出 → 余白カット
  - 周囲マージン指定（0〜50px）
- [ ] 手動トリミング
  - Canvas上でドラッグして矩形選択
  - アスペクト比固定オプション（1:1 / 16:9 / 9:16 / 4:3）
- [ ] `components/editor/tools/RetouchTool.tsx`, `CropTool.tsx`

### Done When
- [ ] レタッチ（戻す・消す）が両モードで動作
- [ ] 自動トリミングで余白がカットされる
- [ ] 手動トリミングで指定範囲のみ切り出せる

### 詳細参照
→ `@docs/04_canvas-editing.md`

---

## Phase 3: エッジ＆背景合成

**Goal**: 切り抜き境界の硬さ調整、ぼかし、背景合成ができる。

### Tasks
- [ ] `lib/canvas/edge.ts` を実装
  - **硬さ調整**: アルファ閾値処理
  - **ぼかし**: アルファチャンネルにのみガウシアンブラー
- [ ] `lib/canvas/background.ts` を実装
  - 単色背景（カラーピッカー）
  - グラデーション背景（2色 + 方向指定）
  - 画像背景（別画像をアップロードして合成）
- [ ] `components/editor/tools/EdgeTool.tsx`, `BackgroundTool.tsx`

### Done When
- [ ] エッジの硬さ・ぼかしがスライダーでリアルタイムに反映される
- [ ] 背景を単色・グラデ・画像のいずれかで合成できる

### 詳細参照
→ `@docs/04_canvas-editing.md`

---

## Phase 4: 影・リサイズ・出力

**Goal**: ドロップシャドウ、リサイズ、各フォーマットでの出力ができる。

### Tasks
- [ ] `lib/canvas/shadow.ts` を実装
  - 影用Canvasを別途生成し合成
  - パラメータ: 幅 / 扁平度 / Y位置 / ぼかし / 不透明度 / 色
- [ ] `lib/presets/shadowPresets.ts` を実装
  - 立ち絵プリセット
  - アイテムプリセット
  - リアル接地影プリセット
- [ ] `lib/canvas/resize.ts` を実装
  - サイズプリセット（YouTube / X / Instagram / ゲーム素材）
  - 任意サイズ指定
  - アスペクト比保持トグル
- [ ] `lib/canvas/export.ts` を実装
  - `canvas.toBlob` で PNG / JPEG / WebP 出力
  - 品質スライダー（JPEG/WebP用）
- [ ] `components/editor/tools/ShadowTool.tsx`, `ExportTool.tsx`

### Done When
- [ ] 影パラメータを個別調整可能、プリセット適用も可能
- [ ] 各種サイズへのリサイズ可能
- [ ] PNG出力で透過維持、JPEG出力で背景白塗りを確認

### 詳細参照
→ `@docs/05_shadow-and-presets.md`

---

## Phase 5: 仕上げ＆セキュリティ

**Goal**: UI整備、Undo/Redo、セキュリティ検証完了、AGPLライセンス対応。

### Tasks
- [ ] Zustand store の整理（Undo/Redo スタック実装）
- [ ] shadcn/ui でUI全体の統一感を出す
- [ ] Before/Afterスライダー実装
- [ ] レスポンシブ調整（タブレット以上を主対象）
- [ ] CSPヘッダ設定（`next.config.js`）
- [ ] セキュリティチェック（3段階）
  - レビュー確認 / AIコードレビュー / 通信確認
- [ ] パフォーマンス最適化(長辺2048px制限の実装)
- [ ] **AGPLライセンス対応**（詳細は `@docs/08_license.md`）
  - [ ] `LICENSE` ファイル（AGPL-3.0 全文）をリポジトリルートに配置
  - [ ] `package.json` の `license` を `"AGPL-3.0-or-later"` に設定
  - [ ] `package.json` の `repository` フィールドに GitHub URL 設定
  - [ ] `components/common/Footer.tsx` を実装し、GitHub リポジトリへのリンクを表示
  - [ ] `app/about/page.tsx` を実装し、ライセンス・謝辞を記載
  - [ ] フッターをルートレイアウト（`app/layout.tsx`）に組み込み

### Done When
- [ ] セキュリティチェック3段階すべて通過
- [ ] Networkタブで画像処理時に外部通信が発生しないことを確認
- [ ] UI全体に統一感がある
- [ ] フッターから GitHub リポジトリにアクセスできる
- [ ] `LICENSE` ファイルがリポジトリに含まれている

### 詳細参照
→ `@docs/06_deploy-and-security.md`、`@docs/08_license.md`

---

## Phase 6: 本番デプロイ

**Goal**: 本番URLですべての機能が動作する。

### Tasks
- [ ] `npm run build` でエラーが出ないことを確認
- [ ] Vercel本番デプロイ（mainブランチへmerge）
- [ ] 本番URLで全機能の動作確認
- [ ] README更新（使い方・開発手順・ライセンス節を含む）
- [ ] GitHub リポジトリが **Public** 設定であることを確認（AGPL遵守）
- [ ] 本番URLのフッターから GitHub に到達できることを確認

### Done When
- [ ] 本番URLですべての機能が動作する
- [ ] Lighthouseパフォーマンススコア80以上
- [ ] フッター → GitHub のリンクが本番環境で機能している

---

## 全体のリスクと対策

| リスク | 対策 |
|---|---|
| モデルファイルが大きい | IndexedDBキャッシュ、初回のみフルDL |
| 巨大画像でメモリ不足 | 長辺2048pxに内部リサイズ |
| iOS Safariの動作制限 | WebGPU非対応時はWebAssemblyフォールバック |
| 不審な外部通信が混入 | Phase完了ごとにNetworkタブで確認 |
| 依存ライブラリ脆弱性 | `npm audit` を定期実行 |
| Canvas処理の重さ | requestAnimationFrame / Web Worker分離 |

---

## ブランチ運用

- `main` → 本番
- `develop` → プレビュー環境（Vercel Preview Deploy）
- 機能ブランチ → `feature/phase-N-XXX` 形式

## コミット規約
Conventional Commits（`feat:` / `fix:` / `refactor:` / `docs:` / `chore:`）

---

## ファイル構成（正規版）

実装ファイルの完全なリスト。各Phaseで新規作成・更新するファイルは下表を参照すること。

### ディレクトリツリー

```
backcut/
├── app/
│   ├── layout.tsx                          # ルートレイアウト（メタデータ、フォント設定）
│   ├── page.tsx                            # トップページ（D&Dエリア）
│   ├── editor/
│   │   └── page.tsx                        # エディタ画面
│   ├── about/
│   │   └── page.tsx                        # About画面（ライセンス・謝辞）
│   └── globals.css                         # Tailwindベース + カスタムCSS
│
├── components/
│   ├── upload/
│   │   └── DropZone.tsx                    # ファイル受け取り（react-dropzone）
│   ├── editor/
│   │   ├── CanvasView.tsx                  # メインCanvasプレビュー
│   │   ├── ToolPanel.tsx                   # 右側ツールパネルのコンテナ
│   │   ├── LayerPanel.tsx                  # 左側履歴・レイヤー表示
│   │   ├── BeforeAfterSlider.tsx           # Before/After比較スライダー
│   │   └── tools/
│   │       ├── RemoveBgTool.tsx            # 背景透過実行ボタン・進捗表示
│   │       ├── RetouchTool.tsx             # ブラシ（戻す・消す）
│   │       ├── CropTool.tsx                # 自動・手動トリミング
│   │       ├── EdgeTool.tsx                # エッジ硬さ・ぼかし
│   │       ├── BackgroundTool.tsx          # 単色・グラデ・画像背景
│   │       ├── ShadowTool.tsx              # ドロップシャドウ調整
│   │       └── ExportTool.tsx              # フォーマット選択・書き出し
│   ├── ui/                                 # shadcn/ui コンポーネント（自動生成）
│   │   ├── button.tsx
│   │   ├── slider.tsx
│   │   ├── tabs.tsx
│   │   └── ...
│   └── common/
│       ├── Footer.tsx                      # フッター（GitHub・ライセンスリンク）
│       ├── ProgressBar.tsx                 # 処理進捗表示
│       ├── PresetSelector.tsx              # プリセット選択UI
│       └── ColorPicker.tsx                 # カラーピッカー
│
├── lib/
│   ├── bg-removal/
│   │   └── removeBackground.ts             # @imgly/background-removalラッパー
│   ├── canvas/
│   │   ├── retouch.ts                      # ブラシ処理（applyBrush）
│   │   ├── trim.ts                         # 自動・手動トリミング
│   │   ├── edge.ts                         # エッジ硬さ・ぼかし
│   │   ├── background.ts                   # 単色・グラデ・画像合成
│   │   ├── shadow.ts                       # ドロップシャドウ生成
│   │   ├── resize.ts                       # リサイズ処理
│   │   ├── export.ts                       # toBlob ラッパー
│   │   └── utils.ts                        # 共通ユーティリティ（resizeIfNeeded等）
│   ├── presets/
│   │   ├── shadowPresets.ts                # 影プリセット定義
│   │   └── sizePresets.ts                  # サイズプリセット定義
│   ├── zip/
│   │   └── createZip.ts                    # JSZipラッパー
│   └── store/
│       ├── editorStore.ts                  # Zustand store（メイン）
│       └── history.ts                      # Undo/Redoスタック
│
├── types/
│   └── index.ts                            # 共通型定義（BrushOptions等）
│
├── public/                                 # 静的アセット（faviconなど）
│
├── docs/                                   # 詳細ドキュメント（Claude Code参照用）
│   ├── 01_requirements.md
│   ├── 02_implementation-plan.md
│   ├── 03_bg-removal.md
│   ├── 04_canvas-editing.md
│   ├── 05_shadow-and-presets.md
│   ├── 06_deploy-and-security.md
│   └── 07_glossary.md
│
├── CLAUDE.md                               # Claude Code自動読込ファイル
├── next.config.js                          # Next.js設定（CSP・WebAssembly）
├── tailwind.config.ts
├── tsconfig.json                           # strict: true
├── package.json
├── vercel.json                             # Vercel設定（COOP/COEP等）
├── .prettierrc                             # Prettier設定
├── .eslintrc.json                          # ESLint設定
├── LICENSE                                 # AGPL-3.0 全文
└── README.md                               # プロジェクト概要・使い方
```

### Phase別の新規作成ファイル一覧

| Phase | 新規作成ファイル |
|---|---|
| **Phase 0** | `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `.prettierrc`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css` |
| **Phase 1** | `components/upload/DropZone.tsx`, `lib/bg-removal/removeBackground.ts`, `app/editor/page.tsx`, `components/editor/CanvasView.tsx`, `lib/zip/createZip.ts`, `lib/store/editorStore.ts`, `components/common/ProgressBar.tsx`, `components/editor/tools/RemoveBgTool.tsx`, `types/index.ts` |
| **Phase 2** | `lib/canvas/retouch.ts`, `lib/canvas/trim.ts`, `lib/canvas/utils.ts`, `components/editor/tools/RetouchTool.tsx`, `components/editor/tools/CropTool.tsx` |
| **Phase 3** | `lib/canvas/edge.ts`, `lib/canvas/background.ts`, `components/editor/tools/EdgeTool.tsx`, `components/editor/tools/BackgroundTool.tsx`, `components/common/ColorPicker.tsx` |
| **Phase 4** | `lib/canvas/shadow.ts`, `lib/canvas/resize.ts`, `lib/canvas/export.ts`, `lib/presets/shadowPresets.ts`, `lib/presets/sizePresets.ts`, `components/editor/tools/ShadowTool.tsx`, `components/editor/tools/ExportTool.tsx`, `components/common/PresetSelector.tsx` |
| **Phase 5** | `lib/store/history.ts`, `components/editor/BeforeAfterSlider.tsx`, `components/editor/ToolPanel.tsx`, `components/editor/LayerPanel.tsx`, `vercel.json`, `components/common/Footer.tsx`, `app/about/page.tsx`, `LICENSE`, `package.json`（license/repository更新） |
| **Phase 6** | `README.md` 更新（ライセンス節を含む） |

### 命名規則

- **Reactコンポーネント**: PascalCase（`CanvasView.tsx`, `DropZone.tsx`）
- **ユーティリティ・ライブラリ**: camelCase（`removeBackground.ts`, `editorStore.ts`）
- **型定義**: `types/index.ts` に集約、PascalCase（`BrushOptions`, `ShadowOptions`）
- **定数**: `lib/presets/` 配下に配置、camelCase オブジェクトでエクスポート
- **テストファイル**（将来追加時）: `xxx.test.ts` の形式で同階層に配置

### import パスのエイリアス

`tsconfig.json` の `paths` で以下のエイリアスを設定する：

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

これにより `import { processImage } from '@/lib/bg-removal/removeBackground'` のように書ける。
