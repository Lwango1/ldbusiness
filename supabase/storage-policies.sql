-- ============================================================
-- LDBusiness Storage: product-images
-- Copier-coller ce SQL dans Supabase > SQL Editor > New query
-- ============================================================

-- 1. Créer le bucket (si pas déjà fait)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  false,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Lecture publique (tout le monde peut voir les images)
CREATE POLICY "public_read_product_images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 3. Insertion authentifiée (utilisateurs connectés peuvent uploader)
CREATE POLICY "authenticated_insert_product_images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- 4. Mise à jour / suppression par le propriétaire
CREATE POLICY "owner_manage_product_images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'product-images'
  AND owner = auth.uid()
);
