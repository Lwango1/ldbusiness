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

CREATE OR REPLACE FUNCTION public.admin_delete_subscription(sub_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM public.subscriptions WHERE id = sub_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Autoriser les utilisateurs authentifiés à appeler ces fonctions
GRANT EXECUTE ON FUNCTION public.admin_approve_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_subscription TO authenticated;
