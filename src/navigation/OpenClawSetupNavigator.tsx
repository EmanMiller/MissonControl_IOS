import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ConnectOpenClawTokenScreen from '../screens/onboarding/ConnectOpenClawTokenScreen';
import OpenClawValidatingScreen from '../screens/onboarding/OpenClawValidatingScreen';
import OpenClawConnectionResultScreen from '../screens/onboarding/OpenClawConnectionResultScreen';

export type OpenClawSetupStackParamList = {
  ConnectToken: undefined;
  Validating: { token: string };
  Result: { success: boolean; message: string; token: string };
};

const Stack = createStackNavigator<OpenClawSetupStackParamList>();

const OpenClawSetupNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ConnectToken" component={ConnectOpenClawTokenScreen} />
      <Stack.Screen name="Validating" component={OpenClawValidatingScreen} />
      <Stack.Screen name="Result" component={OpenClawConnectionResultScreen} />
    </Stack.Navigator>
  );
};

export default OpenClawSetupNavigator;
