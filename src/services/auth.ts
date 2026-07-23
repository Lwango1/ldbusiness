import { supabase } from '../lib/supabase';

export type UserRole = 'buyer' | 'seller' | 'admin';

// Convertit un numéro de téléphone en email technique pour Supabase
function phoneToEmail(phone: string): string {
  const clean = phone.replace(/[^0-9+]/g, '');
  return `${clean.replace('+', '00')}@ldbusiness.app`;
}

export async function signUp(phone: string, password: string, fullName: string, role: UserRole = 'buyer') {
  const email = phoneToEmail(phone);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role, phone },
    },
  });
  if (error) throw error;

  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      phone,
      role,
    }, { onConflict: 'id' });
    if (profileError) console.error('Profile creation error:', profileError.message);
  }

  return data;
}

export async function signIn(phone: string, password: string) {
  const email = phoneToEmail(phone);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentUserPhone(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.user_metadata?.phone as string || user?.user_metadata?.full_name || null;
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  return user?.user_metadata?.role as UserRole || null;
}

export function onAuthChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}
