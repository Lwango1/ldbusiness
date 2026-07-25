-- Permettre à chaque utilisateur d'insérer son propre profil
CREATE POLICY "users_insert_own_profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
