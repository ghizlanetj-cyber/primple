ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS youcanpay_token_id text,
  ADD COLUMN IF NOT EXISTS youcanpay_transaction_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE INDEX IF NOT EXISTS orders_youcanpay_token_idx ON public.orders (youcanpay_token_id);