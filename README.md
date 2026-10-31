# نوتة (Nota) — Expo MVP

Local-first Arabic RTL notes app. Brand «نوتة», Android package `com.smartnotes.app`.

## Requirements

- Node 20+
- Expo Go (Android) or emulator / device
- Optional: Expo account + EAS CLI for cloud Android builds

## Run

```bash
cd /home/ubuntu/nota-expo
npm install
npx expo start
```

Then scan the QR code with Expo Go, or press `a` for Android.

## Android EAS build (optional)

```bash
npx eas-cli login
npx eas build --platform android --profile preview
```

Do not commit Expo credentials or tokens.

## MVP features

- Home grid, block editor (text / checklist / image), note colors
- expo-sqlite + FTS5 search
- Folders, tags, trash (soft delete / restore / purge)
- Theme (light / dark / system), Share sheet
- Arabic UI + forced RTL, Cairo fonts, teal mist atmosphere
