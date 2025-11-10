import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getItem, saveItem } from '../../services/storage/asyncStorage';
import { storageKeys } from '../../constants/storageKeys';
import type { User } from '../../types/user';
import type { UsageEntry } from '../../types/usage';
import { formatISO, startOfDay, isSameDay, subDays } from 'date-fns';
import { parseNonNegativeNumber } from '../../utils/validation';
import { useUserStore } from '../../store/userStore';
import { useUsageStore } from '../../store/usageStore';
// SCREENSHOT FEATURE - Commented out for Expo Go compatibility
// import { ScreenshotUploader } from '../../components/screenshot/ScreenshotUploader';
// import type { ScreenTimeData } from '../../services/ocr/screenTimeOCR';
import Card from '../../components/common/Card';
import PrimaryButton from '../../components/common/PrimaryButton';

export default function ProgressScreen() {
  const userFromStore = useUserStore((s) => s.user);
  const setUserStore = useUserStore((s) => s.setUser);
  const [todayMinutes, setTodayMinutes] = useState<string>('');
  const entries = useUsageStore((s) => s.entries);
  const upsertEntryInStore = useUsageStore((s) => s.upsertEntry);
  const [entriesLoaded, setEntriesLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  const todayStart = useMemo(() => startOfDay(new Date()), []);

  useEffect(() => {
    (async () => {
      try {
        let user: User | null = userFromStore ?? null;
        if (!user) {
          const userRaw = await getItem(storageKeys.user);
          if (userRaw) {
            user = JSON.parse(userRaw);
            setUserStore(user);
          }
        }

        const entriesRaw = await getItem(storageKeys.usageEntries);
        const parsed: UsageEntry[] = entriesRaw ? JSON.parse(entriesRaw) : [];
        // initialize store entries once
        if (!entriesLoaded) {
          parsed.forEach((e) => upsertEntryInStore(e));
          setEntriesLoaded(true);
        }

        const myToday = parsed.find((e) => isSameDay(new Date(e.date), todayStart) && (!user ? true : e.userId === user.id));
        if (myToday) setTodayMinutes(String(myToday.minutesUsed));
      } catch {}
      setLoading(false);
    })();
  }, [todayStart, userFromStore, setUserStore, upsertEntryInStore, entriesLoaded]);

  const goalMinutes = userFromStore?.dailyGoalMinutes ?? 0;
  const usedMinutes = Number(todayMinutes) || 0;
  const pct = goalMinutes > 0 ? Math.min(1, usedMinutes / goalMinutes) : 0;
  const pctText = Math.round(pct * 100);

  const computeStreak = useMemo(() => {
    return () => {
      if (!userFromStore) return 0;
      // Build a map of day(yyyy-mm-dd) -> minutes for this user
      const byDay = new Map<string, number>();
      entries
        .filter((e) => e.userId === userFromStore.id)
        .forEach((e) => {
          const key = formatISO(startOfDay(new Date(e.date)), { representation: 'date' });
          byDay.set(key, e.minutesUsed);
        });

      let streak = 0;
      let dayCursor = startOfDay(new Date());
      while (true) {
        const key = formatISO(dayCursor, { representation: 'date' });
        const val = byDay.get(key);
        if (val == null || goalMinutes === 0 || val < goalMinutes) {
          break;
        }
        streak += 1;
        dayCursor = subDays(dayCursor, 1);
      }
      return streak;
    };
  }, [entries, userFromStore, goalMinutes]);

  const streak = computeStreak();

  const upsertToday = async () => {
    if (!userFromStore) {
      Alert.alert('Missing info', 'Please set your name and daily goal on Home first.');
      return;
    }
    const value = parseNonNegativeNumber(todayMinutes);
    if (value == null) {
      Alert.alert('Validation', 'Enter minutes used (0 or more).');
      return;
    }
    const newEntry: UsageEntry = {
      id: `${userFromStore.id}_${formatISO(todayStart)}`,
      userId: userFromStore.id,
      date: formatISO(todayStart),
      minutesUsed: Math.round(value),
    };
    upsertEntryInStore(newEntry);
    // persist all entries from store (including new one)
    await saveItem(storageKeys.usageEntries, JSON.stringify([...entries.filter((e) => e.id !== newEntry.id), newEntry]));
    Alert.alert('Saved', 'Today\'s screen time saved.');
  };

  // SCREENSHOT FEATURE - Commented out for Expo Go compatibility
  // const handleScreenshotData = async (data: ScreenTimeData) => {
  //   if (!userFromStore) {
  //     Alert.alert('Missing info', 'Please set your name and daily goal on Home first.');
  //     return;
  //   }

  //   // Create entry with extracted data
  //   const newEntry: UsageEntry = {
  //     id: `${userFromStore.id}_${formatISO(todayStart)}`,
  //     userId: userFromStore.id,
  //     date: formatISO(todayStart),
  //     minutesUsed: data.dailyMinutes,
  //     weeklyMinutes: data.weeklyMinutes,
  //     dailyAverage: data.dailyAverage,
  //     appUsage: data.appUsage,
  //   };

  //   // Update local state to show the extracted value
  //   setTodayMinutes(String(data.dailyMinutes));

  //   // Save to store and persist
  //   upsertEntryInStore(newEntry);
  //   await saveItem(storageKeys.usageEntries, JSON.stringify([...entries.filter((e) => e.id !== newEntry.id), newEntry]));
  // };

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <Text style={styles.muted}>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Daily Progress</Text>

          <Card>
            <Text style={styles.label}>Your goal</Text>
            <Text style={styles.value}>{goalMinutes} min</Text>
          </Card>

        {/* SCREENSHOT FEATURE - Commented out for Expo Go compatibility */}
        {/* <Card>
            <Text style={styles.sectionTitle}>Upload Screenshot</Text>
            <ScreenshotUploader
              onDataExtracted={handleScreenshotData}
              buttonText="Upload Screen Time Screenshot"
            />
          </Card> */}

        {/* <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View> */}

        {/* Manual Input Section */}
          <Card>
            <Text style={styles.label}>Today's screen time (minutes)</Text>
            <TextInput
              style={styles.input}
              value={todayMinutes}
              onChangeText={setTodayMinutes}
              keyboardType="numeric"
              placeholder="e.g. 90"
              returnKeyType="done"
            />
            <PrimaryButton title="Save" onPress={upsertToday} />
          </Card>

          <Card>
            <Text style={styles.label}>Progress</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pctText}%` }]} />
            </View>
            <Text style={styles.mutedSmall}>{usedMinutes} / {goalMinutes} min ({pctText}%)</Text>
          </Card>

          <Card>
            <Text style={styles.label}>Streak</Text>
            <Text style={styles.value}>{streak} day{streak === 1 ? '' : 's'}</Text>
          </Card>

        {/* SCREENSHOT FEATURE - App Usage Breakdown - Commented out for Expo Go compatibility */}
        {/* {(() => {
          const todayEntry = entries.find(
            (e) => isSameDay(new Date(e.date), todayStart) && e.userId === userFromStore?.id
          );

          if (todayEntry?.appUsage && todayEntry.appUsage.length > 0) {
            return (
              <Card>
                <Text style={styles.sectionTitle}>App Usage Breakdown</Text>
                {todayEntry.weeklyMinutes && (
                  <Text style={[styles.mutedSmall, { marginBottom: spacing.md }]}>
                    Weekly total: {Math.floor(todayEntry.weeklyMinutes / 60)}h {todayEntry.weeklyMinutes % 60}m
                    {todayEntry.dailyAverage && (
                      ` (avg ${Math.floor(todayEntry.dailyAverage / 60)}h ${todayEntry.dailyAverage % 60}m/day)`
                    )}
                  </Text>
                )}
                {todayEntry.appUsage.map((app, index) => (
                  <View key={index} style={styles.appRow}>
                    <Text style={styles.appName}>{app.appName}</Text>
                    <Text style={styles.appTime}>
                      {Math.floor(app.minutesUsed / 60)}h {app.minutesUsed % 60}m
                    </Text>
                  </View>
                ))}
              </Card>
            );
          }
          return null;
        })()} */}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  label: { color: colors.mutedText, marginBottom: spacing.sm },
  value: { color: colors.text, fontSize: 18, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: colors.background,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.mutedText,
    paddingHorizontal: spacing.md,
    fontSize: 12,
    fontWeight: '600',
  },
  muted: { color: colors.mutedText },
  mutedSmall: { color: colors.mutedText, fontSize: 12, marginTop: 6 },
  progressTrack: {
    height: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  appRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  appName: {
    color: colors.text,
    fontSize: 15,
    flex: 1,
  },
  appTime: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '600',
  },
});


