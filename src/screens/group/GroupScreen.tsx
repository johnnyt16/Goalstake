import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { nanoid } from 'nanoid/non-secure';
import { saveItem, getItem } from '../../services/storage/asyncStorage';
import { storageKeys } from '../../constants/storageKeys';
import type { Group, GroupMember } from '../../types/group';
import type { User } from '../../types/user';
import Card from '../../components/common/Card';
import PrimaryButton from '../../components/common/PrimaryButton';

type MemberProgress = Record<string, number>; // memberId -> todayMinutes

export default function GroupScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [memberProgress, setMemberProgress] = useState<MemberProgress>({});
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const userRaw = await getItem(storageKeys.user);
        if (userRaw) setUser(JSON.parse(userRaw));
        const groupRaw = await getItem(storageKeys.group);
        if (groupRaw) {
          const parsed: Group = JSON.parse(groupRaw);
          setGroup(parsed);
          seedProgress(parsed.members);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const codeFromId = (id: string) => id.slice(-6).toUpperCase();

  const seedProgress = (members: GroupMember[]) => {
    const next: MemberProgress = {};
    members.forEach((m) => {
      // simulate today minutes between 30% and 120% of daily goal
      const min = Math.round((m.dailyGoalMinutes * 0.3));
      const max = Math.round((m.dailyGoalMinutes * 1.2));
      const val = Math.max(0, Math.min(max, Math.floor(min + Math.random() * (max - min + 1))));
      next[m.id] = val;
    });
    setMemberProgress(next);
  };

  const ensureUser = () => {
    if (!user) {
      Alert.alert('Missing info', 'Please set your name and daily goal on Home first.');
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!ensureUser()) return;
    const name = groupName.trim();
    if (!name) {
      Alert.alert('Validation', 'Enter a group name.');
      return;
    }
    const id = nanoid();
    const members: GroupMember[] = [
      { id: user!.id, name: user!.name, dailyGoalMinutes: user!.dailyGoalMinutes },
      // mock friends
      { id: nanoid(), name: 'Alex', dailyGoalMinutes: user!.dailyGoalMinutes },
      { id: nanoid(), name: 'Sam', dailyGoalMinutes: Math.max(30, user!.dailyGoalMinutes - 30) },
    ];
    const newGroup: Group = { id, name, members };
    await saveItem(storageKeys.group, JSON.stringify(newGroup));
    setGroup(newGroup);
    seedProgress(members);
    setGroupName('');
    Alert.alert('Group created', `Code: ${codeFromId(id)}`);
  };

  const handleJoin = async () => {
    if (!ensureUser()) return;
    const code = groupCode.trim().toUpperCase();
    if (code.length < 4) {
      Alert.alert('Validation', 'Enter a valid group code.');
      return;
    }
    // Simulate fetching by code: create a deterministic mock group from code
    const id = `grp_${code}`;
    const baseName = `Group ${code}`;
    const existingMembers: GroupMember[] = [
      { id: nanoid(), name: 'Taylor', dailyGoalMinutes: user!.dailyGoalMinutes },
      { id: nanoid(), name: 'Jordan', dailyGoalMinutes: user!.dailyGoalMinutes + 30 },
    ];
    // Add current user if not present
    const joinedMembers = [
      ...existingMembers,
      { id: user!.id, name: user!.name, dailyGoalMinutes: user!.dailyGoalMinutes },
    ];
    const joinedGroup: Group = { id, name: baseName, members: joinedMembers };
    await saveItem(storageKeys.group, JSON.stringify(joinedGroup));
    setGroup(joinedGroup);
    seedProgress(joinedMembers);
    setGroupCode('');
    Alert.alert('Joined group', baseName);
  };

  const progressPercent = (member: GroupMember) => {
    const used = memberProgress[member.id] ?? 0;
    const pct = member.dailyGoalMinutes > 0 ? Math.min(1, used / member.dailyGoalMinutes) : 0;
    return { used, pct };
  };

  const header = useMemo(() => {
    if (!group) return null;
    const code = codeFromId(group.id);
    return (
      <View style={{ marginBottom: spacing.xl }}>
        <Text style={styles.groupTitle}>{group.name}</Text>
        <Text style={styles.groupCode}>Code: {code}</Text>
      </View>
    );
  }, [group]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <Text style={{ color: colors.mutedText }}>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {!group ? (
        <View>
          <Card>
            <Text style={styles.sectionTitle}>Create a group</Text>
            <TextInput
              style={styles.input}
              placeholder="Group name"
              value={groupName}
              onChangeText={setGroupName}
              returnKeyType="done"
            />
            <PrimaryButton title="Create Group" onPress={handleCreate} />
          </Card>

          <Card style={{ marginTop: spacing.lg }}>
            <Text style={styles.sectionTitle}>Join a group</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter code"
              value={groupCode}
              onChangeText={setGroupCode}
              autoCapitalize="characters"
              returnKeyType="done"
            />
            <PrimaryButton title="Join Group" onPress={handleJoin} />
          </Card>
        </View>
      ) : (
        <View>
          {header}
          <Text style={styles.sectionTitle}>Members</Text>
          <Card style={{ paddingBottom: spacing.md }}>
            {group.members.map((item) => {
              const { used, pct } = progressPercent(item);
              const pctText = Math.round(pct * 100);
              return (
                <View key={item.id} style={styles.memberRow}>
                  <View style={styles.memberHeaderRow}>
                    <Text style={styles.memberName}>{item.name}</Text>
                    <Text style={{ color: colors.mutedText }}>{pctText}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${pctText}%` }]} />
                  </View>
                  <Text style={styles.memberSub}>
                    {used} / {item.dailyGoalMinutes} min
                  </Text>
                </View>
              );
            })}
          </Card>
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: colors.background,
    marginBottom: spacing.md,
  },
  buttonPrimary: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  buttonDark: { backgroundColor: colors.text, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  groupTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  groupCode: { marginTop: 4, color: colors.mutedText },
  memberRow: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  memberHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  memberName: { color: colors.text, fontWeight: '600' },
  memberSub: { color: colors.mutedText, fontSize: 12, marginTop: 6 },
  progressTrack: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary },
});


