-- Correction RLS : admin peut tout faire même si son rôle est dans profiles
DROP POLICY IF EXISTS "admin_all_subscriptions" ON public.subscriptions;
CREATE POLICY "admin_all_subscriptions" ON public.subscriptions
  FOR ALL USING (
    auth.jwt()->>'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Même correction pour la table ads si besoin
DROP POLICY IF EXISTS "admin_all_ads" ON public.ads;
CREATE POLICY "admin_all_ads" ON public.ads
  FOR ALL USING (
    auth.jwt()->>'role' = 'admin'
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
