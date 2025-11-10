import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getItem } from '../../services/storage/asyncStorage';
import { storageKeys } from '../../constants/storageKeys';
import type { UsageEntry } from '../../types/usage';
import type { User } from '../../types/user';
import { format, isWithinInterval, startOfDay } from 'date-fns';
import { getCurrentWeekRange } from '../../utils/dates';
import { minutesToHoursMinutes } from '../../utils/format';

export default function WeeklySummaryScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<UsageEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const { start, end } = useMemo(() => getCurrentWeekRange(), []);

  useEffect(() => {
    (async () => {
      try {
        const userRaw = await getItem(storageKeys.user);
        if (userRaw) setUser(JSON.parse(userRaw));
        const entriesRaw = await getItem(storageKeys.usageEntries);
        const parsed: UsageEntry[] = entriesRaw ? JSON.parse(entriesRaw) : [];
        setEntries(parsed);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const myWeekEntries = useMemo(() => {
    if (!user) return [];
    return entries
      .filter((e) => e.userId === user.id)
      .filter((e) => {
        const d = new Date(e.date);
        return isWithinInterval(d, { start, end });
      })
      .sort((a, b) => +new Date(a.date) - +new Date(b.date));
  }, [entries, user, start, end]);

  const totalMinutes = myWeekEntries.reduce((acc, e) => acc + e.minutesUsed, 0);
  const goalTotal = (user?.dailyGoalMinutes ?? 0) * 7;
  const pct = goalTotal > 0 ? Math.min(1, totalMinutes / goalTotal) : 0;
  const pctText = Math.round(pct * 100);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.muted}>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl }}>
        <Text style={styles.title}>This Week</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Weekly total</Text>
          <Text style={styles.value}>{totalMinutes} min ({minutesToHoursMinutes(totalMinutes)})</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pctText}%` }]} />
          </View>
          <Text style={styles.mutedSmall}>{totalMinutes} / {goalTotal} min ({pctText}%)</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Daily breakdown</Text>
          {myWeekEntries.length === 0 ? (
            <Text style={styles.mutedSmall}>No entries yet.</Text>
          ) : (
            myWeekEntries.map((e) => (
              <View key={e.id} style={styles.row}>
                <Text style={styles.rowLabel}>{format(startOfDay(new Date(e.date)), 'EEE, MMM d')}</Text>
                <Text style={styles.rowValue}>{e.minutesUsed} min</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: spacing.lg, marginBottom: spacing.lg },
  label: { color: colors.mutedText, marginBottom: spacing.sm },
  value: { color: colors.text, fontSize: 18, fontWeight: '700' },
  progressTrack: { height: 10, backgroundColor: '#F3F4F6', borderRadius: 999, overflow: 'hidden', marginTop: spacing.sm },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  muted: { color: colors.mutedText },
  mutedSmall: { color: colors.mutedText, fontSize: 12, marginTop: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  rowLabel: { color: colors.text },
  rowValue: { color: colors.text, fontWeight: '600' },
});


