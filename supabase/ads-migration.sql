CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL,
  brand_logo TEXT,
  brand_website TEXT,
  image_url TEXT NOT NULL,
  description TEXT,
  zone TEXT NOT NULL CHECK (zone IN ('hero', 'between_products', 'popup', 'sidebar')),
  frequency TEXT NOT NULL DEFAULT 'hourly' CHECK (frequency IN ('hourly', 'daily_5', 'daily_10', 'daily_20')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_ads" ON public.ads
  FOR ALL USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "anyone_view_approved_ads" ON public.ads
  FOR SELECT USING (status = 'approved');

CREATE POLICY "anyone_create_ad_request" ON public.ads
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_ads_zone ON public.ads(zone);
CREATE INDEX idx_ads_status ON public.ads(status);
