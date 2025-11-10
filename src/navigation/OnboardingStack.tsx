import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import GroupSetupScreen from '../screens/onboarding/GroupSetupScreen';

type OnboardingParamList = {
  Welcome: undefined;
  GroupSetup: undefined;
};

const Stack = createNativeStackNavigator<OnboardingParamList>();

export default function OnboardingStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Welcome" component={OnboardingScreen} options={{ title: 'Welcome' }} />
      <Stack.Screen name="GroupSetup" component={GroupSetupScreen} options={{ title: 'Group' }} />
    </Stack.Navigator>
  );
}


