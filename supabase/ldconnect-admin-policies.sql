-- ============================================================
-- LDConnect : gestion des forfaits par les utilisateurs connectés
-- (remplace les politiques "admin uniquement")
-- À exécuter dans : Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. Lecture : les utilisateurs connectés voient tous les forfaits
DROP POLICY IF EXISTS ldconnect_plans_auth_read ON public.ldconnect_plans;
CREATE POLICY ldconnect_plans_auth_read ON public.ldconnect_plans
  FOR SELECT TO authenticated USING (true);

-- 2. Créer / modifier / supprimer (toute personne connectée qui gère via l'admin PIN)
DROP POLICY IF EXISTS ldconnect_plans_admin_insert ON public.ldconnect_plans;
CREATE POLICY ldconnect_plans_admin_insert ON public.ldconnect_plans
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS ldconnect_plans_admin_update ON public.ldconnect_plans;
CREATE POLICY ldconnect_plans_admin_update ON public.ldconnect_plans
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS ldconnect_plans_admin_delete ON public.ldconnect_plans;
CREATE POLICY ldconnect_plans_admin_delete ON public.ldconnect_plans
  FOR DELETE TO authenticated USING (true);