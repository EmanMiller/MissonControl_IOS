# Mission Control iOS - Testing Instructions

## Current Status
- ✅ App icons added (placeholder PNG + SVG templates)
- ❌ Build issues with React Native New Architecture (needs resolution)
- ✅ 3-tab navigation structure in place
- ✅ Redux store configured
- ✅ Phase 2 features committed to branch

## Local Setup

### Prerequisites
- Node.js (v16 or later)
- Xcode 15+ with iOS Simulator
- CocoaPods installed
- React Native CLI

### Clone Repository
```bash
git clone https://github.com/EmanMiller/MissonControl_IOS.git
cd MissonControl_IOS
```

### Install Dependencies
```bash
# Install Node dependencies
npm install

# Install iOS dependencies (requires UTF-8 encoding)
export LANG=en_US.UTF-8
cd ios && pod install && cd ..
```

### Build & Run (Current Issues)

**⚠️ Known Build Issues:**
The project currently has React Native New Architecture (Fabric) compilation errors. These need to be resolved before successful builds.

**Attempt to run:**
```bash
# Try running on iOS simulator
npm run ios

# Or specifically target iPhone 17 Pro
npx react-native run-ios --simulator="iPhone 17 Pro"
```

**Expected Behavior (once build issues are fixed):**
- App should launch in iOS Simulator
- Mission Control app icon should be visible on home screen
- App should show 3-tab navigation at bottom

## App Structure & Testing

### Tab 1: Tasks Screen
**Location:** `src/screens/main/TasksScreen.tsx`
**Expected Features:**
- List of tasks/missions
- + button to create new tasks
- Task status indicators

**Test Cases:**
- [ ] Screen loads without errors
- [ ] + button is visible and tappable
- [ ] Task list displays properly
- [ ] Navigation to CreateTaskScreen works

### Tab 2: Agents Screen  
**Location:** `src/screens/main/AgentsScreen.tsx`
**Expected Features:**
- List of AI agents
- Agent status indicators
- Agent management controls

**Test Cases:**
- [ ] Screen loads without errors
- [ ] Agent list displays
- [ ] Agent status shows correctly

### Tab 3: Profile Screen
**Location:** `src/screens/main/ProfileScreen.tsx`
**Expected Features:**
- User profile information
- Settings and preferences
- Logout functionality

**Test Cases:**
- [ ] Screen loads without errors
- [ ] Profile information displays
- [ ] Settings are accessible

## Build Issues Resolution

### Current Problems
1. **React Native New Architecture Compilation Errors**
   - C++ compilation failures in react-native-safe-area-context
   - Fabric/TurboModules related build errors
   - Multiple RCT_NEW_ARCH_ENABLED compilation issues

### Recommended Fixes
1. **Try disabling New Architecture temporarily:**
   ```bash
   # In ios/Podfile, add:
   use_frameworks! :linkage => :static
   
   # Remove or comment out New Architecture flags
   ```

2. **Update React Native version:**
   ```bash
   npm install react-native@latest
   ```

3. **Clear build cache:**
   ```bash
   cd ios && xcodebuild clean
   cd .. && npx react-native start --reset-cache
   ```

4. **Alternative: Use Metro bundler only:**
   ```bash
   npx react-native start
   # Then use Xcode directly to build MissionControlMobile.xcworkspace
   ```

## App Icon Status

### Current State
- ✅ AppIcon.appiconset structure created
- ✅ Contents.json configured with proper size mappings
- ✅ Placeholder PNG files created for all required sizes:
  - 20x20@2x (40px), 20x20@3x (60px)
  - 29x29@2x (58px), 29x29@3x (87px)  
  - 40x40@2x (80px), 40x40@3x (120px)
  - 60x60@2x (120px), 60x60@3x (180px)
  - 1024x1024@1x (App Store)
- ✅ SVG templates created for proper icon design

### Icon Improvements Needed
1. **Replace placeholder PNGs with proper Mission Control branding**
2. **Use design tools to create professional icons from SVG templates**
3. **Test icon visibility on actual device home screen**

## Directory Structure
```
MissonControl_IOS/
├── App.tsx                    # Main app component
├── src/
│   ├── navigation/           # Navigation setup
│   │   ├── AppNavigator.tsx  # Main navigation
│   │   ├── MainTabNavigator.tsx # Bottom tabs
│   │   └── AuthNavigator.tsx # Authentication flow
│   ├── screens/              # App screens
│   │   ├── main/            # Main app screens
│   │   │   ├── TasksScreen.tsx
│   │   │   ├── AgentsScreen.tsx
│   │   │   └── ProfileScreen.tsx
│   │   └── auth/            # Authentication screens
│   ├── store/               # Redux store
│   │   ├── index.ts         # Store configuration
│   │   └── slices/          # Redux slices
│   └── styles/              # Theme and styles
├── ios/                     # iOS-specific files
│   └── MissionControlMobile/
│       └── Images.xcassets/
│           └── AppIcon.appiconset/  # App icons
└── android/                 # Android files (not used)
```

## Git Workflow

### Current Branch
- `phase-2-core-features` (current working branch)
- Contains all Phase 2 development work

### Ready for Main Push
- ❌ **DO NOT PUSH YET** - Build issues must be resolved first
- Once build issues are fixed and app runs successfully:
  ```bash
  git checkout main
  git merge phase-2-core-features
  git push origin main
  ```

## Quality Checklist

### Before Push to Main
- [ ] Build completes without errors
- [ ] App launches successfully in simulator
- [ ] All 3 tabs load without crashes
- [ ] App icon visible on home screen
- [ ] Navigation between tabs works
- [ ] No console errors in Metro bundler
- [ ] No red screen errors in simulator

### Current Status
- ❌ Build errors present
- ❌ App does not launch
- ✅ App icon assets created  
- ✅ Navigation structure complete
- ✅ Redux store configured

## Next Steps

1. **PRIORITY: Fix build issues**
   - Resolve React Native New Architecture compilation errors
   - Test successful build and launch

2. **Test core functionality**
   - Verify all 3 tabs work
   - Check + button on Tasks screen
   - Validate navigation flows

3. **Improve app icon**
   - Create proper Mission Control branding
   - Replace placeholder icons

4. **Final testing**
   - Run complete quality checklist
   - Verify clean console output

5. **Push to main**
   - Only after all issues resolved
   - Create proper commit message
   - Update README if needed

## Support

If you encounter issues:
1. Check build logs for specific error messages
2. Try the build fixes in the "Build Issues Resolution" section
3. Consider temporarily disabling New Architecture
4. Use Xcode directly if React Native CLI fails
5. Ensure all dependencies are properly installed