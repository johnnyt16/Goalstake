import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/home/HomeScreen';
import GroupScreen from '../screens/group/GroupScreen';
import ProgressScreen from '../screens/progress/ProgressScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import WeeklySummaryScreen from '../screens/summary/WeeklySummaryScreen';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../theme/colors';
import ChallengesStack from './ChallengesStack';

type TabParamList = {
  Home: undefined;
  Group: undefined;
  Progress: undefined;
  Profile: undefined;
  Summary: undefined;
  Challenges: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: {
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          paddingTop: 4,
        },
        tabBarIcon: ({ color, size }) => {
          let name: keyof typeof Ionicons.glyphMap = 'home-outline';
          if (route.name === 'Home') name = 'home-outline';
          if (route.name === 'Group') name = 'people-outline';
          if (route.name === 'Progress') name = 'speedometer-outline';
          if (route.name === 'Summary') name = 'stats-chart-outline';
          if (route.name === 'Profile') name = 'person-outline';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Challenges" component={ChallengesStack} options={{ tabBarLabel: 'Challenges' }} />
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Group" component={GroupScreen} options={{ tabBarLabel: 'Group' }} />
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ tabBarLabel: 'Progress' }} />
      <Tab.Screen name="Summary" component={WeeklySummaryScreen} options={{ tabBarLabel: 'Summary' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}


