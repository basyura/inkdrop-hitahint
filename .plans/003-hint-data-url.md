# hint span への data-url 付与計画

## 目的

生成する hint の `span` タグに、対象要素に対応する URL を `data-url` 属性として設定する。

## 修正方針

- `lib/hitahint.js` の `createHint` で hint 用 `span` を生成する際に、対象要素から URL を取得する。
- URL を取得できる対象では `span.dataset.url` に値を設定する。
- URL を持たない操作対象、例えばチェックボックスやサイドバー項目には `data-url` を設定しない。
- 既存の open 動作は維持する。
- hint 用 `span` に元要素を独自プロパティとして保持せず、必要な箇所はクロージャーで `ele` を参照する。

## 対象 URL

- プレビュー内リンク: `ele.href`
- compact link mark: `ele.url` または `ele.dataset.url`
- CodeMirror URL: `ele.innerText`
- 画像: `ele.src`
- ノート一覧項目: `inkdrop://note/{id}`

## 確認方法

- `npm pack` でパッケージ内容に問題がないことを確認する。
- Inkdrop 上では、hint 表示時に該当 hint の `span.hint` に `data-url` が付くことを DevTools で確認する。
