# BackCut — Project Context for Claude Code

## What
**BackCut** は、ブラウザ完結型の背景透過＋画像編集アプリ。Next.js 14 (App Router) + TypeScript + Tailwind CSS で構築し、Vercel にデプロイする。

## Why
- AIに画像処理を直接依頼するとトークン浪費＋コンテキスト汚染が発生する → 専用アプリで切り出す
- 未公開素材を外部送信せず、すべてブラウザ内で完結する（プライバシー保護）
- オフラインでもゼロコストで動作する

## Core Principle（最重要）
**画像データは絶対に外部サーバーに送信しない**。すべての処理はブラウザ内（クライアントサイド）で完結する。
- バックエンドAPI、データベース、外部ストレージは使わない
- モデルファイルの初回ダウンロード以外、外部通信は発生してはならない
- API キー・環境変数は不要

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **Background Removal**: `@imgly/background-removal`（ブラウザでONNX推論）
- **Canvas編集**: 標準 Canvas API（外部画像編集ライブラリは使わない）
- **ZIP出力**: `JSZip`
- **D&D**: `react-dropzone`
- **Deploy**: Vercel（静的書き出し）

---

## Commands

```bash
npm run dev      # 開発サーバー起動（http://localhost:3000）
npm run build    # 本番ビルド
npm run start    # 本番サーバー起動（ビルド後）
npm run lint     # ESLint
npm run format   # Prettier（設定後）
```

---

## Project Structure (Map)

```
backcut/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # ルートレイアウト
│   ├── page.tsx                      # トップ（D&Dエリア）
│   ├── editor/page.tsx               # エディタ画面
│   └── globals.css                   # Tailwindベーススタイル
├── components/
│   ├── upload/DropZone.tsx           # ファイル受け取り
│   ├── editor/
│   │   ├── CanvasView.tsx            # メインプレビュー
│   │   ├── ToolPanel.tsx             # 右側ツールパネル
│   │   ├── LayerPanel.tsx            # 左側履歴パネル
│   │   └── tools/                    # 各ツールパネル（Retouch/Crop/Edge等）
│   ├── ui/                           # shadcn/ui
│   └── common/                       # ProgressBar, PresetSelector など
├── lib/
│   ├── bg-removal/removeBackground.ts  # 背景透過処理
│   ├── canvas/                         # Canvas API 編集処理
│   │   ├── retouch.ts                  # ブラシ処理
│   │   ├── trim.ts                     # トリミング
│   │   ├── edge.ts                     # エッジ調整
│   │   ├── background.ts               # 背景合成
│   │   ├── shadow.ts                   # ドロップシャドウ
│   │   ├── resize.ts                   # リサイズ
│   │   └── export.ts                   # 出力処理
│   ├── presets/                        # shadowPresets / sizePresets
│   ├── zip/createZip.ts                # ZIP生成
│   └── store/editorStore.ts            # Zustand store
├── types/index.ts                    # 共通型定義
├── public/                           # 静的アセット
└── docs/                             # 詳細ドキュメント（@-mentionで参照）
```

> ファイル単位の完全な構成と命名規則は `@docs/02_implementation-plan.md` の「ファイル構成（正規版）」を参照。

---

## Coding Conventions

- **TypeScript strict mode** を有効化する。`any` を避け、必要に応じて `unknown` を使う
- **ES Modules** を使う（`import`/`export`）。CommonJS は使わない
- **Named exports** を基本とする（デフォルトエクスポートは Next.js のページコンポーネント等のみ）
- **関数コンポーネント + Hooks** で統一
- **shadcn/ui** のコンポーネントを優先的に使い、独自UIは最小化
- **状態管理**は Zustand に集約する。ローカル状態は `useState`、複数コンポーネント間の共有は store 経由
- **ファイル名**: コンポーネントは PascalCase（`CanvasView.tsx`）、それ以外は kebab-case または camelCase

---

## Critical Constraints（必ず守る）

