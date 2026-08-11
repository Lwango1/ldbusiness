import { supabase } from '../lib/supabase';
import { KeepGoPlan, planPriceCdf } from '../data/keepgo';
import { Transaction } from '../types';

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