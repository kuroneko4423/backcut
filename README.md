# BackCut Documentation Set for Claude Code

このドキュメント群は **Claude Code に効率的に読み込ませる** ことを目的に設計されています。

## ドキュメント構成

```
backcut/                            # プロジェクトルート
├── CLAUDE.md                       # ★ Claude Code が自動読込（リーン構成）
└── docs/
    ├── 01_requirements.md          # 要件定義（必要時に参照）
    ├── 02_implementation-plan.md   # 実装計画・タスクリスト
    ├── 03_bg-removal.md            # 背景透過処理の詳細
    ├── 04_canvas-editing.md        # Canvas編集処理の詳細
    ├── 05_shadow-and-presets.md    # 影とプリセット設計
    ├── 06_deploy-and-security.md   # Vercel & セキュリティ
    ├── 07_glossary.md              # ドメイン用語集
    └── 08_license.md               # AGPL-3.0 ライセンス対応
```

別途、`README-template.md` がプロジェクトの README として配置するためのテンプレートです。

---

## 設計の考え方（Progressive Disclosure）

Claude Code のベストプラクティスに従い、以下の構成にしています：

- **`CLAUDE.md`** は **リーン**（200行未満）に保つ
  - プロジェクト全体の地図、最重要ルール、コマンド、ポインタのみ
  - Claude Code が全セッションで自動読込
- **詳細ドキュメント** は `docs/` 配下に分割
  - `CLAUDE.md` から `@docs/XX.md` でポインタ参照
  - 必要なときだけ Claude がオンデマンドで読みに行く

これにより、コンテキストウィンドウを浪費せず、作業フェーズに応じて適切な詳細情報だけが読み込まれます。

---

## 使い方

### 1. ドキュメントを配置する

このドキュメント群をプロジェクトルートに配置します：

```bash
# プロジェクト作成後
cd backcut
# CLAUDE.md をプロジェクトルートに配置
# docs/ 配下を配置
```

### 2. Claude Code を起動する

```bash
cd backcut
claude
```

Claude Code は起動時に **`CLAUDE.md` を自動で読み込み** ます。

### 3. 実装を依頼する

たとえば以下のように依頼します：

```
Phase 0 を進めてください。
```

Claude は `CLAUDE.md` のポインタから `docs/02_implementation-plan.md` を読み、Phase 0 のタスクリストに沿って実装を進めます。

```
Phase 2 のレタッチ機能を実装してください。
```

この場合、Claude は実装計画書から `04_canvas-editing.md` のレタッチセクションをオンデマンドで読みに行きます。

---

## ドキュメントのメンテナンス

- 実装中に判明したルール・規約は **`CLAUDE.md` に追記**
- ただし `CLAUDE.md` は200行を超えないように、長くなる詳細は `docs/` に分離する
- 機能追加・変更時は `02_implementation-plan.md` のタスクリストも更新
- 新しいライブラリ追加時は、必ず **3段階セキュリティチェック**（`06_deploy-and-security.md`）を実施

---

## 参考にしたベストプラクティス

このドキュメント構成は、以下の Claude Code 公式・コミュニティのベストプラクティスに基づいています：

- `CLAUDE.md` はリーンに保つ（200行未満）
- WHAT / WHY / HOW を明確化
- Progressive Disclosure で詳細を分離
- ポインタ参照で必要時のみ読み込む
- プロジェクトの「最重要原則」を明示する
