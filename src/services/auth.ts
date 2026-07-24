import { supabase } from '../lib/supabase';

export type UserRole = 'buyer' | 'seller' | 'admin';

function phoneToEmail(phone: string): string {
  const clean = phone.replace(/[^0-9+]/g, '');
  return `${clean.replace('+', '00')}@ldbusiness.app`;
}

function createEndDate(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
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

  if (error) {
    if (error.message?.includes('rate_limit') || error.message?.includes('email') || error.message?.includes('smtp')) {
      console.warn('Email error (ignored):', error.message);
    } else {
      throw error;
    }
  }

  if (data?.user) {
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      phone,
      role,
    }, { onConflict: 'id' });
    if (profileError) console.error('Profile creation error:', profileError.message);

    // Offrir 1 mois gratuit
    const { error: subError } = await supabase.from('subscriptions').insert({
      user_id: data.user.id,
      plan: 'monthly',
      amount_usd: 0,
      payment_method: 'free',
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: createEndDate(1),
    });
    if (subError) console.error('Free subscription error:', subError.message);
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
  const metaRole = user?.user_metadata?.role as UserRole | undefined;
  if (metaRole) return metaRole;

  // Fallback: vérifier dans la table profiles
  if (user) {
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (data?.role) return data.role as UserRole;
  }

  return null;
}

export function onAuthChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}
