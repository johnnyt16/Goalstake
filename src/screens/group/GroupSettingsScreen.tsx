import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import Card from '../../components/common/Card';
import PrimaryButton from '../../components/common/PrimaryButton';
import { listMyGroups, updateGroupSettings } from '../../services/supabase/groups';

type GroupRow = { id: string; name: string; distribution_mode: string | null; charity_id: string | null; mixed_winners_percent: number | null };

export default function GroupSettingsScreen() {
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [distributionMode, setDistributionMode] = useState<'redistribute' | 'donate' | 'mixed'>('redistribute');
  const [mixedPercent, setMixedPercent] = useState<string>('50');
  const [charityId, setCharityId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = (await listMyGroups()) as unknown as GroupRow[];
        setGroups(data);
        if (data.length > 0) {
          const g = data[0];
          setSelected(g.id);
          if (g.distribution_mode) setDistributionMode(g.distribution_mode as any);
          if (g.mixed_winners_percent != null) setMixedPercent(String(g.mixed_winners_percent));
          if (g.charity_id) setCharityId(g.charity_id);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const onSave = async () => {
    if (!selected) {
      Alert.alert('Select a group');
      return;
    }
    if (distributionMode === 'mixed') {
      const n = Number(mixedPercent);
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        Alert.alert('Validation', 'Mixed winners percent must be between 0 and 100.');
        return;
      }
    }
    setSaving(true);
    try {
      await updateGroupSettings(selected, {
        distribution_mode: distributionMode,
        charity_id: charityId || null,
        mixed_winners_percent: distributionMode === 'mixed' ? Math.round(Number(mixedPercent)) : null,
      });
      Alert.alert('Saved', 'Group settings updated.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Group Settings</Text>
      {loading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : groups.length === 0 ? (
        <Card>
          <Text style={styles.muted}>You are not in any groups yet.</Text>
        </Card>
      ) : (
        <>
          <Card>
            <Text style={styles.label}>Select Group</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: spacing.sm }}>
              {groups.map((g) => {
                const active = selected === g.id;
                return (
                  <View key={g.id} style={[styles.pill, active ? styles.pillActive : undefined]}>
                    <Text
                      onPress={() => {
                        setSelected(g.id);
                        setDistributionMode((g.distribution_mode as any) || 'redistribute');
                        setMixedPercent(g.mixed_winners_percent != null ? String(g.mixed_winners_percent) : '50');
                        setCharityId(g.charity_id ?? '');
                      }}
                      style={[styles.pillText, active ? styles.pillTextActive : undefined]}
                    >
                      {g.name}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </Card>

          <Card style={{ marginTop: spacing.lg }}>
            <Text style={styles.label}>Payout Distribution</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: spacing.sm }}>
              {['redistribute', 'donate', 'mixed'].map((dm) => {
                const active = distributionMode === dm;
                return (
                  <View key={dm} style={[styles.pill, active ? styles.pillActive : undefined]}>
                    <Text
                      onPress={() => setDistributionMode(dm as any)}
                      style={[styles.pillText, active ? styles.pillTextActive : undefined]}
                    >
                      {dm}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            {distributionMode === 'mixed' ? (
              <>
                <Text style={[styles.label, { marginTop: spacing.md }]}>Winners Percent (0–100)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={mixedPercent}
                  onChangeText={setMixedPercent}
                  placeholder="e.g. 70"
                />
              </>
            ) : null}

            <Text style={[styles.label, { marginTop: spacing.md }]}>Charity ID (optional)</Text>
            <TextInput
              style={styles.input}
              value={charityId}
              onChangeText={setCharityId}
              placeholder="UUID of charity integration"
            />
          </Card>

          <PrimaryButton title={saving ? 'Saving…' : 'Save Settings'} onPress={onSave} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  muted: { color: colors.mutedText },
  label: { color: colors.mutedText, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: colors.background,
  },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { color: colors.text, fontWeight: '600' },
  pillTextActive: { color: '#fff' },
});


