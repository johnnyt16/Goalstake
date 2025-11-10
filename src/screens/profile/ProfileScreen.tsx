import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getItem } from '../../services/storage/asyncStorage';
import { storageKeys } from '../../constants/storageKeys';
import type { User } from '../../types/user';
import { minutesToHoursMinutes } from '../../utils/format';

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await getItem(storageKeys.user);
        if (raw) setUser(JSON.parse(raw));
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: colors.mutedText }}>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {!user ? (
        <View style={styles.card}>
          <Text style={styles.title}>No profile yet</Text>
          <Text style={styles.muted}>Go to the Home tab to set your name and daily goal.</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.title}>{user.name}</Text>
          <Text style={styles.muted}>Daily goal</Text>
          <Text style={styles.value}>
            {user.dailyGoalMinutes} min ({minutesToHoursMinutes(user.dailyGoalMinutes)})
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.lg,
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  value: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 4 },
  muted: { color: colors.mutedText },
});


