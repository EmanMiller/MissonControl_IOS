# MissionControlMobile

MissionControlMobile is a React Native 0.84.0 (TypeScript) app for managing AI agents and tasks.

## Current Highlights

- Intro walkthrough shown once on first launch.
- Auth supports email/password, Google OAuth, GitHub OAuth, remember-me, and biometric unlock for returning users.
- OpenClaw token connection onboarding flow (test, validating, success/failure with retry).
- Token storage uses iOS Keychain via native module (not AsyncStorage).
- Offline-aware tasks experience with pull-to-refresh, filters, swipe actions, status pills, and fallback cache mode.
- Global error boundary and inactivity auto-logout.

## Endpoint Configuration

Network and OAuth settings come from `.env` and are generated into `src/config/env.generated.ts`.

Use `.env` (local only, ignored by git):

```sh
GOOGLE_CLIENT_ID=your-google-client-id
GITHUB_CLIENT_ID=your-github-client-id
OPENCLAW_ORIGIN=http://localhost:3001
OAUTH_BACKEND_ORIGIN=http://localhost:3001
```

Then run:

```sh
npm run gen:env
```

## OAuth Setup

OAuth runtime config is in `src/config/oauth.ts` and generated values come from `.env`.

Default OAuth backend routes expected by the app:

- Preferred:
  - `/auth/oauth/google/start`
  - `/auth/oauth/github/start`
  - `/auth/oauth/mobile/exchange`
- Also supported automatically (fallback):
  - `/api/auth/oauth/google/start`
  - `/api/auth/oauth/github/start`
  - `/api/auth/oauth/mobile/exchange`

OAuth callback URI used by the app:

- `missioncontrolmobile://auth/callback`

Mobile deep-link plumbing is already configured in:

- iOS: `ios/MissionControlMobile/Info.plist`
- Android: `android/app/src/main/AndroidManifest.xml`

Important: keep OAuth client secrets on your backend only (OpenClaw/auth server). Do not store provider secrets in this mobile repo.

## Prerequisites

- Node.js `>= 22.11.0`
- Ruby/Bundler for iOS pods
- Xcode (for iOS builds)
- Android SDK (for Android builds)

## Install

```sh
npm install
bundle install
```

## Run (iOS)

```sh
npm start
bundle exec pod install
npm run ios
```

## Run (Android)

```sh
npm start
npm run android
```

## Quality Checks

```sh
npm run lint
npm test -- --watch=false
```
