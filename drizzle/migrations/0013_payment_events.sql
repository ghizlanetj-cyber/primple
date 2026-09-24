CREATE TABLE public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  reference text,
  order_kind text NOT NULL DEFAULT 'print',
  event text NOT NULL,
  environment text NOT NULL,
  ok boolean NOT NULL DEFAULT true,
  youcanpay_token_id text,
  youcanpay_transaction_id text,
  http_status integer,
  detail text
);
CREATE INDEX payment_events_created_idx ON public.payment_events (created_at DESC);
CREATE INDEX payment_events_reference_idx ON public.payment_events (reference);
GRANT SELECT ON public.payment_events TO authenticated;
GRANT ALL ON public.payment_events TO service_role;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read payment events" ON public.payment_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));