-- 1. Record the live privilege fix applied by the owner (idempotent).
REVOKE ALL ON TABLE public.team_members FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.team_members TO authenticated;
REVOKE ALL ON TABLE public.catalog_availability FROM PUBLIC, anon, authenticated;
-- note is internal; public may read only kind/slug/available. updated_by stays private.
GRANT SELECT (kind, slug, available) ON TABLE public.catalog_availability TO anon, authenticated;
COMMENT ON COLUMN public.catalog_availability.note IS 'Internal staff note. Never exposed publicly.';

-- 2. No client role may TRUNCATE, add TRIGGERs or MAINTAIN (LOCK/VACUUM/REINDEX) any public table.
DO $$ DECLARE t record; BEGIN
  FOR t IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'public' AND c.relkind IN ('r','p') LOOP
    EXECUTE format('REVOKE TRUNCATE, TRIGGER ON TABLE public.%I FROM PUBLIC, anon, authenticated', t.relname);
    BEGIN
      EXECUTE format('REVOKE MAINTAIN ON TABLE public.%I FROM PUBLIC, anon, authenticated', t.relname);
    EXCEPTION WHEN syntax_error OR undefined_object OR invalid_parameter_value THEN NULL;
    END;
  END LOOP;
END $$;

-- Future tables created by this migration role start without those privileges.
DO $$ BEGIN
  ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE TRUNCATE, TRIGGER ON TABLES FROM PUBLIC, anon, authenticated;
  BEGIN
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE MAINTAIN ON TABLES FROM PUBLIC, anon, authenticated;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'default privileges not changed';
END $$;

-- Append-only logs must also survive TRUNCATE.
CREATE OR REPLACE FUNCTION public.block_truncate() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'append_only'; END $$;
DROP TRIGGER IF EXISTS admin_audit_no_truncate ON public.admin_audit_log;
CREATE TRIGGER admin_audit_no_truncate BEFORE TRUNCATE ON public.admin_audit_log FOR EACH STATEMENT EXECUTE FUNCTION public.block_truncate();
DROP TRIGGER IF EXISTS admin_notes_no_truncate ON public.admin_notes;
CREATE TRIGGER admin_notes_no_truncate BEFORE TRUNCATE ON public.admin_notes FOR EACH STATEMENT EXECUTE FUNCTION public.block_truncate();

