-- ============================================================
-- LDConnect : WIFI ZONE - catalogue forfaits + vouchers MikroTik
-- À exécuter dans : Supabase Dashboard -> SQL Editor
-- Remplace l'ancien module eSIM KeepGo (/connexions)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Forfaits WiFi LDConnect (durée + palier de vitesse)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ldconnect_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'bronze',      -- bronze | argent | or
  speed_mbps NUMERIC NOT NULL DEFAULT 3,     -- vitesse maximale (Mbps)
  duration_hours INT NOT NULL DEFAULT 1,     -- durée en heures (1, 6, 24, 168, 720)
  price_usd NUMERIC NOT NULL DEFAULT 0,
  price_cdf BIGINT,
  features TEXT[] NOT NULL DEFAULT '{}',
  mikrotik_profile TEXT NOT NULL DEFAULT 'bronze',  -- profil MikroTik (User Manager / rate-limit)
  popular BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  sort INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ldconnect_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ldconnect_plans_public_read ON public.ldconnect_plans;
CREATE POLICY ldconnect_plans_public_read ON public.ldconnect_plans
  FOR SELECT TO anon, authenticated USING (active = true);

-- Insère les forfaits par défaut si la table est vide (appelé par la page /connexions)
CREATE OR REPLACE FUNCTION public.ensure_ldconnect_defaults()
RETURNS VOID AS $$
BEGIN
  IF (SELECT count(*) FROM public.ldconnect_plans) = 0 THEN
    INSERT INTO public.ldconnect_plans (id, name, tier, speed_mbps, duration_hours, price_usd, price_cdf, features, mikrotik_profile, popular, sort, active) VALUES
      -- BRONZE (3 Mbps)
      ('bronze-1h',  'Bronze 1 heure',   'bronze', 3, 1,  0.18,  500,   ARRAY['3 Mbps','1 heure de connexion','Valable sur toute la zone'], 'bronze-3mbps', false, 1,  true),
      ('bronze-6h',  'Bronze 6 heures',  'bronze', 3, 6,  0.70,  2000,  ARRAY['3 Mbps','6 heures de connexion','Valable sur toute la zone'], 'bronze-3mbps', false, 2,  true),
      ('bronze-1d',  'Bronze 1 jour',    'bronze', 3, 24, 1.75,  5000,  ARRAY['3 Mbps','24 heures de connexion','Valable sur toute la zone'], 'bronze-3mbps', false, 3,  true),
      ('bronze-7d',  'Bronze 7 jours',   'bronze', 3, 168, 7.00, 20000, ARRAY['3 Mbps','7 jours de connexion','Valable sur toute la zone'], 'bronze-3mbps', true,  4,  true),
      ('bronze-30d', 'Bronze 30 jours',  'bronze', 3, 720, 21.00, 60000,ARRAY['3 Mbps','30 jours de connexion','Valable sur toute la zone'], 'bronze-3mbps', false, 5,  true),
      -- ARGENT (8 Mbps)
      ('argent-1h',  'Argent 1 heure',   'argent', 8, 1,  0.35,  1000,  ARRAY['8 Mbps','1 heure de connexion','Valable sur toute la zone'], 'argent-8mbps', false, 6,  true),
      ('argent-6h',  'Argent 6 heures',  'argent', 8, 6,  1.40,  4000,  ARRAY['8 Mbps','6 heures de connexion','Valable sur toute la zone'], 'argent-8mbps', false, 7,  true),
      ('argent-1d',  'Argent 1 jour',    'argent', 8, 24, 3.50,  10000, ARRAY['8 Mbps','24 heures de connexion','Valable sur toute la zone'], 'argent-8mbps', false, 8,  true),
      ('argent-7d',  'Argent 7 jours',   'argent', 8, 168, 12.00, 35000,ARRAY['8 Mbps','7 jours de connexion','Valable sur toute la zone'], 'argent-8mbps', true,  9,  true),
      ('argent-30d', 'Argent 30 jours',  'argent', 8, 720, 35.00, 100000,ARRAY['8 Mbps','30 jours de connexion','Valable sur toute la zone'], 'argent-8mbps', false, 10, true),
      -- OR (20 Mbps)
      ('or-1h',      'Or 1 heure',       'or', 20, 1,  0.70,  2000,  ARRAY['20 Mbps','1 heure de connexion','Valable sur toute la zone'], 'or-20mbps', false, 11, true),
      ('or-6h',      'Or 6 heures',      'or', 20, 6,  2.80,  8000,  ARRAY['20 Mbps','6 heures de connexion','Valable sur toute la zone'], 'or-20mbps', false, 12, true),
      ('or-1d',      'Or 1 jour',        'or', 20, 24, 7.00,  20000, ARRAY['20 Mbps','24 heures de connexion','Valable sur toute la zone'], 'or-20mbps', false, 13, true),
      ('or-7d',      'Or 7 jours',       'or', 20, 168, 21.00, 60000,ARRAY['20 Mbps','7 jours de connexion','Valable sur toute la zone'], 'or-20mbps', true,  14, true),
      ('or-30d',     'Or 30 jours',      'or', 20, 720, 53.00, 150000,ARRAY['20 Mbps','30 jours de connexion','Valable sur toute la zone'], 'or-20mbps', false, 15, true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.ensure_ldconnect_defaults() TO anon, authenticated;

-- Admin : crée ou met à jour un forfait
CREATE OR REPLACE FUNCTION public.admin_upsert_ldconnect_plan(
  p_id TEXT,
  p_name TEXT,
  p_tier TEXT,
  p_speed_mbps NUMERIC,
  p_duration_hours INT,
  p_price_usd NUMERIC,
  p_price_cdf BIGINT,
  p_features TEXT[],
  p_mikrotik_profile TEXT,
  p_popular BOOLEAN,
  p_sort INT,
  p_active BOOLEAN
) RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.ldconnect_plans (id, name, tier, speed_mbps, duration_hours, price_usd, price_cdf, features, mikrotik_profile, popular, sort, active)
  VALUES (p_id, p_name, p_tier, p_speed_mbps, p_duration_hours, p_price_usd, p_price_cdf, p_features, p_mikrotik_profile, p_popular, p_sort, p_active)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    tier = EXCLUDED.tier,
    speed_mbps = EXCLUDED.speed_mbps,
    duration_hours = EXCLUDED.duration_hours,
    price_usd = EXCLUDED.price_usd,
    price_cdf = EXCLUDED.price_cdf,
    features = EXCLUDED.features,
    mikrotik_profile = EXCLUDED.mikrotik_profile,
    popular = EXCLUDED.popular,
    sort = EXCLUDED.sort,
    active = EXCLUDED.active;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_upsert_ldconnect_plan(TEXT, TEXT, TEXT, NUMERIC, INT, NUMERIC, BIGINT, TEXT[], TEXT, BOOLEAN, INT, BOOLEAN) TO authenticated;

-- Admin : supprime un forfait
CREATE OR REPLACE FUNCTION public.admin_delete_ldconnect_plan(p_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM public.ldconnect_plans WHERE id = p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_delete_ldconnect_plan(TEXT) TO authenticated;

-- ------------------------------------------------------------
-- 2. Vouchers WiFi (générés lors de la validation d'un paiement)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wifi_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT NOT NULL UNIQUE,      -- facture LDC-...
  buyer_id UUID NOT NULL,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'bronze',
  duration_hours INT NOT NULL DEFAULT 1,
  speed_mbps NUMERIC NOT NULL DEFAULT 3,
  mikrotik_profile TEXT NOT NULL DEFAULT 'bronze',
  code TEXT,                                -- identifiant / nom utilisateur (ex: LDCT-AB12-CD34)
  password TEXT,                            -- mot de passe (ex: 7K3P9Q)
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | generated | delivered | used
  pushed_mikrotik BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.wifi_vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wifi_vouchers_owner_read ON public.wifi_vouchers;
CREATE POLICY wifi_vouchers_owner_read ON public.wifi_vouchers
  FOR SELECT TO authenticated USING (buyer_id = auth.uid());

DROP POLICY IF EXISTS wifi_vouchers_insert_owner ON public.wifi_vouchers;
CREATE POLICY wifi_vouchers_insert_owner ON public.wifi_vouchers
  FOR INSERT TO authenticated WITH CHECK (buyer_id = auth.uid());

-- Sécurité : seuls les admins peuvent générer / mettre à jour un voucher
CREATE OR REPLACE FUNCTION public.admin_generate_voucher(p_voucher_id UUID, p_code TEXT, p_password TEXT, p_duration_hours INT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.wifi_vouchers
  SET code = p_code,
      password = p_password,
      status = 'generated',
      generated_at = now(),
      expires_at = now() + (p_duration_hours || ' hours')::interval
  WHERE id = p_voucher_id AND status = 'pending';
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_generate_voucher(UUID, TEXT, TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_generate_voucher(UUID, TEXT, TEXT, INT) TO service_role;
