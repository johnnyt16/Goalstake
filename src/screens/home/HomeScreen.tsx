import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { saveItem, getItem } from '../../services/storage/asyncStorage';
import { storageKeys } from '../../constants/storageKeys';
import type { User } from '../../types/user';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { nanoid } from 'nanoid/non-secure';

type FormData = {
  name: string;
  dailyGoalHours: string; // keep as string for input; convert to minutes on save
};

export default function HomeScreen() {
  const { control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: { name: '', dailyGoalHours: '' },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const existing = await getItem(storageKeys.user);
        if (existing) {
          const user: User = JSON.parse(existing);
          setValue('name', user.name ?? '');
          const hours = user.dailyGoalMinutes ? String(Math.max(0, user.dailyGoalMinutes) / 60) : '';
          setValue('dailyGoalHours', hours);
        }
      } catch {}
      setLoading(false);
    })();
  }, [setValue]);

  const onSubmit = async (data: FormData) => {
    const trimmedName = (data.name || '').trim();
    const hoursNum = Number(data.dailyGoalHours);
    if (!trimmedName) {
      Alert.alert('Validation', 'Please enter your name.');
      return;
    }
    if (!Number.isFinite(hoursNum) || hoursNum <= 0) {
      Alert.alert('Validation', 'Please enter a daily goal in hours (> 0).');
      return;
    }
    const minutes = Math.round(hoursNum * 60);

    try {
      // Try to preserve existing id if present
      let id = nanoid();
      const existing = await getItem(storageKeys.user);
      if (existing) {
        const parsed: Partial<User> = JSON.parse(existing);
        if (parsed.id) id = parsed.id;
      }

      const user: User = {
        id,
        name: trimmedName,
        dailyGoalMinutes: minutes,
      };

      await saveItem(storageKeys.user, JSON.stringify(user));
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
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Your Settings</Text>

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

        <TouchableOpacity style={styles.saveButton} onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
          <Text style={styles.saveButtonText}>{isSubmitting ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
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

