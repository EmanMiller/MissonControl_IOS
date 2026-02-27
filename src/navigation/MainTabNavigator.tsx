import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import TasksScreen from '../screens/main/TasksScreen';
import AgentsScreen from '../screens/main/AgentsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import { colors } from '../styles/theme';
import { RootState } from '../store';

export type MainTabParamList = {
  Tasks: undefined;
  Agents: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconRendererProps = {
  color: string;
  size: number;
  focused: boolean;
};

const createTabIconRenderer = (focusedName: string, unfocusedName: string) => {
  return ({ color, size, focused }: TabIconRendererProps) => (
    <Icon
      name={focused ? focusedName : unfocusedName}
      size={size}
      color={color}
    />
  );
};

const tasksTabIcon = createTabIconRenderer('checkbox', 'checkbox-outline');
const agentsTabIcon = createTabIconRenderer('people', 'people-outline');
const profileTabIcon = createTabIconRenderer('person-circle', 'person-circle-outline');

const MainTabNavigator: React.FC = () => {
  const newCompletedCount = useSelector((state: RootState) => state.tasks?.newCompletedCount ?? 0);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarLabel: 'Tasks',
          tabBarBadge: newCompletedCount > 0 ? newCompletedCount : undefined,
          tabBarIcon: tasksTabIcon,
        }}
      />
      <Tab.Screen
        name="Agents"
        component={AgentsScreen}
        options={{
          tabBarLabel: 'Agents',
          tabBarIcon: agentsTabIcon,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: profileTabIcon,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
