import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import AuthNavigator from './AuthNavigator';
import MainStackNavigator from './MainStackNavigator';
import OpenClawSetupNavigator from './OpenClawSetupNavigator';
import IntroWalkthroughScreen from '../screens/onboarding/IntroWalkthroughScreen';
import { darkTheme } from '../styles/theme';
import { withScreenBoundary } from '../components/withScreenBoundary';

export type RootStackParamList = {
  Intro: undefined;
  Auth: undefined;
  OpenClawSetup: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const IntroWithBoundary = withScreenBoundary(IntroWalkthroughScreen);
const AuthWithBoundary = withScreenBoundary(AuthNavigator);
const OpenClawSetupWithBoundary = withScreenBoundary(OpenClawSetupNavigator);
const MainWithBoundary = withScreenBoundary(MainStackNavigator);

const AppNavigator: React.FC = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth?.isAuthenticated ?? false);
  const hasSeenIntro = useSelector((state: RootState) => state.app?.hasSeenIntro ?? false);
  const hasCompletedOpenClawSetup = useSelector(
    (state: RootState) => state.app?.hasCompletedOpenClawSetup ?? false
  );

  return (
    <NavigationContainer theme={darkTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}>
        {!hasSeenIntro ? (
          <Stack.Screen name="Intro" component={IntroWithBoundary} />
        ) : !isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthWithBoundary} />
        ) : !hasCompletedOpenClawSetup ? (
          <Stack.Screen name="OpenClawSetup" component={OpenClawSetupWithBoundary} />
        ) : (
          <Stack.Screen name="Main" component={MainWithBoundary} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
