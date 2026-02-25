# AGENTS.md

## Cursor Cloud specific instructions

### Overview

MissionControlMobile is a React Native 0.84.0 mobile app (TypeScript) for managing AI agents and tasks. It uses Redux Toolkit for state, React Navigation for routing, and currently operates with local mock data (no backend).

### Standard commands

See `package.json` scripts for lint (`npm run lint`), test (`npm test`), Metro (`npm start`), and Android/iOS build commands.

### Non-obvious caveats

- **Node.js >= 22.11.0 required** — enforced by `engines` in `package.json`.
- **Android SDK setup** — `ANDROID_HOME` must be set to `/opt/android-sdk` (or wherever the SDK is installed). Required packages: `platforms;android-36`, `build-tools;36.0.0`, `ndk;27.1.12297006`, `platform-tools`. The environment vars are persisted in `~/.bashrc`.
- **Gradle 9.0.0 incompatibility** — The `gradle-wrapper.properties` specifies Gradle 9.0.0, which has a known incompatibility with the React Native Gradle plugin (`JvmVendorSpec.IBM_SEMERU` removed). The Android native build (`./gradlew assembleDebug`) will fail until this is resolved upstream. Metro bundling works fine independently.
- **Jest test failure** — The default test (`__tests__/App.test.tsx`) fails due to missing `transformIgnorePatterns` in `jest.config.js` for ESM modules (`react-redux`). This is a pre-existing configuration gap.
- **ESLint pre-existing errors** — `npm run lint` reports 2 errors and 1 warning in existing code (`@typescript-eslint/no-unused-vars` in AgentsScreen/TasksScreen, `react/no-unstable-nested-components` in ProfileScreen).
- **Metro is the primary dev tool** — Use `npm start` (or `npx react-native start`) to run the Metro bundler on port 8081. Verify with `curl http://localhost:8081/status` (should return `packager-status:running`). The full JS bundle compiles successfully via Metro.
- **TypeScript** — `npx tsc --noEmit` passes cleanly.
- **No backend services required** — The app uses local Redux state with mock data. No databases, APIs, or Docker containers needed.
