import React from 'react';
import {
  CardStyleInterpolators,
  createStackNavigator,
} from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen';
import CreateAccountScreen from '../screens/auth/CreateAccountScreen';
import { withScreenBoundary } from '../components/withScreenBoundary';

export type AuthStackParamList = {
  Login: undefined;
  CreateAccount: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();
const LoginScreenWithBoundary = withScreenBoundary(LoginScreen);
const CreateAccountScreenWithBoundary = withScreenBoundary(CreateAccountScreen);

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}>
      <Stack.Screen name="Login" component={LoginScreenWithBoundary} />
      <Stack.Screen name="CreateAccount" component={CreateAccountScreenWithBoundary} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
