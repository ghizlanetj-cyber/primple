CREATE TABLE IF NOT EXISTS public.crm_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.crm_settings TO service_role;
ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.crm_settings(key, value) VALUES ('sync_since', now()::text) ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.order_ops (
  order_id uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  ops_stage text NOT NULL DEFAULT 'new' CHECK (ops_stage IN ('new','payment_confirmed','file_verification','bat_approved','in_production','finishing','ready','shipped','delivered','cancelled','refunded')),
  internal_notes text,
  supplier text,
  cost_mad numeric,
  delivery_notes text,
  production_notes text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.order_ops TO service_role;
ALTER TABLE public.order_ops ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.message_meta (
  message_id uuid PRIMARY KEY REFERENCES public.contact_messages(id) ON DELETE CASCADE,
  classification text NOT NULL DEFAULT 'unclassified' CHECK (classification IN ('unclassified','quote','sales','support','spam')),
  quote_stage text NOT NULL DEFAULT 'new' CHECK (quote_stage IN ('new','qualified','proposal','negotiation','won','lost')),
  related_user_id uuid,
  related_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  is_read boolean NOT NULL DEFAULT false,
  classified_by text NOT NULL DEFAULT 'system',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.message_meta TO service_role;
ALTER TABLE public.message_meta ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.crm_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('contact','deal')),
  source_table text NOT NULL CHECK (source_table IN ('profiles','orders','shop_orders','contact_messages')),
  source_id uuid NOT NULL,
  version integer NOT NULL DEFAULT 1,
  processed_version integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','failed','dead','blocked')),
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  lease_owner uuid,
  lease_expires_at timestamptz,
  claimed_version integer,
  last_error_code text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, source_table, source_id)
);
CREATE INDEX IF NOT EXISTS crm_outbox_due_idx ON public.crm_outbox (status, next_attempt_at);
GRANT ALL ON public.crm_outbox TO service_role;
ALTER TABLE public.crm_outbox ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.crm_mappings (
  entity_type text NOT NULL,
  source_table text NOT NULL,
  source_id uuid NOT NULL,
  zoho_id text NOT NULL,
  zoho_account_id text,
  synced_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_type, source_table, source_id)
);
GRANT ALL ON public.crm_mappings TO service_role;
ALTER TABLE public.crm_mappings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.crm_sync_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outbox_id uuid REFERENCES public.crm_outbox(id) ON DELETE CASCADE,
  at timestamptz NOT NULL DEFAULT now(),
  ok boolean NOT NULL,
  http_status integer,
  error_code text,
  summary text
);
GRANT ALL ON public.crm_sync_attempts TO service_role;
ALTER TABLE public.crm_sync_attempts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.crm_enqueue_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  at timestamptz NOT NULL DEFAULT now(),
  source_table text,
  source_id uuid,
  error_code text
);
GRANT ALL ON public.crm_enqueue_errors TO service_role;
ALTER TABLE public.crm_enqueue_errors ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.crm_enqueue(_entity text, _table text, _id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.crm_outbox(entity_type, source_table, source_id)
  VALUES (_entity, _table, _id)
  ON CONFLICT (entity_type, source_table, source_id) DO UPDATE
    SET version = crm_outbox.version + 1,
        status = CASE WHEN crm_outbox.status = 'processing' THEN 'processing' ELSE 'pending' END,
        attempts = CASE WHEN crm_outbox.status = 'processing' THEN crm_outbox.attempts ELSE 0 END,
        next_attempt_at = now(),
        updated_at = now();
EXCEPTION WHEN OTHERS THEN
  BEGIN
    INSERT INTO public.crm_enqueue_errors(source_table, source_id, error_code) VALUES (_table, _id, SQLSTATE);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

CREATE OR REPLACE FUNCTION public.crm_trg_profiles()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email <> '' AND (TG_OP = 'INSERT' OR NEW.email IS DISTINCT FROM OLD.email OR NEW.full_name IS DISTINCT FROM OLD.full_name) THEN
    PERFORM public.crm_enqueue('contact', 'profiles', NEW.id);
  END IF;
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.crm_trg_orders()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE confirmed boolean;
BEGIN
  IF coalesce(NEW.email, NEW.guest_email, '') <> '' AND (TG_OP = 'INSERT' OR NEW.email IS DISTINCT FROM OLD.email OR NEW.contact_name IS DISTINCT FROM OLD.contact_name) THEN
    PERFORM public.crm_enqueue('contact', 'orders', NEW.id);
  END IF;
  confirmed := NEW.payment_status = 'paid' OR NEW.deposit_paid;
  IF TG_OP = 'UPDATE' AND confirmed AND NOT (OLD.payment_status = 'paid' OR OLD.deposit_paid) THEN
    PERFORM public.crm_enqueue('contact', 'orders', NEW.id);
    PERFORM public.crm_enqueue('deal', 'orders', NEW.id);
    INSERT INTO public.order_ops(order_id, ops_stage) VALUES (NEW.id, 'payment_confirmed')
      ON CONFLICT (order_id) DO UPDATE SET ops_stage = 'payment_confirmed', updated_at = now() WHERE order_ops.ops_stage = 'new';
  END IF;
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.crm_trg_shop_orders()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'paid' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'paid') THEN
    PERFORM public.crm_enqueue('contact', 'shop_orders', NEW.id);
    PERFORM public.crm_enqueue('deal', 'shop_orders', NEW.id);
  END IF;
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.crm_trg_contact_messages()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.message_meta(message_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.crm_trg_message_meta()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.classification IN ('quote','sales') AND (TG_OP = 'INSERT' OR NEW.classification IS DISTINCT FROM OLD.classification OR NEW.quote_stage IS DISTINCT FROM OLD.quote_stage) THEN
    PERFORM public.crm_enqueue('contact', 'contact_messages', NEW.message_id);
    PERFORM public.crm_enqueue('deal', 'contact_messages', NEW.message_id);
  END IF;
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS crm_profiles_sync ON public.profiles;
CREATE TRIGGER crm_profiles_sync AFTER INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.crm_trg_profiles();
DROP TRIGGER IF EXISTS crm_orders_sync ON public.orders;
CREATE TRIGGER crm_orders_sync AFTER INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.crm_trg_orders();
DROP TRIGGER IF EXISTS crm_shop_orders_sync ON public.shop_orders;
CREATE TRIGGER crm_shop_orders_sync AFTER INSERT OR UPDATE ON public.shop_orders FOR EACH ROW EXECUTE FUNCTION public.crm_trg_shop_orders();
DROP TRIGGER IF EXISTS crm_contact_messages_meta ON public.contact_messages;
CREATE TRIGGER crm_contact_messages_meta AFTER INSERT ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.crm_trg_contact_messages();
DROP TRIGGER IF EXISTS crm_message_meta_sync ON public.message_meta;
CREATE TRIGGER crm_message_meta_sync AFTER INSERT OR UPDATE ON public.message_meta FOR EACH ROW EXECUTE FUNCTION public.crm_trg_message_meta();

INSERT INTO public.message_meta(message_id) SELECT id FROM public.contact_messages ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.crm_claim(_owner uuid, _limit integer DEFAULT 10, _lease_seconds integer DEFAULT 120)
RETURNS SETOF public.crm_outbox LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  UPDATE public.crm_outbox o
     SET status = 'processing', lease_owner = _owner, claimed_version = o.version,
         lease_expires_at = now() + make_interval(secs => least(greatest(_lease_seconds, 30), 600)),
         attempts = o.attempts + 1, updated_at = now()
   WHERE o.id IN (
     SELECT id FROM public.crm_outbox
      WHERE (status IN ('pending','failed') AND next_attempt_at <= now())
         OR (status = 'processing' AND lease_expires_at < now())
      ORDER BY next_attempt_at
      LIMIT least(greatest(_limit, 1), 50)
      FOR UPDATE SKIP LOCKED)
  RETURNING o.*;
END $$;

CREATE OR REPLACE FUNCTION public.crm_complete(
  _id uuid, _owner uuid, _ok boolean, _zoho_id text DEFAULT NULL, _account_id text DEFAULT NULL,
  _error_code text DEFAULT NULL, _error text DEFAULT NULL, _http integer DEFAULT NULL,
  _retry_after_seconds integer DEFAULT NULL, _terminal text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.crm_outbox; next_status text; delay integer;
BEGIN
  SELECT * INTO r FROM public.crm_outbox WHERE id = _id AND lease_owner = _owner AND status = 'processing' FOR UPDATE;
  IF NOT FOUND THEN RETURN 'lease_lost'; END IF;
  INSERT INTO public.crm_sync_attempts(outbox_id, ok, http_status, error_code, summary)
    VALUES (_id, _ok, _http, _error_code, left(_error, 300));
  IF _ok THEN
    IF _zoho_id IS NOT NULL THEN
      INSERT INTO public.crm_mappings(entity_type, source_table, source_id, zoho_id, zoho_account_id)
      VALUES (r.entity_type, r.source_table, r.source_id, _zoho_id, _account_id)
      ON CONFLICT (entity_type, source_table, source_id) DO UPDATE SET zoho_id = EXCLUDED.zoho_id,
        zoho_account_id = coalesce(EXCLUDED.zoho_account_id, crm_mappings.zoho_account_id), synced_at = now();
    END IF;
    next_status := CASE WHEN r.version > r.claimed_version THEN 'pending' ELSE 'done' END;
    UPDATE public.crm_outbox SET status = next_status, processed_version = r.claimed_version,
      attempts = CASE WHEN next_status = 'pending' THEN 0 ELSE attempts END,
      lease_owner = NULL, lease_expires_at = NULL, last_error_code = NULL, last_error = NULL,
      next_attempt_at = now(), updated_at = now() WHERE id = _id;
    RETURN next_status;
  END IF;
  IF _terminal IN ('blocked','dead') THEN
    next_status := _terminal;
  ELSIF r.attempts >= 8 THEN
    next_status := 'dead';
  ELSE
    next_status := 'failed';
  END IF;
  delay := coalesce(_retry_after_seconds, least(3600, (30 * power(2, r.attempts - 1))::int)) + floor(random() * 15)::int;
  UPDATE public.crm_outbox SET status = next_status, lease_owner = NULL, lease_expires_at = NULL,
    last_error_code = left(_error_code, 60), last_error = left(_error, 300),
    next_attempt_at = now() + make_interval(secs => delay), updated_at = now() WHERE id = _id;
  RETURN next_status;
END $$;

CREATE OR REPLACE FUNCTION public.crm_retry(_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.crm_outbox SET status = 'pending', attempts = 0, next_attempt_at = now(), updated_at = now()
   WHERE id = _id AND status IN ('failed','dead','blocked');
$$;

CREATE OR REPLACE FUNCTION public.crm_reconcile()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE since timestamptz; n integer := 0; rec record;
BEGIN
  SELECT value::timestamptz INTO since FROM public.crm_settings WHERE key = 'sync_since';
  IF since IS NULL THEN RETURN 0; END IF;
  FOR rec IN SELECT id FROM public.orders o WHERE (o.payment_status = 'paid' OR o.deposit_paid) AND o.updated_at >= since
     AND NOT EXISTS (SELECT 1 FROM public.crm_outbox x WHERE x.entity_type='deal' AND x.source_table='orders' AND x.source_id=o.id) LIMIT 100 LOOP
    PERFORM public.crm_enqueue('contact','orders',rec.id); PERFORM public.crm_enqueue('deal','orders',rec.id); n := n + 1;
  END LOOP;
  FOR rec IN SELECT id FROM public.shop_orders s WHERE s.status = 'paid' AND coalesce(s.paid_at, s.created_at) >= since
     AND NOT EXISTS (SELECT 1 FROM public.crm_outbox x WHERE x.entity_type='deal' AND x.source_table='shop_orders' AND x.source_id=s.id) LIMIT 100 LOOP
    PERFORM public.crm_enqueue('contact','shop_orders',rec.id); PERFORM public.crm_enqueue('deal','shop_orders',rec.id); n := n + 1;
  END LOOP;
  INSERT INTO public.message_meta(message_id) SELECT id FROM public.contact_messages c
    WHERE NOT EXISTS (SELECT 1 FROM public.message_meta m WHERE m.message_id = c.id) ON CONFLICT DO NOTHING;
  RETURN n;
END $$;

REVOKE ALL ON FUNCTION public.crm_enqueue(text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crm_claim(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crm_complete(uuid, uuid, boolean, text, text, text, text, integer, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crm_retry(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crm_reconcile() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crm_trg_profiles() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crm_trg_orders() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crm_trg_shop_orders() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crm_trg_contact_messages() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crm_trg_message_meta() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_enqueue(text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_claim(uuid, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_complete(uuid, uuid, boolean, text, text, text, text, integer, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_retry(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_reconcile() TO service_role;

CREATE OR REPLACE FUNCTION public.guard_order_payment_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF coalesce(auth.role(), '') NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.payment_status := 'unpaid';
    NEW.deposit_paid := false;
    NEW.paid_at := NULL;
    NEW.status := 'Order placed';
    NEW.youcanpay_token_id := NULL;
    NEW.youcanpay_transaction_id := NULL;
    NEW.claim_token := NULL;
    NEW.claimed_at := NULL;
    IF NEW.payment_method NOT IN ('card_youcanpay', 'bank_transfer', 'cashplus', 'deposit_50_cod', 'cod_advance_bank', 'cod_advance_cashplus', 'bank_transfer_50') THEN
      NEW.payment_method := 'card_youcanpay';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status
    OR NEW.payment_method IS DISTINCT FROM OLD.payment_method
    OR NEW.deposit_amount IS DISTINCT FROM OLD.deposit_amount
    OR NEW.balance_amount IS DISTINCT FROM OLD.balance_amount
    OR NEW.deposit_paid IS DISTINCT FROM OLD.deposit_paid
    OR NEW.paid_at IS DISTINCT FROM OLD.paid_at
    OR NEW.total IS DISTINCT FROM OLD.total
    OR NEW.subtotal IS DISTINCT FROM OLD.subtotal
    OR NEW.delivery IS DISTINCT FROM OLD.delivery
    OR NEW.status IS DISTINCT FROM OLD.status
    OR NEW.youcanpay_token_id IS DISTINCT FROM OLD.youcanpay_token_id
    OR NEW.youcanpay_transaction_id IS DISTINCT FROM OLD.youcanpay_transaction_id
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.items IS DISTINCT FROM OLD.items
    OR NEW.reference IS DISTINCT FROM OLD.reference
    OR NEW.claim_token IS DISTINCT FROM OLD.claim_token
    OR NEW.claimed_at IS DISTINCT FROM OLD.claimed_at
    OR NEW.guest_email IS DISTINCT FROM OLD.guest_email
  THEN
    RAISE EXCEPTION 'Payment fields can only be changed by Primple staff';
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.guard_order_files()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(auth.role(), '') NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND (NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.path IS DISTINCT FROM OLD.path
      OR NEW.bucket IS DISTINCT FROM OLD.bucket OR NEW.guest_token IS DISTINCT FROM OLD.guest_token) THEN
    RAISE EXCEPTION 'File ownership cannot be changed';
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.guest_token := NULL;
  END IF;
  IF NEW.order_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.orders o WHERE o.id = NEW.order_id AND o.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Files can only be attached to your own orders';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_order_files() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS order_files_guard ON public.order_files;
CREATE TRIGGER order_files_guard BEFORE INSERT OR UPDATE ON public.order_files FOR EACH ROW EXECUTE FUNCTION public.guard_order_files();

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$ BEGIN
  PERFORM cron.unschedule('primple-crm-reconcile') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'primple-crm-reconcile');
  PERFORM cron.schedule('primple-crm-reconcile', '0 * * * *', 'SELECT public.crm_reconcile();');
END $$;