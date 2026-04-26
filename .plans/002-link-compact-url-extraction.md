# link-compact 短縮リンク抽出対応計画

## 背景

- `link-compact` plugin で URL が短縮表示されている場合、`hitahint` の editor mode でリンク hint の抽出または URL 復元が安定していない
- `link-compact` は CodeMirror 6 の `Decoration.replace()` で URL 部分を `.link-compact-mark` widget に置き換えている
- `short-link` plugin は廃止済みのため、新規修正では互換処理を考慮しない

## 調査メモ

- [x] `link-compact` の widget class が `.link-compact-mark` であることを確認した
- [x] `link-compact` 側は Markdown リンク URL 範囲を `](...)` から括弧の深さを見て解析していることを確認した
- [x] 現在の `hitahint` は `.link-compact-mark` を見ているが、URL 復元が `lastIndexOf("](")` / `indexOf(")")` の簡易処理で括弧入り URL や DOM 位置解決に弱い
- [x] 短縮後 DOM は URL 部分が `.link-compact-mark` widget へ置換され、前後の `(` / `)` は通常 span として残ることを確認した
- [x] `link-compact` 側で `.link-compact-mark` に `data-url` を保持する実装へ変更済み

## 修正方針

1. URL 取得

- [x] `link-compact` の `.link-compact-mark[data-url]` から URL を取得する
- [x] CodeMirror の document text 解析と `posAtDOM()` による URL 復元を削除する
- [x] `data-url` がない widget は対象外にする

2. widget から URL 復元

- [x] `.link-compact-mark` の `dataset.url` を `span.url` に設定する
- [x] hint 確定時は `ele.url` を開く既存経路を維持し、必要なら `ele.dataset.url` も使う

3. 廃止 plugin 対応の整理

- [x] `short-link-mark` 判定を削除する
- [x] `short-link` 由来の互換コメントや分岐を残さない

4. 確認

- [x] `node --check lib/extractor.js`
- [x] `node --check lib/hitahint.js`
- [x] `npm_config_cache=/tmp/hitahint-npm-cache npm pack --dry-run` で配布内容に問題がないか確認する
- [x] Inkdrop Canary 実機で `link-compact` 短縮表示中の Markdown リンクを開けるか確認する

## 想定アウトプット

- `lib/extractor.js`
- `lib/hitahint.js`
- この計画ファイル

## 完了条件

- `link-compact` 短縮表示中の Markdown リンクに hint が表示される
- hint 確定時に短縮前の URL が開く
- 廃止済みの `short-link` plugin 向け互換処理が削除されている
- 構文確認が通っている
