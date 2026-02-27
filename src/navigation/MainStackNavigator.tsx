import React, { useEffect } from 'react';
import {
  CardStyleInterpolators,
  createStackNavigator,
} from '@react-navigation/stack';
import MainTabNavigator from './MainTabNavigator';
import CreateTaskScreen from '../screens/main/CreateTaskScreen';
import socketService from '../services/socket';
import { colors } from '../styles/theme';
import { withScreenBoundary } from '../components/withScreenBoundary';

export type MainStackParamList = {
  MainTabs: undefined;
  CreateTask: undefined;
};

const Stack = createStackNavigator<MainStackParamList>();
const MainTabsWithBoundary = withScreenBoundary(MainTabNavigator);
const CreateTaskWithBoundary = withScreenBoundary(CreateTaskScreen);

const MainStackNavigator: React.FC = () => {
  useEffect(() => {
    socketService.connect();
  }, []);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}>
      <Stack.Screen
        name="MainTabs"
        component={MainTabsWithBoundary}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateTask"
        component={CreateTaskWithBoundary}
        options={{
          headerShown: false,
          presentation: 'modal',
          cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
        }}
      />
    </Stack.Navigator>
  );
};

export default MainStackNavigator;
