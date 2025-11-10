import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { saveItem, getItem } from '../../services/storage/asyncStorage';
import { storageKeys } from '../../constants/storageKeys';
import type { User } from '../../types/user';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { nanoid } from 'nanoid/non-secure';
import { isNonEmptyString, parsePositiveNumber } from '../../utils/validation';
import { useUserStore } from '../../store/userStore';
import Card from '../../components/common/Card';
import PrimaryButton from '../../components/common/PrimaryButton';
import { supabase } from '../../services/supabase/client';
import { getCurrentProfile, upsertCurrentUserName } from '../../services/supabase/users';

type FormData = {
  name: string;
  dailyGoalHours: string; // keep as string for input; convert to minutes on save
};

export default function HomeScreen() {
  const { control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: { name: '', dailyGoalHours: '' },
  });
  const [loading, setLoading] = useState(true);
  const setUserStore = useUserStore((s) => s.setUser);

  useEffect(() => {
    (async () => {
      try {
        // Prefer Supabase profile for name if available
        let nameFromProfile: string | undefined;
        if (supabase) {
          const profile = await getCurrentProfile();
          if (profile?.name) nameFromProfile = profile.name;
        }
        const existing = await getItem(storageKeys.user);
        if (existing) {
          const user: User = JSON.parse(existing);
          setValue('name', nameFromProfile ?? user.name ?? '');
          const hours = user.dailyGoalMinutes ? String(Math.max(0, user.dailyGoalMinutes) / 60) : '';
          setValue('dailyGoalHours', hours);
          setUserStore(user);
        } else {
          setValue('name', nameFromProfile ?? '');
        }
      } catch {}
      setLoading(false);
    })();
  }, [setValue, setUserStore]);

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
      // Try to use Supabase auth id if present
      let id: string | null = null;
      if (supabase) {
        const { data: auth } = await supabase.auth.getUser();
        id = auth.user?.id ?? null;
        try {
          await upsertCurrentUserName(trimmedName);
        } catch {}
      }
      // Preserve existing local id if present
      const existing = await getItem(storageKeys.user);
      if (!id && existing) {
        const parsed: Partial<User> = JSON.parse(existing);
        if (parsed.id) id = parsed.id;
      }
      if (!id) id = nanoid();

      const user: User = {
        id,
        name: trimmedName,
        dailyGoalMinutes: minutes,
      };

      await saveItem(storageKeys.user, JSON.stringify(user));
      setUserStore(user);
      Alert.alert('Saved', 'Your settings have been saved.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Your Settings</Text>
          <Card>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Name</Text>
              <Controller
                control={control}
                name="name"
                rules={{ required: true }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder="Enter your name"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="words"
                    returnKeyType="done"
                  />
                )}
              />
              {errors.name ? <Text style={styles.errorText}>Name is required</Text> : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Daily goal (hours)</Text>
              <Controller
                control={control}
                name="dailyGoalHours"
                rules={{ required: true, validate: (v) => Number(v) > 0 }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.dailyGoalHours && styles.inputError]}
                    placeholder="e.g. 2"
                    keyboardType="decimal-pad"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    returnKeyType="done"
                  />
                )}
              />
              {errors.dailyGoalHours ? <Text style={styles.errorText}>Enter hours greater than 0</Text> : null}
            </View>

            <PrimaryButton title={isSubmitting ? 'Saving…' : 'Save'} onPress={handleSubmit(onSubmit)} disabled={isSubmitting} />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: { color: colors.mutedText },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xl,
  },
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
  inputError: { borderColor: colors.error },
  errorText: { marginTop: 6, color: colors.error },
  saveButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

