CREATE TABLE public.shop_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reference text NOT NULL UNIQUE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  amount_cents bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'MAD',
  status text NOT NULL DEFAULT 'pending',
  youcanpay_token_id text,
  youcanpay_transaction_id text,
  customer_name text,
  customer_email text,
  customer_phone text,
  customer_city text,
  customer_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

GRANT SELECT ON public.shop_orders TO authenticated;
GRANT ALL ON public.shop_orders TO service_role;

ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shop orders"
  ON public.shop_orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX shop_orders_reference_idx ON public.shop_orders (reference);
CREATE INDEX shop_orders_token_idx ON public.shop_orders (youcanpay_token_id);