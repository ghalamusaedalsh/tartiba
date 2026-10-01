# ترتيبة · Tartiba

A planner and notes app for Windows, built with [Tauri 2](https://v2.tauri.app) and React.
تطبيق للتخطيط والملاحظات على ويندوز.

**Status:** early starter. Right now Tartiba has a working notes screen: create, edit, search and delete notes, with an Arabic/English switch that flips the whole layout between right-to-left and left-to-right. Notes are saved automatically on your computer.

## One-time setup on Windows

Install these once:

1. **Node.js (LTS)** — https://nodejs.org
2. **Rust** — https://rustup.rs (run `rustup-init.exe`, accept the defaults)
3. **Microsoft C++ Build Tools** — https://visualstudio.microsoft.com/visual-cpp-build-tools/ — tick **“Desktop development with C++”**
4. **WebView2** — already included in Windows 10 and 11.

Then, in this folder:

```powershell
npm install
```

## Run the app

```powershell
npm run app
```

The first run takes several minutes while Rust compiles everything; after that it starts in seconds. Changes to files in `src/` show up instantly in the open window.

## Build an installer

```powershell
npm run app:build
```

The installers land in `src-tauri/target/release/bundle/` (`nsis/…-setup.exe` and `msi/…msi`).

## Microsoft Store

When you're ready to publish:

```powershell
npm run store:build
```

This builds the NSIS `-setup.exe` with WebView2 bundled inside it, which the Store requires (settings in `src-tauri/tauri.microsoftstore.conf.json`). In Partner Center, submit it as an EXE app and set the silent-install switch to `/S`.

Before the first submission, check that `publisher` in `src-tauri/tauri.conf.json` matches the publisher name on your Partner Center account. The publisher name can't be the same as the product name.

## Project layout

```
src/                 the app's screens (React + TypeScript)
  App.tsx            notes list + editor
  i18n.ts            Arabic and English text
  notes.ts           saving and loading notes
src-tauri/           the Windows app shell (Rust)
  tauri.conf.json    window size, app name, installer settings
  icons/             app icons (placeholders for now)
```

To replace the placeholder icon, put a 1024×1024 PNG in the project folder and run:

```powershell
npx tauri icon your-icon.png
```
