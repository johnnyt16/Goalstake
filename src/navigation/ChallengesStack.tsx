import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChallengesScreen from '../screens/challenges/ChallengesScreen';
import ChallengeDetailScreen from '../screens/challenges/ChallengeDetailScreen';
import GroupSettingsScreen from '../screens/group/GroupSettingsScreen';

export type ChallengesParamList = {
  Challenges: undefined;
  ChallengeDetail: { challengeId: string };
  GroupSettings: undefined;
};

const Stack = createNativeStackNavigator<ChallengesParamList>();

export default function ChallengesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Challenges" component={ChallengesScreen} options={{ title: 'Challenges' }} />
      <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} options={{ title: 'Details' }} />
      <Stack.Screen name="GroupSettings" component={GroupSettingsScreen} options={{ title: 'Group Settings' }} />
    </Stack.Navigator>
  );
}


