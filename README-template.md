# BackCut

> ブラウザ完結型 背景透過＋画像編集アプリ

**BackCut** は、画像の背景透過から仕上げ（影合成、エッジ調整、リサイズ）までを **すべてブラウザ内で完結** できるWebアプリです。AIトークン消費もサーバー送信もなく、プライバシーを守りながら高速に動作します。

🔗 **Live Demo**: https://<your-vercel-url>.vercel.app（デプロイ後に更新）

---

## 特徴

- 🛡️ **完全ローカル処理**: 画像データは外部に送信されません
- ⚡ **オフライン動作**: 初回モデルDL後はネット接続不要
- 🎨 **多機能エディタ**: 背景透過、レタッチ、トリミング、影、リサイズ
- 📦 **一括処理**: 複数画像をまとめてZIP出力
- 🆓 **無料・OSS**: AGPL-3.0 ライセンスで公開

---

## 主な機能

| 機能 | 内容 |
|---|---|
| 背景透過 | ドラッグ＆ドロップで自動透過、複数画像の一括処理 |
| レタッチ | 透過のやり直し（戻す・消す）をブラシで手動補正 |
| トリミング | 自動（余白カット）と手動（範囲指定）の両対応 |
| エッジ調整 | 境界の硬さ・ぼかしを調整 |
| 背景合成 | 単色・グラデーション・画像背景 |
| 影合成 | ドロップシャドウ、用途別プリセット（立ち絵・アイテム等） |
| リサイズ | YouTube/X/Instagram など各種サイズプリセット |
| 出力 | PNG / WebP（透過維持）/ JPEG（背景白塗り） |

---

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router) + TypeScript
- **スタイリング**: Tailwind CSS + shadcn/ui
- **状態管理**: Zustand
- **背景透過**: [@imgly/background-removal](https://github.com/imgly/background-removal-js)
- **画像編集**: 標準 Canvas API
- **デプロイ**: Vercel

---

## ローカル開発

### 必要環境
- Node.js 18 以降
- npm

### セットアップ

```bash
# クローン
git clone https://github.com/<your-username>/backcut.git
cd backcut

# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:3000 を開く。

### コマンド

```bash
npm run dev      # 開発サーバー
npm run build    # 本番ビルド
npm run start    # 本番サーバー起動
npm run lint     # ESLint
```

---

## デプロイ

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/<your-username>/backcut)

---

## プライバシー

BackCut は **画像データを一切外部に送信しません**。

- ❌ サーバーへの画像アップロードなし
- ❌ クラウドへの保存なし
- ❌ トラッキング・解析ツールなし
- ✅ すべての処理はブラウザ内で完結
- ✅ オフラインでも動作（初回モデルDL後）

---

## ライセンス

本プロジェクトは **AGPL-3.0-or-later** のもとで公開されています。
完全なライセンス文は [LICENSE](./LICENSE) を参照してください。

### なぜ AGPL なのか

本プロジェクトは [@imgly/background-removal](https://github.com/imgly/background-removal-js)（AGPL-3.0）に依存しているため、派生物として同等の AGPL ライセンスで公開されます。

### あなたが BackCut を改変・派生する場合

AGPL-3.0 に従い、以下が必要です：

- ソースコードを公開する（GitHub Public リポジトリ等）
- 派生物も AGPL-3.0-or-later で公開する
- アプリのUIから「ソースコードへの到達手段」を提供する（フッターリンクなど）

商用利用でクローズドソース化したい場合は、[IMG.LY](mailto:support@img.ly) にお問い合わせください。

### 第三者ライセンス

- `@imgly/background-removal` — AGPL-3.0 — IMG.LY GmbH
- その他: `package.json` および `node_modules/` 内のライセンス情報を参照

---

## 謝辞

- [IMG.LY](https://img.ly/) — `@imgly/background-removal` の提供
- [shadcn/ui](https://ui.shadcn.com/) — UIコンポーネント
- すべての OSS コントリビューター
