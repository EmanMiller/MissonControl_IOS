# AGENTS.md

## Cursor Cloud specific instructions

### Overview

MissionControlMobile is a React Native 0.84.0 mobile app (TypeScript) for managing AI agents and tasks. It uses Redux Toolkit for state, React Navigation for routing, and currently operates with local mock data (no backend).

### Standard commands

See `package.json` scripts for lint (`npm run lint`), test (`npm test`), Metro (`npm start`), and Android/iOS build commands.

### Non-obvious caveats

- **Node.js >= 22.11.0 required** — enforced by `engines` in `package.json`.
- **Android SDK setup** — `ANDROID_HOME` must be set to `/opt/android-sdk` (or wherever the SDK is installed). Required packages: `platforms;android-36`, `build-tools;36.0.0`, `ndk;27.1.12297006`, `platform-tools`. The environment vars are persisted in `~/.bashrc`.
- **Gradle version** — Uses Gradle 8.13 (not 9.0) because the foojay-resolver-convention 0.5.0 plugin bundled with `@react-native/gradle-plugin` references `JvmVendorSpec.IBM_SEMERU` which was removed in Gradle 9.0.
- **Async-storage local Maven repo** — The `@react-native-async-storage/async-storage` package ships a local Maven repo at `android/local_repo/` containing the `org.asyncstorage.shared_storage:storage-android:1.0.0` artifact. The root `android/build.gradle` has an `allprojects.repositories` block referencing this path; without it the Android build fails.
- **Metro is the primary dev tool** — Use `npm start` to run the Metro bundler on port 8081. Verify with `curl http://localhost:8081/status` (should return `packager-status:running`).
- **No backend services required** — The app uses local Redux state with mock data. No databases, APIs, or Docker containers needed.
