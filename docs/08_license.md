# 08. ライセンス対応（AGPL-3.0）

> 本プロジェクトは `@imgly/background-removal`（AGPL-3.0）に依存しているため、プロジェクト全体を **AGPL-3.0-or-later** で公開する。
> 本ドキュメントは AGPL の義務を満たすための実装ガイド。

---

## 概要

| 項目 | 内容 |
|---|---|
| プロジェクトライセンス | AGPL-3.0-or-later |
| 公開形態 | GitHub Public リポジトリ + Vercel デプロイ |
| 主要AGPL依存 | `@imgly/background-removal` |
| 商用クローズドソース化 | 不可（IMG.LY と別ライセンス契約が必要） |

---

## AGPL の3つの義務とその対応

### 義務① ソースコード開示

**AGPL は Webサービスとして提供する場合もソース開示を要求する**（GPLとの最大の違い）。

**対応**:
- GitHub Public リポジトリで全コードを公開する
- 改変を加えた場合も Public リポジトリに反映する
- `.gitignore` で意図的にソースを隠さない（`.env` などの設定ファイルは除く）

### 義務② アプリ内からソースへの到達手段の提供

**Webサービスのユーザーが「ソースを取得できる手段」をアプリ内に提示する必要がある**。
README に書くだけでは不十分。**アプリのUIから辿れる**ことが重要。

**対応**:
- フッターに「Source Code」リンクを設置（必須）
- または、About画面 / 設定画面に GitHub URL を表示
- リンク先は本プロジェクトのGitHub URL（`https://github.com/<user>/backcut` など）

### 義務③ ライセンス伝播

**AGPL ライブラリを使った成果物全体が AGPL に従う必要がある**。

**対応**:
- `package.json` の `license` フィールドを `"AGPL-3.0-or-later"` にする
- リポジトリルートに `LICENSE` ファイル（AGPL-3.0 全文）を配置
- `README.md` 末尾にライセンス記載とAGPL概要を載せる

---

## 実装チェックリスト

Phase 5（仕上げ）と Phase 6（本番デプロイ）で以下を完了させる：

- [ ] リポジトリルートに `LICENSE` ファイル（AGPL-3.0 全文）を配置
- [ ] `package.json` の `license` を `"AGPL-3.0-or-later"` に設定
- [ ] `package.json` の `repository` フィールドに GitHub URL を設定
- [ ] アプリのフッター（または About 画面）に GitHub リポジトリへのリンクを設置
- [ ] `README.md` にライセンス節を追加
- [ ] フッターに依存ライブラリへの謝辞（IMG.LY 等）を含める（推奨）

---

## 実装サンプル

### `package.json` の設定

```json
{
  "name": "backcut",
  "version": "0.1.0",
  "license": "AGPL-3.0-or-later",
  "repository": {
    "type": "git",
    "url": "https://github.com/<your-username>/backcut.git"
  },
  "author": "<your-name>",
  "description": "Browser-based background removal app (BackCut)"
}
```

### フッターコンポーネント

`components/common/Footer.tsx` を作成し、ルートレイアウトに配置する。

```tsx
import Link from 'next/link';

// 環境変数で GitHub URL を切り替え可能にする（後述）
const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL ?? 'https://github.com/<your-username>/backcut';

export function Footer() {
  return (
    <footer className="border-t py-4 px-6 text-sm text-muted-foreground">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>
          BackCut — Licensed under{' '}
          <a
            href="https://www.gnu.org/licenses/agpl-3.0.html"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            AGPL-3.0-or-later
          </a>
        </p>
        <nav className="flex items-center gap-4">
          <Link
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Source Code
          </Link>
          <Link href="/about" className="underline hover:text-foreground">
            About
          </Link>
        </nav>
      </div>
    </footer>
  );
}
```

### About 画面（推奨）

`app/about/page.tsx` を作成し、依存ライブラリの謝辞を含める：

