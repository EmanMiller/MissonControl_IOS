import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';
import MainTabNavigator from './MainTabNavigator';
import CreateTaskScreen from '../screens/main/CreateTaskScreen';
import { fetchTasks } from '../store/thunks/taskThunks';
import { fetchAgents } from '../store/thunks/agentThunks';
import socketService from '../services/socket';
import { AppDispatch } from '../store';
import { colors } from '../styles/theme';

export type MainStackParamList = {
  MainTabs: undefined;
  CreateTask: undefined;
};

const Stack = createStackNavigator<MainStackParamList>();

const MainStackNavigator: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    socketService.connect();
    dispatch(fetchTasks());
    dispatch(fetchAgents());
  }, [dispatch]);

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