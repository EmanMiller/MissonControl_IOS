import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MainTabNavigator from './MainTabNavigator';
import CreateTaskScreen from '../screens/main/CreateTaskScreen';
import socketService from '../services/socket';
import { requestNotificationPermissions } from '../services/notificationsLocal';
import { colors } from '../styles/theme';

export type MainStackParamList = {
  MainTabs: undefined;
  CreateTask: undefined;
};

const Stack = createStackNavigator<MainStackParamList>();

const MainStackNavigator: React.FC = () => {
  useEffect(() => {
    requestNotificationPermissions();
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
      }}>
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateTask"
        component={CreateTaskScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

export default MainStackNavigator;
