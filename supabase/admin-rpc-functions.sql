-- Fonctions admin SECURITY DEFINER pour contourner la RLS

-- Abonnements
CREATE OR REPLACE FUNCTION public.admin_approve_subscription(sub_id UUID, tx_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.subscriptions
  SET status = 'active', transaction_id = tx_id, start_date = now()
  WHERE id = sub_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_reject_subscription(sub_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.subscriptions
  SET status = 'cancelled'
  WHERE id = sub_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_delete_subscription(sub_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM public.subscriptions WHERE id = sub_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Publicités
CREATE OR REPLACE FUNCTION public.admin_approve_ad(ad_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.ads
  SET status = 'approved', start_date = now()
  WHERE id = ad_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_reject_ad(ad_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.ads
  SET status = 'rejected'
  WHERE id = ad_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_delete_ad(ad_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM public.ads WHERE id = ad_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Création de pub (contourne le cache schema PostgREST)
CREATE OR REPLACE FUNCTION public.create_ad_request(
  p_user_id UUID,
  p_brand_name TEXT,
  p_image_url TEXT,
  p_zone TEXT,
  p_frequency TEXT,
  p_brand_website TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.ads (user_id, brand_name, brand_website, image_url, description, zone, frequency)
  VALUES (p_user_id, p_brand_name, p_brand_website, p_image_url, p_description, p_zone, p_frequency);
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Lister toutes les pubs (admin)
CREATE OR REPLACE FUNCTION public.admin_get_all_ads()
RETURNS SETOF public.ads AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.ads ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Récupérer les pubs approuvées par zone (pour affichage public)
CREATE OR REPLACE FUNCTION public.get_approved_ads(p_zone TEXT DEFAULT NULL)
RETURNS SETOF public.ads AS $$
BEGIN
  IF p_zone IS NULL THEN
    RETURN QUERY SELECT * FROM public.ads WHERE status = 'approved' ORDER BY created_at DESC;
  ELSE
    RETURN QUERY SELECT * FROM public.ads WHERE status = 'approved' AND zone = p_zone ORDER BY created_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Incrémenter les impressions
CREATE OR REPLACE FUNCTION public.increment_ad_impression(ad_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.ads SET impressions = impressions + 1 WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_approve_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_ad TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_ad TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_ad TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_ad_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_all_ads TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_approved_ads TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_ad_impression TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_approved_ads TO anon;
GRANT EXECUTE ON FUNCTION public.increment_ad_impression TO anon;
