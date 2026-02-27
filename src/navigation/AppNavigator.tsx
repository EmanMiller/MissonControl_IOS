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

export type RootStackParamList = {
  Intro: undefined;
  Auth: undefined;
  OpenClawSetup: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

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
          <Stack.Screen name="Intro" component={IntroWalkthroughScreen} />
        ) : !isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : !hasCompletedOpenClawSetup ? (
          <Stack.Screen name="OpenClawSetup" component={OpenClawSetupNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainStackNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
