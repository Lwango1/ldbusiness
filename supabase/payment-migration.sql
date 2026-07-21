-- Ajouter les colonnes pour le suivi de paiement
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS screenshot_url TEXT;

-- Mettre à jour le CHECK pour inclure les nouveaux statuts
ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_status_check;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_status_check
  CHECK (status IN ('pending', 'pending_verification', 'completed', 'cancelled'));
