-- ============================================================
-- LDBusiness Marketplace - Schema Complet
-- ============================================================

-- 1. PROFIL UTILISATEUR (extension de auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
  store_name TEXT,
  store_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. PRODUITS
CREATE TABLE public.products (
  id BIGSERIAL PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  price BIGINT NOT NULL,
  currency TEXT DEFAULT 'CDF',
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CATÉGORIES
CREATE TABLE public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

INSERT INTO public.categories (name, slug) VALUES
  ('Tous', 'tous'),
  ('Robes de Soirée', 'robes-de-soiree'),
  ('Costumes Homme', 'costumes-homme'),
  ('Mariage', 'mariage'),
  ('Traditionnel', 'traditionnel'),
  ('Événements', 'evenements'),
  ('Accessoires', 'accessoires');

-- 4. PANIER
CREATE TABLE public.cart_items (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  product_id BIGINT NOT NULL REFERENCES public.products(id),
  quantity INT NOT NULL DEFAULT 1,
  selected_size TEXT,
  selected_color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TRANSACTIONS
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id),
  invoice_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  payment_method TEXT NOT NULL,
  subtotal BIGINT NOT NULL,
  tax BIGINT NOT NULL,
  total BIGINT NOT NULL,
  commission_rate DECIMAL DEFAULT 0.10,
  platform_commission BIGINT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. ARTICLES VENDUS
CREATE TABLE public.transaction_items (
  id BIGSERIAL PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id),
  product_id BIGINT NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INT NOT NULL,
  price BIGINT NOT NULL,
  seller_id UUID REFERENCES public.profiles(id),
  seller_store_name TEXT,
  commission BIGINT NOT NULL DEFAULT 0
);

-- 7. MESSAGES ACHETEUR -> VENDEUR
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id BIGINT NOT NULL REFERENCES public.products(id),
  seller_id UUID REFERENCES public.profiles(id),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id),
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  buyer_email TEXT,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  replied BOOLEAN DEFAULT false,
  reply TEXT,
  reply_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. LIVES
CREATE TABLE public.lives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.profiles(id),
  host_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Mode',
  viewer_count INT DEFAULT 0,
  is_live BOOLEAN DEFAULT true,
  room_name TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- 9. MESSAGES CHAT LIVE
CREATE TABLE public.live_chat_messages (
  id BIGSERIAL PRIMARY KEY,
  live_id UUID NOT NULL REFERENCES public.lives(id),
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_host BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

-- PROFILES: chacun peut voir son profil, les admins voient tout
CREATE POLICY "users_view_own_profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR auth.jwt()->>'role' = 'admin');

CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- PRODUCTS: tout le monde voit les produits actifs
CREATE POLICY "anyone_view_active_products" ON public.products
  FOR SELECT USING (is_active = true);

CREATE POLICY "sellers_manage_own_products" ON public.products
  FOR ALL USING (auth.uid() = seller_id);

-- CART: utilisateur voit son panier
CREATE POLICY "users_manage_own_cart" ON public.cart_items
  FOR ALL USING (auth.uid() = user_id);

-- TRANSACTIONS: acheteur voit ses transactions, admin voit tout
CREATE POLICY "buyer_view_own_transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = buyer_id OR auth.jwt()->>'role' = 'admin');

-- MESSAGES: vendeur voit ses messages, acheteur voit ses messages
CREATE POLICY "users_view_own_messages" ON public.messages
  FOR SELECT USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

CREATE POLICY "buyer_create_messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- LIVES: tout le monde voit les lives actifs
CREATE POLICY "anyone_view_active_lives" ON public.lives
  FOR SELECT USING (is_live = true OR auth.uid() = host_id);

CREATE POLICY "host_manage_own_lives" ON public.lives
  FOR ALL USING (auth.uid() = host_id);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_products_seller ON public.products(seller_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_transactions_buyer ON public.transactions(buyer_id);
CREATE INDEX idx_messages_seller ON public.messages(seller_id);
CREATE INDEX idx_lives_host ON public.lives(host_id);
CREATE INDEX idx_live_chat_live ON public.live_chat_messages(live_id);
