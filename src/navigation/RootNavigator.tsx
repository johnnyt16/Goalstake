import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { enableScreens } from 'react-native-screens';
import MainTabs from './MainTabs';

enableScreens(true);

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}


