-- ============================================================
-- CATALOGUE FORFAITS eSIM KEEPGO (géré manuellement par l'admin)
-- À exécuter dans : Supabase Dashboard -> SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.keepgo_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  zone TEXT NOT NULL,
  data_gb INT NOT NULL DEFAULT 1,
  validity_days INT NOT NULL DEFAULT 7,
  price_usd NUMERIC NOT NULL DEFAULT 0,
  price_cdf BIGINT,
  features TEXT[] NOT NULL DEFAULT '{}',
  popular BOOLEAN NOT NULL DEFAULT false,
  keepgo_url TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  sort INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.keepgo_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS keepgo_plans_public_read ON public.keepgo_plans;
CREATE POLICY keepgo_plans_public_read ON public.keepgo_plans
  FOR SELECT TO anon, authenticated USING (active = true);

-- Insère les forfaits par défaut si la table est vide (appelé par la page /connexions)
CREATE OR REPLACE FUNCTION public.ensure_keepgo_defaults()
RETURNS VOID AS $$
BEGIN
  IF (SELECT count(*) FROM public.keepgo_plans) = 0 THEN
    INSERT INTO public.keepgo_plans (id, name, zone, data_gb, validity_days, price_usd, price_cdf, features, popular, keepgo_url, sort, active) VALUES
      ('congo-1gb-7d',  'RD Congo eSIM', 'RD Congo', 1, 7,  5,  NULL, ARRAY['4G LTE','QR code en 2 minutes','Plafond 1 Go'], false, 'https://www.keepgo.com/products/rd-congo-esim-prepaid-data', 1, true),
      ('congo-3gb-7d',  'RD Congo eSIM', 'RD Congo', 3, 7,  9,  NULL, ARRAY['4G LTE','QR code en 2 minutes','Plafond 3 Go'], true,  'https://www.keepgo.com/products/rd-congo-esim-prepaid-data', 2, true),
      ('africa-1gb-7d', 'Afrique eSIM', 'Afrique (22+ pays)', 1, 7,  8,  NULL, ARRAY['4G LTE','22+ pays africains','Plafond 1 Go'], false, 'https://www.keepgo.com/products/lifetime-africa-sim-card', 3, true),
      ('africa-3gb-15d','Afrique eSIM', 'Afrique (22+ pays)', 3, 15, 15, NULL, ARRAY['4G LTE','22+ pays africains','Plafond 3 Go'], true,  'https://www.keepgo.com/products/lifetime-africa-sim-card', 4, true),
      ('world-1gb-7d',  'World eSIM', 'Monde (150+ pays)', 1, 7,  10, NULL, ARRAY['4G LTE','150+ pays','Voyages et roaming'], false,   'https://www.keepgo.com/products/world-esim', 5, true),
      ('world-3gb-15d', 'World eSIM', 'Monde (150+ pays)', 3, 15, 18, NULL, ARRAY['4G LTE','150+ pays','Voyages et roaming'], false,   'https://www.keepgo.com/products/world-esim', 6, true),
      ('world-10gb-30d','World eSIM', 'Monde (150+ pays)', 10, 30, 35, NULL, ARRAY['4G LTE','150+ pays','Plafond 10 Go'], false, 'https://www.keepgo.com/products/world-esim', 7, true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.ensure_keepgo_defaults() TO anon, authenticated;

-- Admin : crée ou met à jour un forfait (SECURITY DEFINER -> contourne la RLS)
CREATE OR REPLACE FUNCTION public.admin_upsert_keepgo_plan(
  p_id TEXT,
  p_name TEXT,
  p_zone TEXT,
  p_data_gb INT,
  p_validity_days INT,
  p_price_usd NUMERIC,
  p_price_cdf BIGINT,
  p_features TEXT[],
  p_popular BOOLEAN,
  p_keepgo_url TEXT,
  p_sort INT,
  p_active BOOLEAN
) RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.keepgo_plans (id, name, zone, data_gb, validity_days, price_usd, price_cdf, features, popular, keepgo_url, sort, active)
  VALUES (p_id, p_name, p_zone, p_data_gb, p_validity_days, p_price_usd, p_price_cdf, p_features, p_popular, p_keepgo_url, p_sort, p_active)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    zone = EXCLUDED.zone,
    data_gb = EXCLUDED.data_gb,
    validity_days = EXCLUDED.validity_days,
    price_usd = EXCLUDED.price_usd,
    price_cdf = EXCLUDED.price_cdf,
    features = EXCLUDED.features,
    popular = EXCLUDED.popular,
    keepgo_url = EXCLUDED.keepgo_url,
    sort = EXCLUDED.sort,
    active = EXCLUDED.active;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_upsert_keepgo_plan(TEXT, TEXT, TEXT, INT, INT, NUMERIC, BIGINT, TEXT[], BOOLEAN, TEXT, INT, BOOLEAN) TO authenticated;

-- Admin : supprime un forfait
CREATE OR REPLACE FUNCTION public.admin_delete_keepgo_plan(p_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM public.keepgo_plans WHERE id = p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_delete_keepgo_plan(TEXT) TO authenticated;