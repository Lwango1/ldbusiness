import { supabase } from '../lib/supabase';
import { LdConnectPlan, planPriceCdf } from '../data/ldconnect';
import { Transaction } from '../types';

// =========== FORFAITS ===========

export interface LdConnectPlanRow extends LdConnectPlan {
  active: boolean;
  sort: number;
}

function mapRow(r: any): LdConnectPlanRow {
  return {
    id: r.id,
    name: r.name,
    tier: r.tier || 'bronze',
    speedMbps: Number(r.speed_mbps || 0),
    durationHours: Number(r.duration_hours || 0),
    priceUsd: Number(r.price_usd || 0),
    priceCdf: r.price_cdf != null ? Number(r.price_cdf) : null,
    features: r.features || [],
    mikrotikProfile: r.mikrotik_profile || r.tier || 'bronze',
    popular: !!r.popular,
    active: !!r.active,
    sort: Number(r.sort || 0),
  };
}

export async function getLdConnectPlans(): Promise<LdConnectPlanRow[]> {
  let { data } = await supabase.from('ldconnect_plans')
    .select('*')
    .eq('active', true)
    .order('sort', { ascending: true });

  if (!data || data.length === 0) {
    await supabase.rpc('ensure_ldconnect_defaults');
    const { data: d2 } = await supabase.from('ldconnect_plans')
      .select('*')
      .eq('active', true)
      .order('sort', { ascending: true });
    data = d2;
  }

  return (data || []).map(mapRow);
}

export async function getAdminLdConnectPlans(): Promise<LdConnectPlanRow[]> {
  const { data } = await supabase.from('ldconnect_plans')
    .select('*')
    .order('sort', { ascending: true });
  return (data || []).map(mapRow);
}

export async function adminSaveLdConnectPlan(plan: LdConnectPlanRow): Promise<boolean> {
  const { error } = await supabase.rpc('admin_upsert_ldconnect_plan', {
    p_id: plan.id,
    p_name: plan.name,
    p_tier: plan.tier,
    p_speed_mbps: plan.speedMbps,
    p_duration_hours: plan.durationHours,
    p_price_usd: plan.priceUsd,
    p_price_cdf: plan.priceCdf ?? null,
    p_features: plan.features,
    p_mikrotik_profile: plan.mikrotikProfile,
    p_popular: plan.popular,
    p_sort: plan.sort,
    p_active: plan.active,
  });
  if (error) console.error('adminSaveLdConnectPlan error:', error.message);
  return !error;
}

export async function adminDeleteLdConnectPlan(id: string): Promise<boolean> {
  const { error } = await supabase.rpc('admin_delete_ldconnect_plan', { p_id: id });
  if (error) console.error('adminDeleteLdConnectPlan error:', error.message);
  return !error;
}

// =========== COMMANDE ===========

export interface LdConnectOrderInput {
  buyerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  plan: LdConnectPlan;
}

export async function createLdConnectOrder(data: LdConnectOrderInput): Promise<Transaction | null> {
  const price = planPriceCdf(data.plan);
  const invoiceNumber = `LDC-${Date.now().toString(36).toUpperCase()}`;

  const { data: txn, error } = await supabase.from('transactions').insert({
    buyer_id: data.buyerId,
    invoice_number: invoiceNumber,
    customer_name: data.customerName,
    customer_phone: data.customerPhone,
    customer_email: data.customerEmail || null,
    customer_address: `LDConnect — ${data.plan.name}`,
    payment_method: 'maxicash',
    subtotal: price,
    tax: 0,
    total: price,
    commission_rate: 0,
    platform_commission: 0,
    status: 'pending',
  }).select().single();

  if (error || !txn) {
    console.error('createLdConnectOrder error:', error?.message);
    return null;
  }

  // Crée le voucher en attente (code généré lors de la validation du paiement)
  await supabase.from('wifi_vouchers').insert({
    transaction_id: invoiceNumber,
    buyer_id: data.buyerId,
    plan_id: data.plan.id,
    plan_name: data.plan.name,
    tier: data.plan.tier,
    duration_hours: data.plan.durationHours,
    speed_mbps: data.plan.speedMbps,
    mikrotik_profile: data.plan.mikrotikProfile,
    status: 'pending',
  });

  return {
    id: txn.id,
    invoiceNumber: txn.invoice_number,
    date: txn.created_at,
    customerName: txn.customer_name,
    customerPhone: txn.customer_phone,
    customerEmail: txn.customer_email,
    customerAddress: txn.customer_address,
    paymentMethod: txn.payment_method,
    items: [],
    subtotal: txn.subtotal,
    tax: txn.tax,
    total: txn.total,
    commissionRate: 0,
    commissions: [],
    platformCommission: 0,
    status: txn.status,
  } as any;
}

