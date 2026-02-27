import React from 'react';
import {
  CardStyleInterpolators,
  createStackNavigator,
} from '@react-navigation/stack';
import ConnectOpenClawTokenScreen from '../screens/onboarding/ConnectOpenClawTokenScreen';
import OpenClawValidatingScreen from '../screens/onboarding/OpenClawValidatingScreen';
import OpenClawConnectionResultScreen from '../screens/onboarding/OpenClawConnectionResultScreen';
import { withScreenBoundary } from '../components/withScreenBoundary';

export type OpenClawSetupStackParamList = {
  ConnectToken: undefined;
  Validating: { token: string };
  Result: { success: boolean; message: string; token: string };
};

const Stack = createStackNavigator<OpenClawSetupStackParamList>();
const ConnectWithBoundary = withScreenBoundary(ConnectOpenClawTokenScreen);
const ValidatingWithBoundary = withScreenBoundary(OpenClawValidatingScreen);
const ResultWithBoundary = withScreenBoundary(OpenClawConnectionResultScreen);

const OpenClawSetupNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}
    >
      <Stack.Screen name="ConnectToken" component={ConnectWithBoundary} />
      <Stack.Screen name="Validating" component={ValidatingWithBoundary} />
      <Stack.Screen name="Result" component={ResultWithBoundary} />
    </Stack.Navigator>
  );
};

export default OpenClawSetupNavigator;
