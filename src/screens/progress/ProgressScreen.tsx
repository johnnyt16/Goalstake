import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getItem, saveItem } from '../../services/storage/asyncStorage';
import { storageKeys } from '../../constants/storageKeys';
import type { User } from '../../types/user';
import type { UsageEntry } from '../../types/usage';
import { formatISO, startOfDay, isSameDay, subDays } from 'date-fns';

export default function ProgressScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [todayMinutes, setTodayMinutes] = useState<string>('');
  const [entries, setEntries] = useState<UsageEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStart = useMemo(() => startOfDay(new Date()), []);

  useEffect(() => {
    (async () => {
      try {
        const userRaw = await getItem(storageKeys.user);
        if (userRaw) setUser(JSON.parse(userRaw));

        const entriesRaw = await getItem(storageKeys.usageEntries);
        const parsed: UsageEntry[] = entriesRaw ? JSON.parse(entriesRaw) : [];
        setEntries(parsed);

        const myToday = parsed.find((e) => isSameDay(new Date(e.date), todayStart) && (!userRaw || e.userId === JSON.parse(userRaw).id));
        if (myToday) setTodayMinutes(String(myToday.minutesUsed));
      } catch {}
      setLoading(false);
    })();
  }, [todayStart]);

  const goalMinutes = user?.dailyGoalMinutes ?? 0;
  const usedMinutes = Number(todayMinutes) || 0;
  const pct = goalMinutes > 0 ? Math.min(1, usedMinutes / goalMinutes) : 0;
  const pctText = Math.round(pct * 100);

  const computeStreak = useMemo(() => {
    return () => {
      if (!user) return 0;
      // Build a map of day(yyyy-mm-dd) -> minutes for this user
      const byDay = new Map<string, number>();
      entries
        .filter((e) => e.userId === user.id)
        .forEach((e) => {
          const key = formatISO(startOfDay(new Date(e.date)), { representation: 'date' });
          byDay.set(key, e.minutesUsed);
        });

      let streak = 0;
      let dayCursor = startOfDay(new Date());
      while (true) {
        const key = formatISO(dayCursor, { representation: 'date' });
        const val = byDay.get(key);
        if (val == null || val > goalMinutes || goalMinutes === 0) {
          break;
        }
        streak += 1;
        dayCursor = subDays(dayCursor, 1);
      }
      return streak;
    };
  }, [entries, user, goalMinutes]);

  const streak = computeStreak();

  const upsertToday = async () => {
    if (!user) {
      Alert.alert('Missing info', 'Please set your name and daily goal on Home first.');
      return;
    }
    const value = Number(todayMinutes);
    if (!Number.isFinite(value) || value < 0) {
      Alert.alert('Validation', 'Enter minutes used (0 or more).');
      return;
    }
    const newEntry: UsageEntry = {
      id: `${user.id}_${formatISO(todayStart)}`,
      userId: user.id,
      date: formatISO(todayStart),
      minutesUsed: Math.round(value),
    };
    const others = entries.filter((e) => !(e.userId === user.id && isSameDay(new Date(e.date), todayStart)));
    const next = [...others, newEntry];
    setEntries(next);
    await saveItem(storageKeys.usageEntries, JSON.stringify(next));
    Alert.alert('Saved', 'Today\'s screen time saved.');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <Text style={styles.muted}>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl }}>
        <Text style={styles.title}>Daily Progress</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Your goal</Text>
          <Text style={styles.value}>{goalMinutes} min</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Today's screen time (minutes)</Text>
          <TextInput
            style={styles.input}
            value={todayMinutes}
            onChangeText={setTodayMinutes}
            keyboardType="numeric"
            placeholder="e.g. 90"
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.button} onPress={upsertToday}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Progress</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pctText}%` }]} />
          </View>
          <Text style={styles.mutedSmall}>{usedMinutes} / {goalMinutes} min ({pctText}%)</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Streak</Text>
          <Text style={styles.value}>{streak} day{streak === 1 ? '' : 's'}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
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
  label: { color: colors.mutedText, marginBottom: spacing.sm },
  value: { color: colors.text, fontSize: 18, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: '#fff',
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
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
});


