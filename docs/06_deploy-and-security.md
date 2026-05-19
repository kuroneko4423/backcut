# 06. Vercelデプロイ & セキュリティ

> Phase 5〜6 で実施。CSPヘッダ、セキュリティチェック、Vercel設定の指針。

---

## Vercelデプロイ

### 基本構成
- Next.js App Router を使用
- ビルドコマンド: `next build`（Vercelが自動検出）
- 環境変数: **不要**（完全クライアントサイドのため）

### `vercel.json`（任意・WebAssembly関連で必要な場合）

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy",   "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
      ]
    }
  ]
}
```

> 注: `SharedArrayBuffer` を使う場合に必要。`@imgly/background-removal` のバージョンによっては必要になる。動作確認しながら設定する。

### `next.config.js`（CSP含む）

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // WebAssembly対応
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
  // セキュリティヘッダ
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'wasm-unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data:",
              "worker-src 'self' blob:",
              "connect-src 'self' https://*.imgly.com", // モデルDL先のドメイン
              "font-src 'self'",
              "object-src 'none'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options',         value: 'DENY' },
          { key: 'Referrer-Policy',         value: 'no-referrer' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

> 注: `connect-src` の許可ドメインは、`@imgly/background-removal` の実際のモデル配信先に合わせて調整する。

---

## セキュリティ 3段階チェック

新規ライブラリの導入時、および Phase 5 完了時に必ず実施する。

### ① レビューの確認

- GitHub Stars / 直近のリリース頻度
- Issues に未解決の脆弱性報告がないか
- npm downloads（直近の利用状況）
- `npm view <package> versions` で過去バージョンの確認

### ② AIによるコードレビュー

Claude Opus 4系 / GPT-4系などに以下の観点で確認させる：

- 画像データの外部送信が混入していないか
- ファイル書き込み・読み込みで意図しない領域を触っていないか
- XSS脆弱性（特に `dangerouslySetInnerHTML` の使用）
- メモリリーク（特に Canvas / ImageBitmap の解放漏れ）
- 依存ライブラリのバージョンが古くないか

### ③ 通信の確認

- DevTools の Network タブを開く
- フィルタを `XHR` / `Fetch` に絞る
- アプリの全機能を一通り操作
- 以下を確認：
  - **初回モデルDL以外**で外部通信が発生していないこと
  - POST / PUT リクエストが発生していないこと
  - 画像データを含むリクエストがないこと

---

## 依存ライブラリ管理

```bash
# 脆弱性チェック
npm audit

# 自動修正できるものは修正
npm audit fix

# 古いパッケージを確認
npm outdated
```

`package.json` の `scripts` に追加しておくと便利：

```json
{
  "scripts": {
    "audit": "npm audit",
    "audit:fix": "npm audit fix"
  }
}
```

---

## デプロイチェックリスト

本番リリース前に必ず以下を確認：

- [ ] `npm run build` がエラーなく完了
- [ ] `npm run lint` がエラーなく完了
- [ ] `npm audit` で脆弱性ゼロ
- [ ] CSPヘッダが意図通り設定されている（DevTools Networkで確認）
- [ ] 全機能の動作確認（Phase 1〜4の Done When 全項目）
- [ ] Networkタブで画像データの外部送信がないことを確認
- [ ] Chrome / Firefox / Safari で動作確認
- [ ] Lighthouseスコア（Performance / Accessibility / SEO）を確認
- [ ] README が最新化されている

---

## ブランチ運用

- `main` → 本番（Vercel Production Deploy）
- `develop` → プレビュー環境（Vercel Preview Deploy）
- `feature/phase-N-XXX` → 機能ブランチ
- PR時に Vercel が自動でプレビューURLを生成する

## トラブルシューティング

| 症状 | 確認ポイント |
|---|---|
| ビルド時にWebAssembly関連エラー | `next.config.js` の `webpack.experiments.asyncWebAssembly` |
| `SharedArrayBuffer is not defined` | COOP/COEPヘッダの設定（`vercel.json`） |
| モデルDLに失敗 | CSPの `connect-src` 設定、ネットワーク環境 |
| Canvasの描画が真っ黒 | `globalCompositeOperation` の操作後に `restore()` 漏れ |
| メモリリーク（タブが重くなる） | `ImageBitmap.close()` / `OffscreenCanvas` の解放漏れ |
