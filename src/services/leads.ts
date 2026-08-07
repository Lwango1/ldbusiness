import { supabase } from '../lib/supabase';
import { createTransaction } from './database';
import type { CartItem } from '../types';

export interface Agent {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  code: string;
  commissionRate: number;
  leadsCount: number;
  salesCount: number;
  totalEarned: number;
  paidOut: number;
  status: 'active' | 'pending';
  createdAt: string;
}

export interface Lead {
  id: string;
  agentId: string;
  name: string;
  phone: string;
  source?: string;
  status: 'new' | 'contacted' | 'converted' | 'lost';
  createdAt: string;
}

const REF_KEY = 'ldbusiness_referral';
const AGENT_KEY = 'ldbusiness_agent_id';

// =========== REFERRAL (capture du code agent) ===========

export function getReferralCode(): string {
  return localStorage.getItem(REF_KEY) || '';
}

export function setReferralCode(code: string) {
  localStorage.setItem(REF_KEY, code.trim().toUpperCase());
}

export function clearReferralCode() {
  localStorage.removeItem(REF_KEY);
}

// =========== AGENTS ===========

export function generateAgentCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function registerAgent(userId: string, name: string, phone: string): Promise<Agent | null> {
  let code = generateAgentCode();
  let attempts = 0;
  while (await getAgentByCode(code) && attempts < 10) { code = generateAgentCode(); attempts++; }

  const { data, error } = await supabase.from('agents').insert({
    user_id: userId,
    name,
    phone,
    code,
    commission_rate: 10,
    status: 'active',
  }).select().single();

  if (error || !data) {
    console.error('registerAgent error:', error);
    return null;
  }
  return mapAgent(data);
}

export async function getAgentByCode(code: string): Promise<Agent | null> {
  const { data } = await supabase.from('agents').select('*').eq('code', code.trim().toUpperCase()).maybeSingle();
  return data ? mapAgent(data) : null;
}

export async function getAgentByUserId(userId: string): Promise<Agent | null> {
  const { data } = await supabase.from('agents').select('*').eq('user_id', userId).maybeSingle();
  return data ? mapAgent(data) : null;
}

export const getLead = getAgentByUserId;

export async function getAllAgents(): Promise<Agent[]> {
  const { data } = await supabase.from('agents').select('*').order('created_at', { ascending: false });
  return (data || []).map(mapAgent);
}

export function setSessionAgentId(id: string) {
  localStorage.setItem(AGENT_KEY, id);
}

export function getSessionAgentId(): string | null {
  return localStorage.getItem(AGENT_KEY);
}

// =========== LEADS ===========

export async function addLead(agentId: string, data: { name: string; phone: string; source?: string }): Promise<void> {
  const { error } = await supabase.from('leads').insert({
    agent_id: agentId,
    name: data.name,
    phone: data.phone,
    source: data.source || null,
    status: 'new',
  });
  if (error) console.error('addLead error:', error);

  const { error: cntErr } = await supabase.rpc('increment_agent_leads', { p_agent_id: agentId });
  if (cntErr) console.error('increment_agent_leads error:', cntErr);
}

export async function getLeadsByAgent(agentId: string): Promise<Lead[]> {
  const { data } = await supabase.from('leads').select('*').eq('agent_id', agentId).order('created_at', { ascending: false });
  return (data || []).map(mapLead);
}

export async function getAllLeads(): Promise<Lead[]> {
  const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
  return (data || []).map(mapLead);
}

export async function updateLeadStatus(id: string, status: Lead['status']): Promise<void> {
  await supabase.from('leads').update({ status }).eq('id', id);
}

// =========== COMMISSIONS ===========

export async function recordAgentCommission(agentId: string, amount: number): Promise<void> {
  const { error } = await supabase.rpc('add_agent_earnings', { p_agent_id: agentId, p_amount: amount });
  if (error) console.error('add_agent_earnings error:', error);
}

export async function payoutAgent(agentId: string, amount: number): Promise<boolean> {
  const { error } = await supabase.rpc('agent_payout', { p_agent_id: agentId, p_amount: amount });
  return !error;
}

export async function getLeadsByAgentIds(agentIds: string[]): Promise<Lead[]> {
  if (agentIds.length === 0) return [];
  const { data } = await supabase.from('leads').select('*').in('agent_id', agentIds).order('created_at', { ascending: false });
  return (data || []).map(mapLead);
}

// Crée la transaction et crédite la commission à l'agent référent de l'acheteur
export async function createSaleWithAgentReferral(opts: {
  buyerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  paymentMethod: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}): Promise<{ ok: boolean; txnId?: string }> {
  const refCode = getReferralCode();
  if (!refCode) {
    return { ok: false };
  }
  const agent = await getAgentByCode(refCode);
  if (!agent) {
    clearReferralCode();
    return { ok: false };
  }

  const txn = await createTransaction(opts);
  if (!txn) return { ok: false };

  const commission = Math.round(opts.total * agent.commissionRate / 100);
  await recordAgentCommission(agent.id, commission);
  await supabase.from('leads').insert({
    agent_id: agent.id,
    name: opts.customerName,
    phone: opts.customerPhone,
    source: 'purchase',
    status: 'converted',
  });
  await supabase.rpc('increment_agent_sales', { p_agent_id: agent.id });
  clearReferralCode();
  return { ok: true, txnId: txn.id };
}

function mapAgent(a: any): Agent {
  return {
    id: a.id,
    userId: a.user_id,
    name: a.name,
    phone: a.phone,
    code: a.code,
    commissionRate: a.commission_rate || 10,
    leadsCount: a.leads_count || 0,
    salesCount: a.sales_count || 0,
    totalEarned: a.total_earned || 0,
    paidOut: a.paid_out || 0,
    status: a.status || 'pending',
    createdAt: a.created_at,
  };
}

function mapLead(l: any): Lead {
  return {
    id: l.id,
    agentId: l.agent_id,
    name: l.name,
    phone: l.phone,
    source: l.source,
    status: l.status,
    createdAt: l.created_at,
  };
}