-- 3. Money: cancelled/refunded work is never outstanding. Labels never move money.
CREATE OR REPLACE FUNCTION public.admin_order_money()
RETURNS TABLE (order_id uuid, created_at timestamptz, confirmed boolean, order_value numeric, collected numeric, courier_held numeric, outstanding numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id, o.created_at,
    (o.payment_status = 'paid' OR o.deposit_paid),
    CASE WHEN o.payment_status = 'paid' OR o.deposit_paid THEN o.total ELSE 0 END,
    CASE WHEN NOT (o.payment_status = 'paid' OR o.deposit_paid) THEN 0
         ELSE (CASE WHEN o.balance_amount > 0 THEN o.deposit_amount ELSE o.total END)
              + (CASE WHEN o.balance_amount > 0 AND bc.remitted THEN bc.amount ELSE 0 END) END,
    CASE WHEN (o.payment_status = 'paid' OR o.deposit_paid) AND o.balance_amount > 0 AND bc.order_id IS NOT NULL AND NOT bc.remitted THEN bc.amount ELSE 0 END,
    CASE WHEN (o.payment_status = 'paid' OR o.deposit_paid) AND o.balance_amount > 0 AND bc.order_id IS NULL
          AND o.status <> 'Cancelled' AND coalesce(op.ops_stage,'new') NOT IN ('cancelled','refunded') THEN o.balance_amount ELSE 0 END
  FROM public.orders o
  LEFT JOIN public.balance_collections bc ON bc.order_id = o.id
  LEFT JOIN public.order_ops op ON op.order_id = o.id;
$$;
REVOKE ALL ON FUNCTION public.admin_order_money() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_order_money() TO service_role;

-- Canonical customer key per order: the account email when linked, else the order email.
CREATE OR REPLACE FUNCTION public.admin_order_customer_keys()
RETURNS TABLE (kind text, id uuid, k text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT 'print', o.id, lower(trim(coalesce(nullif(trim(p.email),''), nullif(trim(o.email),''), o.guest_email))), o.created_at
  FROM public.orders o LEFT JOIN public.profiles p ON p.id = o.user_id
  UNION ALL
  SELECT 'shop', s.id, lower(trim(coalesce(nullif(trim(p.email),''), s.customer_email))), s.created_at
  FROM public.shop_orders s LEFT JOIN public.profiles p ON p.id = s.user_id;
$$;
REVOKE ALL ON FUNCTION public.admin_order_customer_keys() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_order_customer_keys() TO service_role;

-- Customer list v2: print + shop, same keys as the detail view.
CREATE OR REPLACE FUNCTION public.admin_customers_v2(_q text, _limit int, _offset int)
RETURNS TABLE (customer_key text, name text, company text, phone text, user_id uuid, orders bigint, shop_orders bigint, order_value numeric, collected numeric, outstanding numeric, shop_value numeric, messages bigint, quotes bigint, last_activity timestamptz, total_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH ks AS (SELECT * FROM public.admin_order_customer_keys() WHERE coalesce(k,'') <> ''),
  ids AS (
    SELECT lower(trim(p.email)) k, p.id uid, p.full_name nm, NULL::text co, NULL::text ph, p.created_at at FROM public.profiles p WHERE coalesce(trim(p.email),'') <> ''
    UNION ALL SELECT ks.k, o.user_id, o.contact_name, o.company, o.phone, o.created_at FROM ks JOIN public.orders o ON ks.kind='print' AND o.id = ks.id
    UNION ALL SELECT ks.k, s.user_id, s.customer_name, NULL, s.customer_phone, s.created_at FROM ks JOIN public.shop_orders s ON ks.kind='shop' AND s.id = ks.id
    UNION ALL SELECT lower(trim(c.email)), NULL, c.name, c.company, NULL, c.created_at FROM public.contact_messages c WHERE coalesce(trim(c.email),'') <> ''
  ),
  base AS (
    SELECT k,
      (array_agg(uid ORDER BY at DESC) FILTER (WHERE uid IS NOT NULL))[1] uid,
      (array_agg(nm ORDER BY at DESC) FILTER (WHERE coalesce(nm,'') <> ''))[1] nm,
      (array_agg(co ORDER BY at DESC) FILTER (WHERE coalesce(co,'') <> ''))[1] co,
      (array_agg(ph ORDER BY at DESC) FILTER (WHERE coalesce(ph,'') <> ''))[1] ph,
      max(at) last_at
    FROM ids GROUP BY k
  ),
  om AS (SELECT ks.k, count(*) n, sum(m.order_value) v, sum(m.collected) c, sum(m.outstanding) s
         FROM ks JOIN public.admin_order_money() m ON ks.kind='print' AND m.order_id = ks.id GROUP BY 1),
  sm AS (SELECT ks.k, count(*) n, sum(CASE WHEN s.status = 'paid' AND s.currency = 'MAD' THEN s.amount_cents ELSE 0 END) / 100.0 v
         FROM ks JOIN public.shop_orders s ON ks.kind='shop' AND s.id = ks.id GROUP BY 1),
  cm AS (SELECT lower(trim(c.email)) k, count(*) n, count(*) FILTER (WHERE mm.classification IN ('quote','sales')) qn
         FROM public.contact_messages c LEFT JOIN public.message_meta mm ON mm.message_id = c.id GROUP BY 1),
  f AS (
    SELECT b.*, coalesce(om.n,0) n, coalesce(sm.n,0) sn, coalesce(om.v,0) v, coalesce(om.c,0) c, coalesce(om.s,0) s, coalesce(sm.v,0) sv, coalesce(cm.n,0) mn, coalesce(cm.qn,0) qn
    FROM base b LEFT JOIN om ON om.k = b.k LEFT JOIN sm ON sm.k = b.k LEFT JOIN cm ON cm.k = b.k
    WHERE coalesce(_q,'') = '' OR strpos(b.k, lower(_q)) > 0 OR strpos(lower(coalesce(b.nm,'')), lower(_q)) > 0
       OR strpos(lower(coalesce(b.co,'')), lower(_q)) > 0 OR strpos(coalesce(b.ph,''), _q) > 0
  )
  SELECT k, nm, co, ph, uid, n, sn, v, c, s, sv, mn, qn, last_at, count(*) OVER ()
  FROM f ORDER BY last_at DESC NULLS LAST
  LIMIT least(greatest(coalesce(_limit,25),1),100) OFFSET greatest(coalesce(_offset,0),0);
$$;
REVOKE ALL ON FUNCTION public.admin_customers_v2(text, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_customers_v2(text, int, int) TO service_role;
COMMENT ON FUNCTION public.admin_customers(text, int, int) IS 'DEPRECATED: replaced by admin_customers_v2';

-- Exact-key customer detail: totals over everything, history paginated.
CREATE OR REPLACE FUNCTION public.admin_customer_summary(_key text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT to_jsonb(r) FROM public.admin_customers_v2(NULL, 100000, 0) r WHERE r.customer_key = lower(trim(_key)) LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.admin_customer_summary(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_customer_summary(text) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_customer_orders(_key text, _limit int, _offset int)
RETURNS TABLE (kind text, id uuid, created_at timestamptz, total_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT kind, id, created_at, count(*) OVER () FROM public.admin_order_customer_keys()
  WHERE k = lower(trim(_key))
  ORDER BY created_at DESC
  LIMIT least(greatest(coalesce(_limit,20),1),100) OFFSET greatest(coalesce(_offset,0),0);
$$;
REVOKE ALL ON FUNCTION public.admin_customer_orders(text, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_customer_orders(text, int, int) TO service_role;

-- Shop orders page (safe columns are chosen by the caller; this returns ids only).
CREATE OR REPLACE FUNCTION public.admin_shop_orders_page(_q text, _status text, _limit int, _offset int)
RETURNS TABLE (shop_order_id uuid, total_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, count(*) OVER () FROM public.shop_orders s
  WHERE (coalesce(_q,'') = '' OR strpos(lower(s.reference), lower(_q)) > 0 OR strpos(lower(coalesce(s.customer_email,'')), lower(_q)) > 0
         OR strpos(lower(coalesce(s.customer_name,'')), lower(_q)) > 0 OR strpos(coalesce(s.customer_phone,''), _q) > 0)
    AND (_status IS NULL OR s.status = _status)
  ORDER BY s.created_at DESC
  LIMIT least(greatest(coalesce(_limit,25),1),100) OFFSET greatest(coalesce(_offset,0),0);
$$;
REVOKE ALL ON FUNCTION public.admin_shop_orders_page(text, text, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_shop_orders_page(text, text, int, int) TO service_role;

-- CRM counts aggregated server-side.
CREATE OR REPLACE FUNCTION public.admin_crm_counts() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(jsonb_object_agg(status, n), '{}') FROM (SELECT status, count(*) n FROM public.crm_outbox GROUP BY status) s;
$$;
REVOKE ALL ON FUNCTION public.admin_crm_counts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_crm_counts() TO service_role;

-- Manual payment confirmation with atomic audit. Admin or moderator only (team never).
CREATE OR REPLACE FUNCTION public.admin_confirm_manual_payment(_actor uuid, _order uuid, _methods text[])
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ref text; dep numeric; prev text;
BEGIN
  IF _actor IS NULL OR NOT (public.has_role(_actor, 'admin') OR public.has_role(_actor, 'moderator')) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT payment_status INTO prev FROM public.orders WHERE id = _order FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  UPDATE public.orders SET payment_status = 'paid', deposit_paid = true, paid_at = now(), updated_at = now()
  WHERE id = _order AND payment_method = ANY(_methods) AND payment_status = 'awaiting_transfer'
  RETURNING reference, deposit_amount INTO ref, dep;
  IF ref IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_key, changes)
  VALUES (_actor, 'payment.manual_confirm', 'order', _order::text,
    jsonb_build_object('payment_status', jsonb_build_object('from', prev, 'to', 'paid'), 'amount', dep));
  RETURN ref;
END $$;
REVOKE ALL ON FUNCTION public.admin_confirm_manual_payment(uuid, uuid, text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_confirm_manual_payment(uuid, uuid, text[]) TO service_role;