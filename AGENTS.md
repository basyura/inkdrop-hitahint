# Repository Guidelines

## Plan

- 修正を始める前に計画をマークダウンファイルで .plans フォルダ配下に日本語で生成してください。
- 計画のファイル名は連番とし、1つ目を 001 始まりとして修正にあった適切なファイル名としてください。
- 計画ファイルでは対応状況が分かるようにチェックボックス形式を使用してください。
- 具体的なファイル編集をする前に、修正案を提示すること。
- 指示があるまで新しい計画ファイルを作成せず、現在の計画に反映すること。
- API に関しては https://github.com/inkdropapp/api-docs/ サイトを確認すること。特に、inkdrop v5 から v6 への plugin アップデートに関しては https://github.com/inkdropapp/api-docs/blob/main/src/app/appendix/plugin-migration-from-v5-to-v6/page.mdx を参照すること。

## Project Structure & Module Organization

This repository is a small Inkdrop plugin. The package entry point is `lib/hitahint.js`, which activates the command, renders hints, and handles keyboard input. DOM target collection lives in `lib/extractor.js`, and reactive config access lives in `lib/settings.js`. The editor integration targets CodeMirror 6, so editor-facing changes should follow CM6 DOM and API behavior. Static assets are kept in `images/`, keyboard mappings in `keymaps/`, and styles in `styles/`. Use `README.md` for user-facing behavior and installation notes.

## Build, Test, and Development Commands

There is no build step or automated test script defined in `package.json` at the moment. Use these commands during development:

- `npm install`: install local metadata dependencies and keep `package-lock.json` in sync.
- `npm pack`: create a distributable package to verify published contents.
- `ipm install`: install the plugin into Inkdrop locally.
- `ipm link` or Inkdrop developer loading: use while iterating on the plugin in a local Inkdrop environment.

When you add scripts, expose them through `package.json` so contributors have a single entry point.

## Coding Style & Naming Conventions

Follow the existing JavaScript style and `.prettierrc`: 2-space indentation, semicolons, double quotes, trailing commas in ES5-compatible places, and `printWidth: 100`. Keep module filenames lowercase, matching the current pattern such as `lib/extractor.js`. Prefer small classes with focused responsibilities and keep Inkdrop-specific DOM selectors close to the logic that uses them.

## Testing Guidelines

This repository currently has no automated tests. Validate changes manually inside Inkdrop, covering preview mode, editor mode, sidebar navigation, note list navigation, and configurable `hintcharacters`. If you add tests, place them under `test/` or `spec/` and mirror the source filename, for example `spec/extractor.spec.js`.

## Commit & Pull Request Guidelines

Recent commits use short, imperative subjects such as `Prepare v0.8.0 release` and `improved readme`. Keep commit titles concise, describe one logical change per commit, and avoid mixing refactors with behavior changes. Pull requests should include a brief summary, manual verification steps, linked issues when applicable, and screenshots or GIFs for any UI-visible change in Inkdrop.

## Inkdrop Plugin Notes

Target compatibility is declared in `package.json` under `engines.inkdrop` and should be updated deliberately. This plugin assumes CodeMirror 6 in editor mode, so changes around `.cm-url`, marks, or editor selection logic should be validated against the current CM6-based Inkdrop UI before releasing.
