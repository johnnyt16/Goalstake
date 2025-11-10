import { supabase } from './client';

export async function upsertEntry(params: {
  challengeId: string;
  userId: string;
  date: string;
  amount: number;
  source: 'manual' | 'integration' | 'photo';
}) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('challenge_entries')
    .upsert(
      {
        challenge_id: params.challengeId,
        user_id: params.userId,
        date: params.date,
        amount: params.amount,
        source: params.source,
      },
      { onConflict: 'challenge_id,user_id,date' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listMyEntries(challengeId: string, userId: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('challenge_entries')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .order('date', { ascending: true });
  if (error) throw error;
  return data;
}


