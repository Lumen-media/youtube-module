# YouTube for Lumen

[Lumen](https://github.com/Lumen-media/lumen) を離れずに YouTube を検索。動画を見つけて、プレビューして、キュー・ライブラリ・画面へそのまま送信 — すべてコマンドパレットから。

<img width="776" height="504" alt="Commander での YouTube 検索" src="https://github.com/user-attachments/assets/f7b3ee47-bb12-453b-93db-912af881e3e8" />

## できること

- **即時検索** — Commander にキーワードを入力するだけで高速に結果を表示。ブラウザ不要。
- **再生方法は自由に** — 今すぐ再生、キューの最後に追加、次に追加、ライブラリに保存がワンキーで。
- **設定不要で使える** — すぐに動作。オプションの Google API キーで地域・言語フィルタリングがより正確に。
- **スマート自動切替** — クォータを使い切ると、Google API とキー不要の Invidious ソースを自動で切り替え。
- **貼り付けるだけ** — `youtube.com`、`youtu.be`、`shorts`、`embed` のリンクを検索欄に貼れば即解決。
- **あなたの画面、あなたの言語** — セーフサーチ、結果件数、地域、言語の設定はすべて設定画面から。

## クイックスタート

1. Lumen にモジュールをインストール（**設定 → モジュール → モジュールをインストール**）し、最新リリースの `.lumenpack` を選択します。
2. コマンドパレット（`Ctrl+Shift+P`）を開き、`YouTube: Search` を実行します。
3. キーワードを入力して検索。結果を選択して:

| キー | アクション |
|---|---|
| `Enter` | 今すぐ再生 |
| `Q` | キューの最後に追加 |
| `N` | 次に追加 |
| `L` | ライブラリに追加 |
| `O` | YouTube で開く |
| `Y` | URL をコピー |

## さらに高速に

コマンドパレットに直接 `youtube <キーワード>` または `yt <キーワード>` と入力すれば、モジュールを開かずに検索できます:

| プレフィックス | 例 |
|---|---|
| `youtube` | `youtube hillsong oceans` |
| `yt` | `yt tudo posso` |

## パワーユーザー向け

- YouTube の URL を検索欄に貼り付けると即座に解決されます。
- **設定**（歯車アイコン）で、検索ソース、地域、言語、セーフサーチ、デフォルトアクションを選択。
- Google API キーを追加すると結果がより正確になり、地域フィルタリングが使えます — 必須ではありません。

---

[Lumen](https://github.com/Lumen-media/lumen) プラットフォーム向けに制作。MIT ライセンス — 技術詳細は [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) を参照。

[Invidious API](https://docs.invidious.io/api/) を採用 — キー不要の制限なし YouTube 検索に公開 Invidious インスタンスを使用。