```tsx
export default function AboutPage() {
  return (
    <main className="prose mx-auto max-w-3xl py-12 px-6">
      <h1>About BackCut</h1>
      <p>
        BackCut はブラウザ完結型の背景透過＋画像編集アプリです。
        すべての画像処理はあなたのブラウザ内で実行され、外部サーバーには送信されません。
      </p>

      <h2>ライセンス</h2>
      <p>
        本アプリは <a href="https://www.gnu.org/licenses/agpl-3.0.html">AGPL-3.0-or-later</a>{' '}
        のもとで公開されています。ソースコードは
        <a href="https://github.com/<your-username>/backcut"> GitHub</a> で確認できます。
      </p>

      <h2>謝辞</h2>
      <ul>
        <li>
          <a href="https://github.com/imgly/background-removal-js">@imgly/background-removal</a>{' '}
          — IMG.LY（AGPL-3.0）
        </li>
        <li>
          <a href="https://nextjs.org/">Next.js</a>, <a href="https://react.dev/">React</a>,{' '}
          <a href="https://tailwindcss.com/">Tailwind CSS</a>, その他多数の OSS
        </li>
      </ul>
    </main>
  );
}
```

### `README.md` の末尾に追加

```markdown
## License

This project is licensed under the **AGPL-3.0-or-later** license.
See the [LICENSE](./LICENSE) file for the full license text.

### Why AGPL?

This project depends on [@imgly/background-removal](https://github.com/imgly/background-removal-js),
which is licensed under AGPL-3.0. As a derivative work, BackCut must also be released under a
compatible license.

If you fork or modify this project and run it as a network service, you must also make your
source code available to your users under AGPL-3.0.

### Third-Party Licenses

- `@imgly/background-removal` — AGPL-3.0 — IMG.LY GmbH
- Other dependencies: see `package.json` and individual licenses in `node_modules/`
```

---

## LICENSE ファイル

AGPL-3.0 の全文を含む `LICENSE` ファイルをリポジトリルートに配置する。

GitHub でリポジトリを作成する際、「Choose a license」で **GNU Affero General Public License v3.0** を選択すれば自動生成される。

または、以下の URL からダウンロード可能：
- https://www.gnu.org/licenses/agpl-3.0.txt

ファイル冒頭に著作権表記を追加：

```
Copyright (C) 2026 <your-name>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

[以下、AGPL-3.0 全文]
```

---

## 環境変数（オプション）

GitHub URL をハードコーディングしたくない場合、`.env.local` で管理：

```env
NEXT_PUBLIC_GITHUB_URL=https://github.com/<your-username>/backcut
```

Vercel のプロジェクト設定でも同じキーで環境変数を登録する。

> 注: `NEXT_PUBLIC_` プレフィックスはクライアントサイドに公開される。GitHubのURLは公開してOK。

---

## やってはいけないこと

- ❌ GitHubリポジトリを Private に変更する（AGPL違反）
- ❌ フッターから GitHub リンクを削除する（ソース到達手段の喪失）
- ❌ `package.json` の license を MIT などに変更する（ライセンス違反）
- ❌ `@imgly/background-removal` のソースを改変して非公開化する
- ❌ クローズドソースの派生プロジェクトを作る

---

## 将来の選択肢

AGPL の制約が問題になった場合の選択肢：

1. **IMG.LY と商用ライセンス契約**: support@img.ly に問い合わせ
2. **ライブラリ差し替え**: transformers.js（Apache 2.0）+ 適切なモデルへ移行
3. **AGPL のまま継続**: 個人プロジェクトとして運営

---

## 参考リンク

- [AGPL-3.0 公式](https://www.gnu.org/licenses/agpl-3.0.html)
- [AGPL FAQ（GNU）](https://www.gnu.org/licenses/gpl-faq.html)
- [@imgly/background-removal リポジトリ](https://github.com/imgly/background-removal-js)
- [IMG.LY 商用ライセンス問い合わせ](mailto:support@img.ly)
