ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_email text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS claim_token text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS orders_claim_token_idx
  ON public.orders (claim_token)
  WHERE claim_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS orders_guest_email_idx
  ON public.orders (lower(guest_email))
  WHERE user_id IS NULL;