1. **外部送信禁止**: 画像データ・ImageData・Blob は `fetch` や `XHR` で送信しない。コードレビュー時に必ず確認する
2. **トラッキング禁止**: Google Analytics などのトラッキングタグは入れない
3. **PNG出力で透過維持**: 透過情報を維持する出力は PNG または WebP のみ。JPEG では透過は失われる
4. **大画像の処理**: 長辺 2048px を超える画像は処理前に内部リサイズする（メモリ不足回避）
5. **モデルキャッシュ**: `@imgly/background-removal` のモデルは IndexedDB に自動キャッシュされる。明示的に消さない
6. **Canvas のメモリリーク**: 使い終わった ImageBitmap / OffscreenCanvas は `close()` で解放する
7. **AGPL ライセンス遵守**: `@imgly/background-removal` は AGPL-3.0。本プロジェクトは **AGPL-3.0-or-later** で公開する。アプリのフッターまたは About 画面に **GitHub リポジトリへのリンク**を必ず表示すること（Webサービスとしてのソース開示義務）。詳細は `@docs/08_license.md` を参照

---

## Workflow Rules

- **新機能を実装する前**に、`docs/02_implementation-plan.md` の該当フェーズを確認する
- **大きな変更**を加える前に、計画を提示してユーザーの確認を取る
- **依存ライブラリを追加する場合**は、まずユーザーに提案し承認を得てから `npm install` する
- **コミット前**に必ず以下を実行：
  - `npm run lint`
  - `npm run build`
- **Network タブで通信確認**: 新しい処理を追加したら、DevTools の Network タブで不審な外部通信が発生していないことを確認する
- **切りのいいタイミングで Notion を更新**: Phase完了時など、節目で実装記録を Notion に残す。詳細は下記「Notion 実装記録」を参照

---

## Notion 実装記録

実装の進捗・記録は **Notion のプロジェクトページ** に蓄積する。

- **親ページURL**: https://www.notion.so/365367739cf781e0844bf865f4975f14
- **MCP**: Notion MCP（`Notion:notion-create-pages`, `Notion:notion-update-page`, `Notion:notion-fetch` 等）を使用する

### 更新タイミング（切りのいいタイミング）

以下のいずれかに該当したら、ユーザーに確認したうえで Notion を更新する：

1. **Phase 完了時**（最重要）: 各 Phase の Done When を満たしたタイミング
2. **重要な技術判断をした時**: ライブラリ選定、設計方針の変更、トレードオフのある決定
3. **詰まりポイントを解決した時**: 試行錯誤の末に解決した問題、後で再発しそうな知見
4. **セキュリティチェックを実施した時**: 3段階チェックの結果
5. **本番デプロイ時**: 本番URL、Lighthouseスコア、確認した動作

### 記録する内容

Phase完了時は **親ページの子ページ** として以下の構成で作成する：

- **タイトル**: `Phase N 完了記録 - YYYY-MM-DD`（例: `Phase 1 完了記録 - 2026-05-19`）
- **本文に含めること**:
  - 実装した機能（Done When チェックリストの結果）
  - 作成・変更したファイル一覧
  - 採用した技術・ライブラリと選定理由
  - **詰まったポイントと解決方法**（最重要・後で見返す）
  - 通信確認結果（Networkタブのスクショ要否はユーザー判断）
  - 次の Phase に向けたメモ

### 親ページの更新

Phase 完了時は、親ページ内の以下も更新する（`Notion:notion-update-page` を使用）：

- 「実装フェーズ」の該当 Phase のチェックボックスを完了済みにする
- 「完成の定義（Definition of Done）」で達成した項目をチェック

### 実行方法

ユーザーが「Phase N が完了したのでNotionにまとめて」と指示した場合、または Phase の Done When を満たした時点でClaude側から提案する形で記録する。Notionへの書き込み前に、必ずユーザーに以下を確認すること：

- 記録する内容のサマリーを提示
- 親ページ配下に子ページとして作成してよいか
- 追加で記載したい内容があるか



進捗・状況に応じて以下のドキュメントを読みに行くこと。すべてを最初から読む必要はない。

- **要件全体を理解したい時** → `@docs/01_requirements.md`
- **実装フェーズ・タスクを確認したい時** → `@docs/02_implementation-plan.md`
- **背景透過処理の詳細** → `@docs/03_bg-removal.md`
- **Canvas API 編集処理の詳細** → `@docs/04_canvas-editing.md`
- **影・プリセット設計** → `@docs/05_shadow-and-presets.md`
- **Vercelデプロイ・セキュリティ設定** → `@docs/06_deploy-and-security.md`
- **ドメイン用語集** → `@docs/07_glossary.md`
- **AGPL ライセンス対応** → `@docs/08_license.md`

---

## Current Phase

実装は段階的に進める。現在のフェーズは `docs/02_implementation-plan.md` を参照し、未着手のフェーズがあれば最初のものから着手する。

実装開始時は、まずどのフェーズを進めるかをユーザーに確認すること。
