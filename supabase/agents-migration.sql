-- =============================================
-- AGENTS DE PARRAINAGE & LEADS — Tunnel de vente
-- =============================================

-- Agents (personnes qui référencent des clients)
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  name text not null,
  phone text not null,
  code text not null unique,
  commission_rate numeric not null default 10,
  leads_count integer not null default 0,
  sales_count integer not null default 0,
  total_earned numeric not null default 0,
  paid_out numeric not null default 0,
  status text not null default 'active' check (status in ('active','pending')),
  created_at timestamptz not null default now()
);

-- Leads (clients potentiels captés par un agent)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  name text not null,
  phone text not null,
  source text,
  status text not null default 'new' check (status in ('new','contacted','converted','lost')),
  created_at timestamptz not null default now()
);

-- Fonctions RPC ----------
create or replace function public.increment_agent_leads(p_agent_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.agents set leads_count = leads_count + 1 where id = p_agent_id;
$$;

create or replace function public.increment_agent_sales(p_agent_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.agents set sales_count = sales_count + 1 where id = p_agent_id;
$$;

create or replace function public.add_agent_earnings(p_agent_id uuid, p_amount numeric)
returns void language sql security definer set search_path = public as $$
  update public.agents set total_earned = total_earned + p_amount where id = p_agent_id;
$$;

create or replace function public.agent_payout(p_agent_id uuid, p_amount numeric)
returns void language sql security definer set search_path = public as $$
  update public.agents set paid_out = paid_out + p_amount where id = p_agent_id;
$$;

-- RLS ----------
alter table public.agents enable row level security;
alter table public.leads enable row level security;

-- Agents lisibles par tous (pour valider un code de parrainage)
drop policy if exists "Agents publiques en lecture" on public.agents;
create policy "Agents publiques en lecture" on public.agents
  for select using (true);

-- User peut voir/créer son propre agent
drop policy if exists "Agents créés par l'utilisateur" on public.agents;
create policy "Agents créés par l'utilisateur" on public.agents
  for insert with check (auth.uid() = user_id);
drop policy if exists "Agent de l'utilisateur" on public.agents;
create policy "Agent de l'utilisateur" on public.agents
  for select using (auth.uid() = user_id or exists (select 1 from public.agents a where a.user_id = auth.uid() and a.id = agents.id));

-- Admin (role admin) accède à tout : via les RPC security definer + policy admin
drop policy if exists "Admins accès total agents" on public.agents;
create policy "Admins accès total agents" on public.agents
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Leads: l'agent voit ses leads ; admin voit tout
drop policy if exists "Agent voit ses leads" on public.leads;
create policy "Agent voit ses leads" on public.leads
  for select using (exists (select 1 from public.agents a where a.id = leads.agent_id and a.user_id = auth.uid()));
drop policy if exists "Insert leads" on public.leads;
create policy "Insert leads" on public.leads
  for insert with check (exists (select 1 from public.agents a where a.id = leads.agent_id and a.user_id = auth.uid()));
drop policy if exists "Update leads agen" on public.leads;
create policy "Update leads agen" on public.leads
  for update using (exists (select 1 from public.agents a where a.id = leads.agent_id and a.user_id = auth.uid()));
drop policy if exists "Admins accès leads" on public.leads;
create policy "Admins accès leads" on public.leads
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));