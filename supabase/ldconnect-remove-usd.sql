-- ============================================================
-- LDConnect : suppression du prix USD (ne garder que le prix CDF)
-- À exécuter dans : Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. Supprime les anciennes fonctions qui référencent price_usd
DROP FUNCTION IF EXISTS public.ensure_ldconnect_defaults();
DROP FUNCTION IF EXISTS public.admin_upsert_ldconnect_plan(TEXT, TEXT, TEXT, NUMERIC, INT, NUMERIC, BIGINT, TEXT[], TEXT, BOOLEAN, INT, BOOLEAN);

-- 2. Supprime la colonne price_usd
ALTER TABLE public.ldconnect_plans DROP COLUMN IF EXISTS price_usd;

-- 3. Recrée ensure_ldconnect_defaults sans price_usd
CREATE OR REPLACE FUNCTION public.ensure_ldconnect_defaults()
RETURNS VOID AS $$
BEGIN
  IF (SELECT count(*) FROM public.ldconnect_plans) = 0 THEN
    INSERT INTO public.ldconnect_plans (id, name, tier, speed_mbps, duration_hours, price_cdf, features, mikrotik_profile, popular, sort, active) VALUES
      -- BRONZE (3 Mbps)
      ('bronze-1h',  'Bronze 1 heure',   'bronze', 3, 1,  500,   ARRAY['3 Mbps','1 heure de connexion','Valable sur toute la zone'], 'bronze-3mbps', false, 1,  true),
      ('bronze-6h',  'Bronze 6 heures',  'bronze', 3, 6,  2000,  ARRAY['3 Mbps','6 heures de connexion','Valable sur toute la zone'], 'bronze-3mbps', false, 2,  true),
      ('bronze-1d',  'Bronze 1 jour',    'bronze', 3, 24, 5000,  ARRAY['3 Mbps','24 heures de connexion','Valable sur toute la zone'], 'bronze-3mbps', false, 3,  true),
      ('bronze-7d',  'Bronze 7 jours',   'bronze', 3, 168, 20000, ARRAY['3 Mbps','7 jours de connexion','Valable sur toute la zone'], 'bronze-3mbps', true,  4,  true),
      ('bronze-30d', 'Bronze 30 jours',  'bronze', 3, 720, 60000, ARRAY['3 Mbps','30 jours de connexion','Valable sur toute la zone'], 'bronze-3mbps', false, 5,  true),
      -- ARGENT (8 Mbps)
      ('argent-1h',  'Argent 1 heure',   'argent', 8, 1,  1000,  ARRAY['8 Mbps','1 heure de connexion','Valable sur toute la zone'], 'argent-8mbps', false, 6,  true),
      ('argent-6h',  'Argent 6 heures',  'argent', 8, 6,  4000,  ARRAY['8 Mbps','6 heures de connexion','Valable sur toute la zone'], 'argent-8mbps', false, 7,  true),
      ('argent-1d',  'Argent 1 jour',    'argent', 8, 24, 10000, ARRAY['8 Mbps','24 heures de connexion','Valable sur toute la zone'], 'argent-8mbps', false, 8,  true),
      ('argent-7d',  'Argent 7 jours',   'argent', 8, 168, 35000, ARRAY['8 Mbps','7 jours de connexion','Valable sur toute la zone'], 'argent-8mbps', true,  9,  true),
      ('argent-30d', 'Argent 30 jours',  'argent', 8, 720, 100000,ARRAY['8 Mbps','30 jours de connexion','Valable sur toute la zone'], 'argent-8mbps', false, 10, true),
      -- OR (20 Mbps)
      ('or-1h',      'Or 1 heure',       'or', 20, 1,  2000,  ARRAY['20 Mbps','1 heure de connexion','Valable sur toute la zone'], 'or-20mbps', false, 11, true),
      ('or-6h',      'Or 6 heures',      'or', 20, 6,  8000,  ARRAY['20 Mbps','6 heures de connexion','Valable sur toute la zone'], 'or-20mbps', false, 12, true),
      ('or-1d',      'Or 1 jour',        'or', 20, 24, 20000, ARRAY['20 Mbps','24 heures de connexion','Valable sur toute la zone'], 'or-20mbps', false, 13, true),
      ('or-7d',      'Or 7 jours',       'or', 20, 168, 60000, ARRAY['20 Mbps','7 jours de connexion','Valable sur toute la zone'], 'or-20mbps', true,  14, true),
      ('or-30d',     'Or 30 jours',      'or', 20, 720, 150000,ARRAY['20 Mbps','30 jours de connexion','Valable sur toute la zone'], 'or-20mbps', false, 15, true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.ensure_ldconnect_defaults() TO anon, authenticated;

-- 4. Recrée admin_upsert_ldconnect_plan sans p_price_usd
CREATE OR REPLACE FUNCTION public.admin_upsert_ldconnect_plan(
  p_id TEXT,
  p_name TEXT,
  p_tier TEXT,
  p_speed_mbps NUMERIC,
  p_duration_hours INT,
  p_price_cdf BIGINT,
  p_features TEXT[],
  p_mikrotik_profile TEXT,
  p_popular BOOLEAN,
  p_sort INT,
  p_active BOOLEAN
) RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.ldconnect_plans (id, name, tier, speed_mbps, duration_hours, price_cdf, features, mikrotik_profile, popular, sort, active)
  VALUES (p_id, p_name, p_tier, p_speed_mbps, p_duration_hours, p_price_cdf, p_features, p_mikrotik_profile, p_popular, p_sort, p_active)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    tier = EXCLUDED.tier,
    speed_mbps = EXCLUDED.speed_mbps,
    duration_hours = EXCLUDED.duration_hours,
    price_cdf = EXCLUDED.price_cdf,
    features = EXCLUDED.features,
    mikrotik_profile = EXCLUDED.mikrotik_profile,
    popular = EXCLUDED.popular,
    sort = EXCLUDED.sort,
    active = EXCLUDED.active;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_upsert_ldconnect_plan(TEXT, TEXT, TEXT, NUMERIC, INT, BIGINT, TEXT[], TEXT, BOOLEAN, INT, BOOLEAN) TO authenticated;