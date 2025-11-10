import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthScreen from '../screens/auth/AuthScreen';

export type AuthParamList = {
  Auth: undefined;
};

const Stack = createNativeStackNavigator<AuthParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Auth" component={AuthScreen} options={{ title: 'Sign in' }} />
    </Stack.Navigator>
  );
}


