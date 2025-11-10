import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { enableScreens } from 'react-native-screens';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import OnboardingStack from './OnboardingStack';
import { getItem } from '../services/storage/asyncStorage';
import { storageKeys } from '../constants/storageKeys';
import { View, Text } from 'react-native';
import { colors } from '../theme/colors';
import AuthStack from './AuthStack';
import { supabase } from '../services/supabase/client';
import { getCurrentProfile } from '../services/supabase/users';

enableScreens(true);

type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          setHasSession(Boolean(data.session));
          const sub = supabase.auth.onAuthStateChange((_event, session) => {
            setHasSession(Boolean(session));
            // refresh profile gate on auth change
            (async () => {
              try {
                if (session) {
                  const profile = await getCurrentProfile();
                  setHasProfile(Boolean(profile?.name));
                } else {
                  setHasProfile(false);
                }
              } catch {
                setHasProfile(false);
              }
            })();
          });
          unsub = () => sub.data.subscription.unsubscribe();
        } else {
          setHasSession(true); // allow navigation without Supabase in dev
        }
      } catch {
        setHasSession(false);
      }
      try {
        if (supabase) {
          const profile = await getCurrentProfile();
          setHasProfile(Boolean(profile?.name));
        } else {
          // fallback to local storage (legacy)
          const existing = await getItem(storageKeys.user);
          setHasProfile(Boolean(existing));
        }
      } catch {
        setHasProfile(false);
      }
    })();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  if (hasSession === null || hasProfile === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.mutedText }}>Loading…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={hasSession ? (hasProfile ? 'Main' : 'Onboarding') : 'Auth'}>
        <Stack.Screen name="Auth" component={AuthStack} />
        <Stack.Screen name="Onboarding" component={OnboardingStack} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


