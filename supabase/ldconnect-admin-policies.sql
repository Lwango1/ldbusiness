-- ============================================================
-- LDConnect : gestion des forfaits par l'admin via la table
-- (sans fonctions RPC) - À exécuter dans SQL Editor
-- ============================================================

-- 1. Fonction utilitaire : est-ce un admin ?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 2. Lecture : les utilisateurs connectés voient tous les forfaits (actifs et inactifs)
DROP POLICY IF EXISTS ldconnect_plans_auth_read ON public.ldconnect_plans;
CREATE POLICY ldconnect_plans_auth_read ON public.ldconnect_plans
  FOR SELECT TO authenticated USING (true);

-- 3. Admin : créer / modifier / supprimer des forfaits
DROP POLICY IF EXISTS ldconnect_plans_admin_insert ON public.ldconnect_plans;
CREATE POLICY ldconnect_plans_admin_insert ON public.ldconnect_plans
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS ldconnect_plans_admin_update ON public.ldconnect_plans;
CREATE POLICY ldconnect_plans_admin_update ON public.ldconnect_plans
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS ldconnect_plans_admin_delete ON public.ldconnect_plans;
CREATE POLICY ldconnect_plans_admin_delete ON public.ldconnect_plans
  FOR DELETE TO authenticated USING (public.is_admin());