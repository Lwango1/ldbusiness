import { supabase } from '../lib/supabase';
import { KeepGoPlan, planPriceCdf } from '../data/keepgo';
import { Transaction } from '../types';

export interface KeepGoPlanRow extends KeepGoPlan {
  active: boolean;
  sort: number;
}

function mapRow(r: any): KeepGoPlanRow {
  return {
    id: r.id,
    name: r.name,
    zone: r.zone,
    dataGb: Number(r.data_gb || 0),
    validityDays: Number(r.validity_days || 0),
    priceUsd: Number(r.price_usd || 0),
    priceCdf: r.price_cdf != null ? Number(r.price_cdf) : null,
    features: r.features || [],
    popular: !!r.popular,
    keepgoUrl: r.keepgo_url || '',
    active: !!r.active,
    sort: Number(r.sort || 0),
  };
}

export async function getKeepGoPlans(): Promise<KeepGoPlanRow[]> {
  let { data } = await (supabase.from('keepgo_plans') as any)
    .select('*')
    .eq('active', true)
    .order('sort', { ascending: true });

  if (!data || data.length === 0) {
    await supabase.rpc('ensure_keepgo_defaults');
    const { data: d2 } = await (supabase.from('keepgo_plans') as any)
      .select('*')
      .eq('active', true)
      .order('sort', { ascending: true });
    data = d2;
  }

  return (data || []).map(mapRow);
}

export async function getAdminKeepGoPlans(): Promise<KeepGoPlanRow[]> {
  const { data } = await (supabase.from('keepgo_plans') as any)
    .select('*')
    .order('sort', { ascending: true });
  return (data || []).map(mapRow);
}

export async function adminSaveKeepGoPlan(
  plan: KeepGoPlan,
  active: boolean,
  sort: number
): Promise<boolean> {
  const { error } = await supabase.rpc('admin_upsert_keepgo_plan', {
    p_id: plan.id,
    p_name: plan.name,
    p_zone: plan.zone,
    p_data_gb: plan.dataGb,
    p_validity_days: plan.validityDays,
    p_price_usd: plan.priceUsd,
    p_price_cdf: plan.priceCdf ?? null,
    p_features: plan.features,
    p_popular: plan.popular,
    p_keepgo_url: plan.keepgoUrl,
    p_sort: sort,
    p_active: active,
  });
  if (error) console.error('adminSaveKeepGoPlan error:', error.message);
  return !error;
}

export async function adminDeleteKeepGoPlan(id: string): Promise<boolean> {
  const { error } = await supabase.rpc('admin_delete_keepgo_plan', { p_id: id });
  if (error) console.error('adminDeleteKeepGoPlan error:', error.message);
  return !error;
}

// =========== COMMANDE ===========

export interface KeepGoOrderInput {
  buyerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  plan: KeepGoPlan;
}

export async function createKeepGoOrder(data: KeepGoOrderInput): Promise<Transaction | null> {
  const price = planPriceCdf(data.plan);
  const invoiceNumber = `KG-${Date.now().toString(36).toUpperCase()}`;

  const { data: txn, error } = await supabase.from('transactions').insert({
    buyer_id: data.buyerId,
    invoice_number: invoiceNumber,
    customer_name: data.customerName,
    customer_phone: data.customerPhone,
    customer_email: data.customerEmail || null,
    customer_address: 'Commande eSIM KeepGo',
    payment_method: 'maxicash',
    subtotal: price,
    tax: 0,
    total: price,
    commission_rate: 0,
    platform_commission: 0,
    status: 'pending',
  }).select().single();

  if (error || !txn) {
    console.error('createKeepGoOrder error:', error?.message);
    return null;
  }

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