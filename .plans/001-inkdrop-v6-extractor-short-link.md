# Inkdrop v6 extractor short link 対応計画

## 背景

- Inkdrop v6 対応の一環として `hitahint` の editor mode 動作確認を進めている
- 現時点で `hitahint:show` 実行時に `lib/extractor.js` で例外が発生し、short link の抽出処理が止まる
- 原因は CodeMirror 5 前提の `cm.getAllMarks()` 呼び出しで、Inkdrop v6 / CodeMirror 6 では互換性がない可能性が高い

## 現状整理

### 発生しているエラー

- [x] 例外内容を記録した
- [x] スタックトレースを記録した

#### エラー詳細

- [x] `/Users/tatsuya/repos…lib/extractor.js:50 Uncaught TypeError: cm.getAllMarks is not a function`
- [x] `at #extractFromEditor (/Users/tatsuya/repos…/lib/extractor.js:50:8)`
- [x] `at Extractor.execute (/Users/tatsuya/repos…/lib/extractor.js:13:40)`
- [x] `at HTMLBodyElement.show (/Users/tatsuya/repos…/lib/hitahint.js:38:51)`

### 確認できたこと

- [x] `lib/extractor.js` の editor mode 抽出処理は `.cm-url` に加えて short link を別扱いで収集している
- [x] short link 抽出は `inkdrop.getActiveEditor().cm.getAllMarks()` に依存していた
- [x] `short-link` プラグインの v6 実装では `Decoration.replace()` により `.short-link-mark` を描画している
- [x] そのため v5 の mark API ではなく、CM6 の DOM / 位置解決ベースで扱う方針が妥当と判断した

### 対応済み

- [x] `cm.getAllMarks()` 依存を除去した
- [x] `.short-link-mark` を editor DOM から直接収集するようにした
- [x] `posAtDOM()` で widget の文書位置を取得するようにした
- [x] エディタ本文から `](...)` の URL 部分を逆算して `span.url` に設定するようにした
- [x] `node --check lib/extractor.js` で構文確認した

### 要確認

- [ ] Inkdrop v6 実機で short link を含むノートに対して `hitahint:show` を実行し、例外が解消しているか
- [ ] short link のヒント選択で正しい URL が開くか
- [ ] bare URL の `.cm-url` と short link が混在するノートでも期待どおり抽出できるか
- [ ] `)` を含む URL や複数リンクが近接するケースで復元ロジックに問題がないか

## 参照前提

- Inkdrop v6 では editor mode が CodeMirror 6 ベースで動作している
- `short-link` プラグインの現行実装は mark API ではなく `Decoration.replace()` を使って `.short-link-mark` を描画している
- v5 の `getAllMarks()` に依存する実装は v6 では互換性がないため、DOM と document position に寄せる必要がある

## 対応方針

1. 例外原因の明確化

- [x] 例外発生箇所を `lib/extractor.js` の `#extractFromEditor()` に特定する
- [x] `cm.getAllMarks()` が v6 で使えないことを確認する
- [x] short link の描画元が `short-link` プラグインの CM6 widget であることを確認する

2. 実装修正

- [x] `.cm-url` の抽出ロジックは維持する
- [x] `.short-link-mark` の抽出を DOM ベースに置き換える
- [x] `posAtDOM()` と editor text を使って URL を復元する
- [x] `createHint()` 側の既存 `short-link-mark` 分岐をそのまま使える形に合わせる

3. 動作確認

- [ ] Inkdrop v6 で short link ノートを開いた状態で `hitahint:show` を実行する
- [ ] 例外が発生しないことを確認する
- [ ] short link のヒント選択で `open(ele.url)` が期待どおり動作することを確認する
- [ ] note list / sidebar / preview mode への副作用がないことをざっと確認する

4. 仕上げ

- [x] plan に調査内容とスタックトレースを反映する
- [ ] 必要なら README や移行メモに v6 対応内容を追記する
- [ ] 他の v5 API 依存がないかを別課題として整理する

## 完了条件

- [x] `cm.getAllMarks()` に起因する例外原因が明文化されている
- [x] `lib/extractor.js` の short link 抽出が CM6 互換の実装へ置き換わっている
- [x] 構文確認が完了している
- [ ] Inkdrop v6 実機で short link のヒント表示と URL オープンが確認できている
- [ ] 周辺モードへの副作用がないことを確認できている

## 想定アウトプット

- [x] `lib/extractor.js` の v6 対応修正
- [x] short link 抽出不具合の記録
- [ ] Inkdrop v6 上での手動確認結果
- [ ] 必要に応じた追加の移行メモ

---

# vim plugin 併用時の hint 入力対応計画

## 背景

- Inkdrop Canary の vim plugin と併用すると、`hitahint:show` 後の hint 入力が vim keymap に先に処理される
- その結果、アルファベットで hint を選択できず、`Esc` で hint を閉じることもできない

## 調査メモ

- [x] `lib/hitahint.js` は `#app-container` に `keydown` を通常のバブル段階で登録している
- [x] vim plugin は CodeMirror 6 の keydown handler でキーを処理し、処理済みキーに `preventDefault()` と `stopPropagation()` を呼ぶ
- [x] そのため、エディタにフォーカスがある状態では `#app-container` のバブル段階までイベントが届かない

## 対応方針

1. 入力イベント捕捉

- [x] `hitahint:show` 中の `keydown` をキャプチャ段階で受け取る
- [x] hint 入力として処理したキーは `preventDefault()` / `stopPropagation()` で vim plugin へ渡さない
- [x] `Esc` / `Escape` は明示的に `clear()` へ割り当てる

2. 既存挙動の維持

- [x] `hintcharacters` の入力と部分一致更新の挙動を維持する
- [x] hint 確定時の `open()` と `clear()` の流れを維持する
- [x] 既存の `extractor.js` 未コミット変更を壊さない

3. 動作確認

- [x] `node --check lib/hitahint.js` で構文確認する
- [x] 可能なら `npm pack` でパッケージ内容を確認する
- [ ] Inkdrop Canary 実機では、エディタフォーカス中に hint 選択と `Esc` 解除を確認する

## 修正案

- `pane.addEventListener("keydown", ..., true)` でキャプチャ段階に変更する
- `clear()` 側も同じ capture 指定で listener を解除する
- `handleKeyDown()` の先頭で `Escape` を処理し、hint 表示中に消費するキーは `preventDefault()` と `stopPropagation()` を呼ぶ
- デバッグ用の `console.log("handleKeyDown")` は削除する

## 完了条件

- [ ] vim plugin 有効時でも hint 文字入力が hitahint 側で処理される
- [ ] vim plugin 有効時でも `Esc` で hint が消える
- [ ] 通常の hint 確定処理に副作用がない

## 確認結果

- [x] `node --check lib/hitahint.js`
- [x] `node --check lib/extractor.js`
- [x] `npm_config_cache=/tmp/hitahint-npm-cache npm pack --dry-run`
- [ ] Inkdrop Canary 実機での手動確認