// =========== VOUCHERS ===========

export interface WifiVoucher {
  id: string;
  transactionId: string;
  buyerId: string;
  planId: string;
  planName: string;
  tier: string;
  durationHours: number;
  speedMbps: number;
  mikrotikProfile: string;
  code: string | null;
  password: string | null;
  status: string;
  pushedMikrotik: boolean;
  expiresAt: string | null;
  createdAt: string;
}

function mapVoucher(v: any): WifiVoucher {
  return {
    id: v.id,
    transactionId: v.transaction_id,
    buyerId: v.buyer_id,
    planId: v.plan_id,
    planName: v.plan_name,
    tier: v.tier,
    durationHours: v.duration_hours,
    speedMbps: v.speed_mbps,
    mikrotikProfile: v.mikrotik_profile,
    code: v.code || null,
    password: v.password || null,
    status: v.status,
    pushedMikrotik: !!v.pushed_mikrotik,
    expiresAt: v.expires_at || null,
    createdAt: v.created_at,
  };
}

export function generateVoucherCode(): { code: string; password: string } {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = (n: number) => Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  const code = `LDCT-${rand(4)}-${rand(4)}`;
  const password = rand(6);
  return { code, password };
}

export async function getVoucherByTransaction(transactionId: string): Promise<WifiVoucher | null> {
  const { data } = await supabase.from('wifi_vouchers')
    .select('*')
    .eq('transaction_id', transactionId)
    .maybeSingle();
  return data ? mapVoucher(data) : null;
}

export async function getMyVouchers(buyerId: string): Promise<WifiVoucher[]> {
  const { data } = await supabase.from('wifi_vouchers')
    .select('*')
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });
  return (data || []).map(mapVoucher);
}

export async function getAdminVouchers(): Promise<WifiVoucher[]> {
  const { data } = await supabase.from('wifi_vouchers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  return (data || []).map(mapVoucher);
}

export async function approveVoucher(transactionId: string): Promise<{ ok: boolean; error?: string }> {
  const voucher = await getVoucherByTransaction(transactionId);
  if (!voucher) return { ok: false, error: 'no_voucher' };
  if (voucher.status !== 'pending') return { ok: true };

  const { code, password } = generateVoucherCode();

  const { data, error } = await supabase.rpc('admin_generate_voucher', {
    p_voucher_id: voucher.id,
    p_code: code,
    p_password: password,
    p_duration_hours: voucher.durationHours,
  });
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'voucher_generation_failed' };

  // Push optionnel vers MikroTik (ne bloque pas si non configuré)
  try {
    const res = await fetch('/api/wifi/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        password,
        profile: voucher.mikrotikProfile,
        durationHours: voucher.durationHours,
      }),
    });
    const r = await res.json().catch(() => ({}));
    if (r.pushed) {
      await supabase.from('wifi_vouchers').update({ pushed_mikrotik: true }).eq('id', voucher.id);
    }
  } catch {
    // silencieux : l'admin peut importer manuellement
  }

  return { ok: true };
}
