import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import Card from '../../components/common/Card';
import PrimaryButton from '../../components/common/PrimaryButton';
import { listMyChallenges } from '../../services/supabase/challenges';
import { useNavigation } from '@react-navigation/native';
import type { ChallengesParamList } from '../../navigation/ChallengesStack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ChallengeRow = {
  id: string;
  title: string;
  goal_type: string;
  metric_unit: string;
  target_value: number;
  start_date: string;
  end_date: string;
  status: string;
};

export default function ChallengesScreen() {
  const nav = useNavigation<NativeStackNavigationProp<ChallengesParamList>>();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ChallengeRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await listMyChallenges();
        setItems((data ?? []) as unknown as ChallengeRow[]);
      } catch {}
      setLoading(false);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Challenges</Text>
      {loading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : items.length === 0 ? (
        <Card>
          <Text style={styles.hero}>🎯 Start your first challenge</Text>
          <Text style={styles.muted}>Compete with friends and put meaningful stakes on the line.</Text>
          <PrimaryButton title="Create a Challenge" onPress={() => nav.navigate('ChallengeDetail' as any)} />
        </Card>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: spacing.md }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.mutedSmall}>
                {item.goal_type} • {item.target_value} {item.metric_unit}
              </Text>
              <TouchableOpacity onPress={() => nav.navigate('ChallengeDetail', { challengeId: item.id })} style={styles.cardAction}>
                <Text style={styles.cardActionText}>View</Text>
              </TouchableOpacity>
            </Card>
          )}
        />
      )}
      <TouchableOpacity onPress={() => nav.navigate('GroupSettings')} style={styles.manageGroups}>
        <Text style={styles.manageGroupsText}>Manage Groups</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.fab} onPress={() => nav.navigate('ChallengeDetail' as any)}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  hero: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  muted: { color: colors.mutedText, marginBottom: spacing.md },
  mutedSmall: { color: colors.mutedText, fontSize: 12, marginTop: 4 },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  cardAction: { marginTop: spacing.md, alignSelf: 'flex-start' },
  cardActionText: { color: colors.primary, fontWeight: '700' },
  manageGroups: { position: 'absolute', left: spacing.lg, bottom: spacing.lg, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 999, backgroundColor: colors.background },
  manageGroupsText: { color: colors.text, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30, fontWeight: '700' },
});


