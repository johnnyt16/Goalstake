import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import Card from '../../components/common/Card';
import PrimaryButton from '../../components/common/PrimaryButton';
import { listMyGroups, createGroup, joinGroup } from '../../services/supabase/groups';
import { supabase } from '../../services/supabase/client';
import { createChallenge, joinChallengeAsSelf, getChallenge } from '../../services/supabase/challenges';
import { useRoute, RouteProp } from '@react-navigation/native';
import type { ChallengesParamList } from '../../navigation/ChallengesStack';

type GroupRow = { id: string; name: string };
type GoalForm = {
  groupId: string | null;
  title: string;
  goalType: string;
  metricUnit: string;
  targetValue: string;
  stakeCents: string;
  verificationMode: string;
  distributionMode: string;
  startDate: string;
  endDate: string;
  quickGroupName: string;
};

export default function ChallengeDetailScreen() {
  const route = useRoute<RouteProp<ChallengesParamList, 'ChallengeDetail'>>();
  const challengeId = route.params?.challengeId ?? null;
  const [existing, setExisting] = useState<any | null>(null);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<GoalForm>({
    groupId: null,
    title: '',
    goalType: 'screen_time',
    metricUnit: 'minutes',
    targetValue: '',
    stakeCents: '0',
    verificationMode: 'honor',
    distributionMode: 'redistribute',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    quickGroupName: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const g = (await listMyGroups()) as unknown as GroupRow[];
        setGroups(g);
        if (!challengeId && g.length > 0) setForm((f) => ({ ...f, groupId: g[0].id }));
        if (challengeId) {
          const detail = await getChallenge(challengeId);
          setExisting(detail);
        }
      } catch {}
      setLoading(false);
    })();
  }, [challengeId]);

  const onQuickCreateGroup = async () => {
    if (!form.quickGroupName.trim()) {
      Alert.alert('Validation', 'Enter a group name.');
      return;
    }
    if (!supabase) {
      Alert.alert('Config', 'Supabase not configured.');
      return;
    }
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error('No user');
      const g = await createGroup(form.quickGroupName.trim());
      await joinGroup(g.id, uid, 'admin');
      const g2 = (await listMyGroups()) as unknown as GroupRow[];
      setGroups(g2);
      setForm((f) => ({ ...f, groupId: g.id, quickGroupName: '' }));
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to create group');
    }
  };

  const onCreate = async () => {
    if (!supabase) {
      Alert.alert('Config', 'Supabase not configured.');
      return;
    }
    const title = form.title.trim();
    const target = Number(form.targetValue);
    const stake = Number(form.stakeCents);
    if (!form.groupId) {
      Alert.alert('Validation', 'Select or create a group.');
      return;
    }
    if (!title) {
      Alert.alert('Validation', 'Enter a challenge title.');
      return;
    }
    if (!Number.isFinite(target) || target <= 0) {
      Alert.alert('Validation', 'Enter a positive target value.');
      return;
    }
    if (!Number.isFinite(stake) || stake < 0) {
      Alert.alert('Validation', 'Enter a valid stake amount (in cents).');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        groupId: form.groupId,
        title,
        goalType: form.goalType as any,
        metricUnit: form.metricUnit,
        targetValue: target,
        stakeAmountCents: Math.round(stake),
        distributionMode: form.distributionMode as any,
        verificationMode: form.verificationMode as any,
        startDate: form.startDate,
        endDate: form.endDate,
        charityId: null,
        mixedWinnersPercent: null,
      };
      const created = await createChallenge(payload as any);
      try {
        await joinChallengeAsSelf(created.id, Math.round(stake));
      } catch {}
      Alert.alert('Created', 'Challenge created. You have been added as a participant.');
      setForm((f) => ({ ...f, title: '', targetValue: '', stakeCents: '0' }));
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to create challenge');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (patch: Partial<GoalForm>) => setForm((f) => ({ ...f, ...patch }));

  if (challengeId && existing) {
    const participantsCount = (existing.challenge_participants || []).length;
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{existing.title}</Text>
        <Card>
          <Text style={styles.muted}>
            {existing.goal_type} • {existing.target_value} {existing.metric_unit}
          </Text>
          <Text style={[styles.muted, { marginTop: spacing.sm }]}>
            {existing.start_date} → {existing.end_date}
          </Text>
          <Text style={[styles.muted, { marginTop: spacing.sm }]}>
            Stake: {(existing.stake_amount_cents / 100).toFixed(2)}
          </Text>
          <Text style={[styles.muted, { marginTop: spacing.sm }]}>
            Participants: {participantsCount}
          </Text>
        </Card>
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.label}>Join (stake in cents)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder={String(existing.stake_amount_cents)}
            value={form.stakeCents}
            onChangeText={(v) => set({ stakeCents: v })}
          />
          <PrimaryButton
            title={submitting ? 'Joining…' : 'Join Challenge'}
            onPress={async () => {
              const cents = Number(form.stakeCents || existing.stake_amount_cents);
              if (!Number.isFinite(cents) || cents < 0) {
                Alert.alert('Validation', 'Enter a valid stake (cents).');
                return;
              }
              setSubmitting(true);
              try {
                await joinChallengeAsSelf(existing.id, Math.round(cents));
                Alert.alert('Joined', 'You have joined the challenge.');
              } catch (e: any) {
                Alert.alert('Error', e?.message ?? 'Failed to join.');
              } finally {
                setSubmitting(false);
              }
            }}
          />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create a Challenge</Text>

      {loading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : (
        <>
          {groups.length === 0 ? (
            <Card>
              <Text style={styles.hero}>👋 Create your first group</Text>
              <Text style={styles.muted}>Name your group to get started.</Text>
              <TextInput
                style={styles.input}
                placeholder="Group name"
                value={form.quickGroupName}
                onChangeText={(v) => set({ quickGroupName: v })}
                returnKeyType="done"
              />
              <PrimaryButton title="Create Group" onPress={onQuickCreateGroup} />
            </Card>
          ) : (
            <>
              <Card>
                <Text style={styles.label}>Group</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: spacing.sm }}>
                  {groups.map((g) => {
                    const active = form.groupId === g.id;
                    return (
                      <View key={g.id} style={[styles.pill, active ? styles.pillActive : undefined]}>
                        <Text
                          onPress={() => set({ groupId: g.id })}
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
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Under 90m screen time"
                  value={form.title}
                  onChangeText={(v) => set({ title: v })}
                />

                <Text style={[styles.label, { marginTop: spacing.md }]}>Goal Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: spacing.sm }}>
                  {['screen_time', 'workouts', 'steps', 'study', 'sleep', 'water', 'custom'].map((gt) => {
                    const active = form.goalType === gt;
                    return (
                      <View key={gt} style={[styles.pill, active ? styles.pillActive : undefined]}>
                        <Text
                          onPress={() => set({ goalType: gt })}
                          style={[styles.pillText, active ? styles.pillTextActive : undefined]}
                        >
                          {gt.replace('_', ' ')}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>

                <Text style={[styles.label, { marginTop: spacing.md }]}>Metric & Target</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Unit (e.g. minutes)"
                    value={form.metricUnit}
                    onChangeText={(v) => set({ metricUnit: v })}
                  />
                  <TextInput
                    style={[styles.input, { width: 120 }]}
                    placeholder="Target"
                    keyboardType="numeric"
                    value={form.targetValue}
                    onChangeText={(v) => set({ targetValue: v })}
                  />
                </View>
              </Card>

              <Card style={{ marginTop: spacing.lg }}>
                <Text style={styles.label}>Stake (cents)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 500 (=$5.00)"
                  keyboardType="numeric"
                  value={form.stakeCents}
                  onChangeText={(v) => set({ stakeCents: v })}
                />

                <Text style={[styles.label, { marginTop: spacing.md }]}>Verification</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: spacing.sm }}>
                  {['honor', 'peer_vote', 'proof_photo'].map((vm) => {
                    const active = form.verificationMode === vm;
                    return (
                      <View key={vm} style={[styles.pill, active ? styles.pillActive : undefined]}>
                        <Text
                          onPress={() => set({ verificationMode: vm })}
                          style={[styles.pillText, active ? styles.pillTextActive : undefined]}
                        >
                          {vm.replace('_', ' ')}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>

                <Text style={[styles.label, { marginTop: spacing.md }]}>Distribution</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: spacing.sm }}>
                  {['redistribute', 'donate', 'mixed'].map((dm) => {
                    const active = form.distributionMode === dm;
                    return (
                      <View key={dm} style={[styles.pill, active ? styles.pillActive : undefined]}>
                        <Text
                          onPress={() => set({ distributionMode: dm })}
                          style={[styles.pillText, active ? styles.pillTextActive : undefined]}
                        >
                          {dm}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </Card>

              <Card style={{ marginTop: spacing.lg }}>
                <Text style={styles.label}>Dates</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Start (YYYY-MM-DD)"
                    value={form.startDate}
                    onChangeText={(v) => set({ startDate: v })}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="End (YYYY-MM-DD)"
                    value={form.endDate}
                    onChangeText={(v) => set({ endDate: v })}
                  />
                </View>
              </Card>

              <PrimaryButton title={submitting ? 'Creating…' : 'Create Challenge'} onPress={onCreate} />
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  hero: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
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
    marginBottom: spacing.sm,
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


