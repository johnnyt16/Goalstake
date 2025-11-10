import { supabase } from './client';

export async function getCurrentProfile() {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase.from('users').select('*').eq('id', uid).maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertCurrentUserName(name: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  const email = auth.user?.email;
  if (!uid || !email) throw new Error('Missing auth user');
  const { data, error } = await supabase
    .from('users')
    .upsert({ id: uid, email, name }, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}


