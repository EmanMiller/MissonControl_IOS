# MissionControlMobile

MissionControlMobile is a React Native 0.84.0 (TypeScript) app for managing AI agents and tasks.

## What Changed

This update focused on reliability, local development flow, and noisy runtime warnings.

- Added centralized network configuration for API/socket endpoints.
- Added robust API connectivity checks with clearer connection/auth states.
- Added local fallback data mode for tasks/agents when API is offline, missing, or unauthorized.
- Reduced repeated network/websocket error spam in runtime logs.
- Removed duplicate startup fetch calls that were causing extra request noise.
- Replaced deprecated `SafeAreaView` imports in screens with `react-native-safe-area-context`.
- Improved connection status UI to show whether app is using OpenClaw API or local fallback mode.

## Endpoint Configuration

Network settings are in:

- `src/config/network.ts`

Default values are generic and safe to commit:

- `OPENCLAW_ORIGIN_RAW = "http://localhost:3001/"`
- `API_PREFIX_RAW = "/api"`

If your OpenClaw host/path differs, update those values locally.

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
