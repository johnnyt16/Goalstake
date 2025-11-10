import { supabase } from './client';

export async function createGroup(name: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.from('groups').insert({ name }).select().single();
  if (error) throw error;
  return data;
}

export async function joinGroup(groupId: string, userId: string, role: 'member' | 'admin' = 'member') {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('group_memberships')
    .insert({ group_id: groupId, user_id: userId, role })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getGroupWithMembers(groupId: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('groups')
    .select('*, group_memberships(*, profiles(*))')
    .eq('id', groupId)
    .single();
  if (error) throw error;
  return data;
}

export async function listMyGroups() {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return [];
  const { data, error } = await supabase
    .from('groups')
    .select('*, group_memberships!inner(user_id)')
    .eq('group_memberships.user_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateGroupSettings(
  groupId: string,
  payload: {
    distribution_mode: 'redistribute' | 'donate' | 'mixed';
    charity_id: string | null;
    mixed_winners_percent: number | null;
  }
) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('groups')
    .update({
      distribution_mode: payload.distribution_mode,
      charity_id: payload.charity_id,
      mixed_winners_percent: payload.mixed_winners_percent,
    })
    .eq('id', groupId)
    .select()
    .single();
  if (error) throw error;
  return data;
}


