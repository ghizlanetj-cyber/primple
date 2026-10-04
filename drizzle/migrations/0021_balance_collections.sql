CREATE TABLE IF NOT EXISTS public.balance_collections (
  order_id uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE RESTRICT,
  amount numeric NOT NULL CHECK (amount >= 0),
  collected_by text NOT NULL DEFAULT 'courier',
  remitted boolean NOT NULL DEFAULT false,
  note text,
  recorded_by uuid NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.balance_collections TO service_role;
REVOKE ALL ON public.balance_collections FROM anon, authenticated;
ALTER TABLE public.balance_collections ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.balance_collections IS 'Cash balance actually collected at delivery (and whether the courier remitted it). Written only by admin server functions; delivered status alone never implies collection.';