import { supabase } from './client';
import type { Challenge } from '../../types/challenge';

export async function createChallenge(challenge: Omit<Challenge, 'id' | 'createdAt' | 'status'> & { status?: Challenge['status'] }) {
  if (!supabase) throw new Error('Supabase not configured');
  const payload = { 
    group_id: challenge.groupId,
    title: challenge.title,
    goal_type: challenge.goalType,
    metric_unit: challenge.metricUnit,
    target_value: challenge.targetValue,
    stake_amount_cents: challenge.stakeAmountCents,
    distribution_mode: challenge.distributionMode,
    verification_mode: challenge.verificationMode,
    start_date: challenge.startDate,
    end_date: challenge.endDate,
    charity_id: challenge.charityId ?? null,
    mixed_winners_percent: challenge.mixedWinnersPercent ?? null,
    status: challenge.status ?? 'active',
  };
  const { data, error } = await supabase.from('challenges').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function joinChallengeAsSelf(challengeId: string, stakeAmountCents: number) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('challenge_participants')
    .insert({ challenge_id: challengeId, user_id: uid, stake_amount_cents: stakeAmountCents })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listGroupChallenges(groupId: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('group_id', groupId)
    .order('start_date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getChallenge(challengeId: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('challenges')
    .select('*, challenge_participants(*)')
    .eq('id', challengeId)
    .single();
  if (error) throw error;
  return data;
}

export async function listMyChallenges() {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return [];
  // Challenges where current user is a participant
  const { data, error } = await supabase
    .from('challenges')
    .select('*, challenge_participants!inner(user_id)')
    .eq('challenge_participants.user_id', uid)
    .order('start_date', { ascending: false });
  if (error) throw error;
  return data;
}


