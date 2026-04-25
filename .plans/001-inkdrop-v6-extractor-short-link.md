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

---

# preview mode スクロール後の hint 表示対応計画

## 背景

- preview mode でノート先頭を表示している場合は表示範囲内リンクの hint が表示される
- preview mode でスクロール後に表示されるリンクの hint が表示されない
- 表示位置の問題か、対象抽出の問題かを切り分ける必要がある

## 調査メモ

- [x] preview mode のリンク抽出は `lib/extractor.js` の `#extractFromPreview()` から `#extractTargets()` を通っている
- [x] 現在の可視判定は `.mde-preview` の `getBoundingClientRect().y` と `pane.clientHeight` を基準にしている
- [x] preview のスクロール位置によって `.mde-preview` の矩形が移動する DOM 構造では、実際に viewport 内へ表示されたリンクでも下端判定から漏れる可能性が高い
- [x] hint の配置は `#app-container` 基準の絶対配置で、preview 側のスクロールとは別基準になっている
- [x] 初回修正では `.mde-preview` の矩形を可視範囲に含めていたため、preview の実スクロール親とずれて画面上部のリンクだけが抽出されるケースが残った

## 対応方針

1. 表示対象の判定

- [x] 対象要素の `getBoundingClientRect()` を viewport と交差判定する
- [x] pane 自体の表示矩形とも交差させ、pane の表示範囲外にある要素は除外する
- [x] 表示範囲外の hint 用 `span` は生成しない

2. hint 配置

- [x] hint overlay を viewport 基準の配置へ寄せる
- [x] 対象要素が表示範囲外、または座標が取れない場合は `createHint()` で `null` を返す
- [x] `#app-container` の `scrollTop` に依存しない配置にする

3. 周辺不具合の補正

- [x] `.link-compact-mark` に変更済みの short link 抽出に合わせて open 判定も更新する
- [x] `ele.title = "Back"` の代入を比較に修正する

## 修正案

- `lib/extractor.js`
  - `#extractTargets()` の可視判定を `paneRect.y + pane.clientHeight` から、viewport と overflow で表示を切る祖先要素の交差判定へ変更する
  - 要素矩形が `width` / `height` を持たない場合は除外する

- `lib/hitahint.js`
  - `.hitahint` コンテナを viewport 基準で配置する前提に合わせ、hint 座標を `rect.top` / `rect.left` から算出する
  - 表示範囲外の要素は `createHint()` で `null` を返して span を生成しない
  - 画面端にかかる表示範囲内要素の hint は viewport 内へ丸めて表示する
  - short link の class 判定を `.link-compact-mark` と `.short-link-mark` の両方に対応させる
  - Back 判定の代入を比較へ修正する

## 完了条件

- [ ] preview mode でスクロール後に表示範囲内のリンク hint が生成される
- [x] 表示範囲外のリンク hint は生成されない
- [ ] editor mode / note list / sidebar の hint 表示に明らかな副作用がない
- [x] 構文確認が通る

## 確認結果

- [x] `node --check lib/extractor.js`
- [x] `node --check lib/hitahint.js`
- [x] `npm_config_cache=/tmp/hitahint-npm-cache npm pack --dry-run`
- [ ] Inkdrop 実機で preview mode スクロール後の hint 表示を確認する

# npm 配布ファイル整理計画

## 背景

- `.npmignore` がないため、`npm pack` は `.gitignore` を fallback として使っている
- 現在の `.gitignore` は最小限で、開発用の `.plans/`、`.serena/`、`AGENTS.md` が tarball に含まれる
- これらは Inkdrop plugin の実行や利用者向け配布には不要

## 対応方針

- [x] `.npmignore` を追加する
- [x] `.plans/`、`.serena/`、`AGENTS.md` を配布対象から除外する
- [x] `.DS_Store`、`npm-debug.log`、`node_modules/` も明示的に除外する
- [x] `npm pack --dry-run` で除外結果を確認する

## 完了条件

- [x] `npm pack --dry-run` の tarball contents に `.plans/`、`.serena/`、`AGENTS.md` が表示されない
- [x] plugin 実行に必要な `lib/`、`styles/`、`keymaps/`、`images/`、`README.md`、`LICENSE.md`、`CHANGELOG.md`、`package.json` は引き続き含まれる

## 確認結果

- [x] `npm_config_cache=/tmp/hitahint-npm-cache npm pack --dry-run`
- [x] tarball contents は 11 files になり、`.plans/`、`.serena/`、`AGENTS.md` は含まれない
