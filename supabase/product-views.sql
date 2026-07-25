-- Ajouter une colonne views à la table products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Fonction RPC pour incrémenter les vues (contourne RLS)
CREATE OR REPLACE FUNCTION public.increment_product_views(p_product_id INTEGER)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.products
  SET views = COALESCE(views, 0) + 1
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- RLS pour la colonne views : les vendeurs voient leurs propres vues
DROP POLICY IF EXISTS "sellers_view_own_product_views" ON public.products;
CREATE POLICY "sellers_view_own_product_views" ON public.products
  FOR SELECT USING (auth.uid() = seller_id);
