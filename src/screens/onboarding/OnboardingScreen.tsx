import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { saveItem, getItem } from '../../services/storage/asyncStorage';
import { storageKeys } from '../../constants/storageKeys';
import type { User } from '../../types/user';
import { nanoid } from 'nanoid/non-secure';
import { isNonEmptyString, parsePositiveNumber } from '../../utils/validation';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase/client';
import { upsertCurrentUserName } from '../../services/supabase/users';

type FormData = {
  name: string;
  dailyGoalHours: string;
};

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const { control, handleSubmit } = useForm<FormData>({
    defaultValues: { name: '', dailyGoalHours: '' },
  });

  const onSubmit = async (data: FormData) => {
    const trimmedName = (data.name || '').trim();
    const hoursNum = parsePositiveNumber(data.dailyGoalHours);
    if (!isNonEmptyString(trimmedName)) {
      Alert.alert('Validation', 'Please enter your name.');
      return;
    }
    if (hoursNum == null) {
      Alert.alert('Validation', 'Please enter a daily goal in hours (> 0).');
      return;
    }
    const minutes = Math.round(hoursNum * 60);

    try {
      let id: string | null = null;
      if (supabase) {
        const { data: auth } = await supabase.auth.getUser();
        id = auth.user?.id ?? null;
        try {
          await upsertCurrentUserName(trimmedName);
        } catch {}
      }
      // Keep local preferences for daily goal; sync id if available
      const user: User = { id: id ?? nanoid(), name: trimmedName, dailyGoalMinutes: minutes };
      await saveItem(storageKeys.user, JSON.stringify(user));
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Welcome to Goalstake</Text>
        <Text style={styles.subtitle}>Set up your profile to get started.</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Name</Text>
          <Controller
            control={control}
            name="name"
            rules={{ required: true }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                autoCapitalize="words"
                returnKeyType="done"
              />
            )}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Daily goal (hours)</Text>
          <Controller
            control={control}
            name="dailyGoalHours"
            rules={{ required: true, validate: (v) => Number(v) > 0 }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="e.g. 2"
                keyboardType="decimal-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                returnKeyType="done"
              />
            )}
          />
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={handleSubmit(onSubmit)}>
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  subtitle: { color: colors.mutedText, marginBottom: spacing.xl },
  fieldGroup: { marginBottom: spacing.lg },
  label: { marginBottom: spacing.sm, color: colors.mutedText },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: colors.background,
  },
  continueButton: { marginTop: spacing.xl, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  continueText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});


