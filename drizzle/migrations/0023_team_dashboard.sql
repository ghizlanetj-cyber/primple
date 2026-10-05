-- Team membership (operational staff). Distinct from user_roles admin/moderator.
CREATE TABLE IF NOT EXISTS public.team_members (
  user_id uuid PRIMARY KEY,
  email text NOT NULL,
  display_name text,
  active boolean NOT NULL DEFAULT true,
  granted_by uuid,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_by uuid,
  revoked_at timestamptz
);
GRANT SELECT ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
REVOKE ALL ON public.team_members FROM anon;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members read own membership" ON public.team_members;
CREATE POLICY "Members read own membership" ON public.team_members FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Assignment + optimistic concurrency on existing sidecars.
ALTER TABLE public.order_ops ADD COLUMN IF NOT EXISTS assigned_to uuid;
ALTER TABLE public.order_ops ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 0;
ALTER TABLE public.message_meta ADD COLUMN IF NOT EXISTS assigned_to uuid;
ALTER TABLE public.message_meta ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 0;
ALTER TABLE public.message_meta ADD COLUMN IF NOT EXISTS stage_changed_at timestamptz;

-- Append-only internal notes and audit history.
CREATE TABLE IF NOT EXISTS public.admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('order','customer','message')),
  entity_key text NOT NULL,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  author_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_notes_entity_idx ON public.admin_notes (entity_type, entity_key, created_at DESC);
GRANT ALL ON public.admin_notes TO service_role;
REVOKE ALL ON public.admin_notes FROM anon, authenticated;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_key text NOT NULL,
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_audit_entity_idx ON public.admin_audit_log (entity_type, entity_key, at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_at_idx ON public.admin_audit_log (at DESC);
GRANT ALL ON public.admin_audit_log TO service_role;
REVOKE ALL ON public.admin_audit_log FROM anon, authenticated;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.block_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'append_only'; END $$;
DROP TRIGGER IF EXISTS admin_notes_append_only ON public.admin_notes;
CREATE TRIGGER admin_notes_append_only BEFORE UPDATE OR DELETE ON public.admin_notes FOR EACH ROW EXECUTE FUNCTION public.block_mutation();
DROP TRIGGER IF EXISTS admin_audit_append_only ON public.admin_audit_log;
CREATE TRIGGER admin_audit_append_only BEFORE UPDATE OR DELETE ON public.admin_audit_log FOR EACH ROW EXECUTE FUNCTION public.block_mutation();

-- Catalog availability overrides (public read; writes server-only).
CREATE TABLE IF NOT EXISTS public.catalog_availability (
  kind text NOT NULL CHECK (kind IN ('product','pack')),
  slug text NOT NULL,
  available boolean NOT NULL DEFAULT true,
  note text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kind, slug)
);
GRANT SELECT ON public.catalog_availability TO anon, authenticated;
GRANT ALL ON public.catalog_availability TO service_role;
ALTER TABLE public.catalog_availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Availability is public" ON public.catalog_availability;
CREATE POLICY "Availability is public" ON public.catalog_availability FOR SELECT TO anon, authenticated USING (true);

-- Cart slugs in an items array that are switched off.
CREATE OR REPLACE FUNCTION public.catalog_unavailable(_items jsonb) RETURNS text[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(array_agg(DISTINCT i->>'slug'), '{}')
  FROM jsonb_array_elements(CASE WHEN jsonb_typeof(_items) = 'array' THEN _items ELSE '[]'::jsonb END) i
  JOIN public.catalog_availability a ON a.available = false
   AND ((a.kind = 'product' AND i->>'slug' = a.slug) OR (a.kind = 'pack' AND i->>'slug' = 'pack-' || a.slug));
$$;
GRANT EXECUTE ON FUNCTION public.catalog_unavailable(jsonb) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.guard_order_availability() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF cardinality(public.catalog_unavailable(NEW.items)) > 0 THEN
    RAISE EXCEPTION 'catalog_unavailable';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS orders_guard_availability ON public.orders;
CREATE TRIGGER orders_guard_availability BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.guard_order_availability();

-- Caller's own staff capability. Never reads user_metadata.
CREATE OR REPLACE FUNCTION public.my_staff_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN NULL
    WHEN public.has_role(auth.uid(), 'admin') THEN 'admin'
    WHEN EXISTS (SELECT 1 FROM public.team_members WHERE user_id = auth.uid() AND active) THEN 'team'
    WHEN public.has_role(auth.uid(), 'moderator') THEN 'moderator'
    ELSE NULL END;
$$;
REVOKE ALL ON FUNCTION public.my_staff_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_staff_role() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.staff_role_of(_uid uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN _uid IS NULL THEN NULL
    WHEN public.has_role(_uid, 'admin') THEN 'admin'
    WHEN EXISTS (SELECT 1 FROM public.team_members WHERE user_id = _uid AND active) THEN 'team'
    WHEN public.has_role(_uid, 'moderator') THEN 'moderator'
    ELSE NULL END;
$$;
REVOKE ALL ON FUNCTION public.staff_role_of(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.staff_role_of(uuid) TO service_role;

-- Truthful money per order: online/staff-confirmed money + recorded balance collections.
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
          AND o.status <> 'Cancelled' THEN o.balance_amount ELSE 0 END
  FROM public.orders o LEFT JOIN public.balance_collections bc ON bc.order_id = o.id;
$$;
REVOKE ALL ON FUNCTION public.admin_order_money() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_order_money() TO service_role;

-- Full report over a date range, computed in SQL (no row caps).
CREATE OR REPLACE FUNCTION public.admin_report(_from timestamptz, _to timestamptz) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH o AS (SELECT * FROM public.orders WHERE created_at >= _from AND created_at < _to),
  m AS (SELECT * FROM public.admin_order_money() WHERE created_at >= _from AND created_at < _to),
  q AS (SELECT mm.* FROM public.message_meta mm JOIN public.contact_messages c ON c.id = mm.message_id
        WHERE mm.classification IN ('quote','sales') AND c.created_at >= _from AND c.created_at < _to)
  SELECT jsonb_build_object(
    'orders', (SELECT count(*) FROM o),
    'confirmed', (SELECT count(*) FROM m WHERE confirmed),
    'orderValue', (SELECT coalesce(sum(order_value),0) FROM m),
    'collected', (SELECT coalesce(sum(collected),0) FROM m),
    'courierHeld', (SELECT coalesce(sum(courier_held),0) FROM m),
    'outstanding', (SELECT coalesce(sum(outstanding),0) FROM m),
    'byStatus', (SELECT coalesce(jsonb_object_agg(status, n),'{}') FROM (SELECT status, count(*) n FROM o GROUP BY status) s),
    'byPayment', (SELECT coalesce(jsonb_object_agg(payment_status, n),'{}') FROM (SELECT payment_status, count(*) n FROM o GROUP BY payment_status) s),
    'byMethod', (SELECT coalesce(jsonb_object_agg(payment_method, n),'{}') FROM (SELECT payment_method, count(*) n FROM o GROUP BY payment_method) s),
    'byProduction', (SELECT coalesce(jsonb_object_agg(st, n),'{}') FROM (SELECT coalesce(op.ops_stage,'new') st, count(*) n FROM o LEFT JOIN public.order_ops op ON op.order_id = o.id GROUP BY 1) s),
    'byQuoteStage', (SELECT coalesce(jsonb_object_agg(quote_stage, n),'{}') FROM (SELECT quote_stage, count(*) n FROM q GROUP BY quote_stage) s),
    'quotes', (SELECT count(*) FROM q),
    'late', (SELECT count(*) FROM o LEFT JOIN public.order_ops op ON op.order_id = o.id
             WHERE o.expected_at < current_date AND coalesce(op.ops_stage,'new') NOT IN ('shipped','delivered','cancelled','refunded') AND o.status NOT IN ('Shipped','Delivered','Cancelled')),
    'daily', (SELECT coalesce(jsonb_agg(d ORDER BY d->>'day'),'[]') FROM (
       SELECT jsonb_build_object('day', to_char(date_trunc('day', created_at),'YYYY-MM-DD'), 'orders', count(*),
         'orderValue', sum(order_value), 'collected', sum(collected)) d
       FROM m GROUP BY date_trunc('day', created_at)) t)
  );
$$;
REVOKE ALL ON FUNCTION public.admin_report(timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_report(timestamptz, timestamptz) TO service_role;

-- Customers by normalized identity: profiles (incl. zero orders), order emails (guests), contact senders.
CREATE OR REPLACE FUNCTION public.admin_customers(_q text, _limit int, _offset int)
RETURNS TABLE (customer_key text, email text, name text, company text, phone text, user_id uuid, orders bigint, order_value numeric, collected numeric, outstanding numeric, messages bigint, quotes bigint, last_activity timestamptz, total_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH ids AS (
    SELECT lower(trim(p.email)) AS k, p.id AS uid, p.full_name AS nm, NULL::text AS co, NULL::text AS ph, p.created_at AS at FROM public.profiles p WHERE coalesce(trim(p.email),'') <> ''
    UNION ALL SELECT lower(trim(coalesce(o.email, o.guest_email))), o.user_id, o.contact_name, o.company, o.phone, o.created_at FROM public.orders o WHERE coalesce(trim(coalesce(o.email, o.guest_email)),'') <> ''
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
  om AS (
    SELECT lower(trim(coalesce(o.email, o.guest_email))) k, count(*) n, sum(m.order_value) v, sum(m.collected) c, sum(m.outstanding) s
    FROM public.orders o JOIN public.admin_order_money() m ON m.order_id = o.id GROUP BY 1
  ),
  cm AS (
    SELECT lower(trim(c.email)) k, count(*) n, count(*) FILTER (WHERE mm.classification IN ('quote','sales')) qn
    FROM public.contact_messages c LEFT JOIN public.message_meta mm ON mm.message_id = c.id GROUP BY 1
  ),
  f AS (
    SELECT b.*, coalesce(om.n,0) n, coalesce(om.v,0) v, coalesce(om.c,0) c, coalesce(om.s,0) s, coalesce(cm.n,0) mn, coalesce(cm.qn,0) qn
    FROM base b LEFT JOIN om ON om.k = b.k LEFT JOIN cm ON cm.k = b.k
    WHERE coalesce(_q,'') = '' OR b.k ILIKE '%' || _q || '%' OR coalesce(b.nm,'') ILIKE '%' || _q || '%' OR coalesce(b.co,'') ILIKE '%' || _q || '%' OR coalesce(b.ph,'') ILIKE '%' || _q || '%'
  )
  SELECT k, k, nm, co, ph, uid, n, v, c, s, mn, qn, last_at, count(*) OVER ()
  FROM f ORDER BY last_at DESC NULLS LAST
  LIMIT least(greatest(coalesce(_limit,25),1),100) OFFSET greatest(coalesce(_offset,0),0);
$$;
REVOKE ALL ON FUNCTION public.admin_customers(text, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_customers(text, int, int) TO service_role;

-- Action queue derived from real records.
CREATE OR REPLACE FUNCTION public.admin_action_queue() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'unread', (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT c.id, c.name, c.topic, c.created_at FROM public.contact_messages c LEFT JOIN public.message_meta mm ON mm.message_id = c.id WHERE coalesce(mm.is_read,false) = false ORDER BY c.created_at DESC LIMIT 20) x),
    'unreadCount', (SELECT count(*) FROM public.contact_messages c LEFT JOIN public.message_meta mm ON mm.message_id = c.id WHERE coalesce(mm.is_read,false) = false),
    'staleQuotes', (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT c.id, c.name, mm.quote_stage, coalesce(mm.stage_changed_at, c.created_at) since FROM public.message_meta mm JOIN public.contact_messages c ON c.id = mm.message_id WHERE mm.classification IN ('quote','sales') AND mm.quote_stage NOT IN ('won','lost') AND coalesce(mm.stage_changed_at, c.created_at) < now() - interval '3 days' ORDER BY 4 LIMIT 20) x),
    'awaitingPayment', (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT id, reference, payment_method, created_at FROM public.orders WHERE payment_status = 'awaiting_transfer' ORDER BY created_at LIMIT 20) x),
    'awaitingPaymentCount', (SELECT count(*) FROM public.orders WHERE payment_status = 'awaiting_transfer'),
    'late', (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT o.id, o.reference, o.expected_at FROM public.orders o LEFT JOIN public.order_ops op ON op.order_id = o.id WHERE (o.payment_status = 'paid' OR o.deposit_paid) AND o.expected_at < current_date AND coalesce(op.ops_stage,'new') NOT IN ('shipped','delivered','cancelled','refunded') AND o.status NOT IN ('Shipped','Delivered','Cancelled') ORDER BY o.expected_at LIMIT 20) x),
    'missingFiles', (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT o.id, o.reference, o.created_at FROM public.orders o WHERE (o.payment_status = 'paid' OR o.deposit_paid) AND NOT EXISTS (SELECT 1 FROM public.order_files f WHERE f.order_id = o.id) AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(o.items)='array' THEN o.items ELSE '[]' END) i WHERE i->>'slug' = 'design-service' OR coalesce(i->'selection'->>'design','') <> '') ORDER BY o.created_at DESC LIMIT 20) x),
    'courierCash', (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT o.id, o.reference, bc.amount, bc.recorded_at FROM public.balance_collections bc JOIN public.orders o ON o.id = bc.order_id WHERE NOT bc.remitted AND bc.recorded_at < now() - interval '7 days' ORDER BY bc.recorded_at LIMIT 20) x),
    'crmProblems', (SELECT count(*) FROM public.crm_outbox WHERE status IN ('failed','dead','blocked'))
  );
$$;
REVOKE ALL ON FUNCTION public.admin_action_queue() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_action_queue() TO service_role;

-- Atomic mutations with audit (service role only; callers verify capability first and pass actor).
CREATE OR REPLACE FUNCTION public.admin_update_order_ops(_actor uuid, _order uuid, _expected int, _f jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r text := public.staff_role_of(_actor); cur public.order_ops; before jsonb; after jsonb; cust text; nv int;
BEGIN
  IF r NOT IN ('admin','team') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = _order) THEN RAISE EXCEPTION 'not_found'; END IF;
  IF _f ? 'assigned_to' AND _f->>'assigned_to' IS NOT NULL AND public.staff_role_of((_f->>'assigned_to')::uuid) NOT IN ('admin','team') THEN RAISE EXCEPTION 'invalid_assignee'; END IF;
  INSERT INTO public.order_ops (order_id) VALUES (_order) ON CONFLICT (order_id) DO NOTHING;
  SELECT * INTO cur FROM public.order_ops WHERE order_id = _order FOR UPDATE;
  IF _expected IS NOT NULL AND cur.version <> _expected THEN RAISE EXCEPTION 'conflict'; END IF;
  before := to_jsonb(cur) - 'updated_at' - 'updated_by' - 'version';
  UPDATE public.order_ops SET
    ops_stage = coalesce(_f->>'ops_stage', ops_stage),
    assigned_to = CASE WHEN _f ? 'assigned_to' THEN (_f->>'assigned_to')::uuid ELSE assigned_to END,
    supplier = CASE WHEN _f ? 'supplier' THEN _f->>'supplier' ELSE supplier END,
    cost_mad = CASE WHEN _f ? 'cost_mad' THEN (_f->>'cost_mad')::numeric ELSE cost_mad END,
    delivery_notes = CASE WHEN _f ? 'delivery_notes' THEN _f->>'delivery_notes' ELSE delivery_notes END,
    production_notes = CASE WHEN _f ? 'production_notes' THEN _f->>'production_notes' ELSE production_notes END,
    version = version + 1, updated_by = _actor, updated_at = now()
  WHERE order_id = _order RETURNING version INTO nv;
  SELECT to_jsonb(op) - 'updated_at' - 'updated_by' - 'version' INTO after FROM public.order_ops op WHERE order_id = _order;
  cust := CASE _f->>'ops_stage' WHEN 'file_verification' THEN 'Order placed' WHEN 'bat_approved' THEN 'Artwork approved'
    WHEN 'in_production' THEN 'In production' WHEN 'finishing' THEN 'Quality check' WHEN 'ready' THEN 'Quality check'
    WHEN 'shipped' THEN 'Shipped' WHEN 'delivered' THEN 'Delivered' ELSE NULL END;
  IF cust IS NOT NULL THEN UPDATE public.orders SET status = cust, updated_at = now() WHERE id = _order AND status <> cust; END IF;
  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_key, changes)
  SELECT _actor, 'order.ops_update', 'order', _order::text,
    coalesce(jsonb_object_agg(k, jsonb_build_object('from', before->k, 'to', after->k)), '{}')
  FROM jsonb_object_keys(after) k WHERE before->k IS DISTINCT FROM after->k;
  RETURN nv;
END $$;

CREATE OR REPLACE FUNCTION public.admin_update_message(_actor uuid, _msg uuid, _expected int, _f jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r text := public.staff_role_of(_actor); cur public.message_meta; before jsonb; after jsonb; nv int;
BEGIN
  IF r NOT IN ('admin','team') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.contact_messages WHERE id = _msg) THEN RAISE EXCEPTION 'not_found'; END IF;
  IF _f ? 'assigned_to' AND _f->>'assigned_to' IS NOT NULL AND public.staff_role_of((_f->>'assigned_to')::uuid) NOT IN ('admin','team') THEN RAISE EXCEPTION 'invalid_assignee'; END IF;
  IF _f ? 'quote_stage' AND _f->>'quote_stage' NOT IN ('new','qualified','proposal','negotiation','won','lost') THEN RAISE EXCEPTION 'invalid_stage'; END IF;
  IF _f ? 'classification' AND _f->>'classification' NOT IN ('unclassified','quote','sales','support','order','spam','other') THEN RAISE EXCEPTION 'invalid_classification'; END IF;
  INSERT INTO public.message_meta (message_id) VALUES (_msg) ON CONFLICT (message_id) DO NOTHING;
  SELECT * INTO cur FROM public.message_meta WHERE message_id = _msg FOR UPDATE;
  IF _expected IS NOT NULL AND cur.version <> _expected THEN RAISE EXCEPTION 'conflict'; END IF;
  before := jsonb_build_object('classification', cur.classification, 'quote_stage', cur.quote_stage, 'is_read', cur.is_read, 'assigned_to', cur.assigned_to);
  UPDATE public.message_meta SET
    classification = coalesce(_f->>'classification', classification),
    classified_by = CASE WHEN _f ? 'classification' THEN 'staff:' || _actor::text ELSE classified_by END,
    quote_stage = coalesce(_f->>'quote_stage', quote_stage),
    stage_changed_at = CASE WHEN _f ? 'quote_stage' AND _f->>'quote_stage' IS DISTINCT FROM quote_stage THEN now() ELSE stage_changed_at END,
    is_read = coalesce((_f->>'is_read')::boolean, is_read),
    assigned_to = CASE WHEN _f ? 'assigned_to' THEN (_f->>'assigned_to')::uuid ELSE assigned_to END,
    version = version + 1, updated_at = now()
  WHERE message_id = _msg RETURNING version INTO nv;
  SELECT jsonb_build_object('classification', classification, 'quote_stage', quote_stage, 'is_read', is_read, 'assigned_to', assigned_to) INTO after FROM public.message_meta WHERE message_id = _msg;
  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_key, changes)
  SELECT _actor, 'message.update', 'message', _msg::text,
    coalesce(jsonb_object_agg(k, jsonb_build_object('from', before->k, 'to', after->k)), '{}')
  FROM jsonb_object_keys(after) k WHERE before->k IS DISTINCT FROM after->k;
  RETURN nv;
END $$;

CREATE OR REPLACE FUNCTION public.admin_add_note(_actor uuid, _type text, _key text, _body text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE nid uuid;
BEGIN
  IF public.staff_role_of(_actor) NOT IN ('admin','team') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _type = 'order' AND NOT EXISTS (SELECT 1 FROM public.orders WHERE id::text = _key) THEN RAISE EXCEPTION 'not_found'; END IF;
  IF _type = 'message' AND NOT EXISTS (SELECT 1 FROM public.contact_messages WHERE id::text = _key) THEN RAISE EXCEPTION 'not_found'; END IF;
  INSERT INTO public.admin_notes (entity_type, entity_key, body, author_id) VALUES (_type, _key, _body, _actor) RETURNING id INTO nid;
  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_key, changes) VALUES (_actor, 'note.add', _type, _key, jsonb_build_object('note_id', nid, 'length', length(_body)));
  RETURN nid;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_availability(_actor uuid, _kind text, _slug text, _available boolean, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE prev boolean;
BEGIN
  IF public.staff_role_of(_actor) <> 'admin' THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT available INTO prev FROM public.catalog_availability WHERE kind = _kind AND slug = _slug;
  INSERT INTO public.catalog_availability (kind, slug, available, note, updated_by, updated_at) VALUES (_kind, _slug, _available, _note, _actor, now())
  ON CONFLICT (kind, slug) DO UPDATE SET available = EXCLUDED.available, note = EXCLUDED.note, updated_by = _actor, updated_at = now();
  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_key, changes) VALUES (_actor, 'catalog.availability', _kind, _slug, jsonb_build_object('available', jsonb_build_object('from', coalesce(prev, true), 'to', _available)));
END $$;

CREATE OR REPLACE FUNCTION public.admin_record_balance(_actor uuid, _order uuid, _remitted boolean, _note text)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.orders; prev public.balance_collections;
BEGIN
  IF public.staff_role_of(_actor) <> 'admin' THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO o FROM public.orders WHERE id = _order FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  IF NOT o.deposit_paid THEN RAISE EXCEPTION 'advance_not_confirmed'; END IF;
  IF NOT (o.balance_amount > 0) THEN RAISE EXCEPTION 'no_balance'; END IF;
  SELECT * INTO prev FROM public.balance_collections WHERE order_id = _order;
  IF prev.remitted AND NOT _remitted THEN RAISE EXCEPTION 'already_remitted'; END IF;
  INSERT INTO public.balance_collections (order_id, amount, remitted, note, recorded_by, recorded_at)
  VALUES (_order, o.balance_amount, _remitted, _note, _actor, now())
  ON CONFLICT (order_id) DO UPDATE SET remitted = EXCLUDED.remitted, note = coalesce(EXCLUDED.note, balance_collections.note), recorded_by = _actor, recorded_at = now();
  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_key, changes)
  VALUES (_actor, CASE WHEN _remitted THEN 'balance.remitted' ELSE 'balance.collected' END, 'order', _order::text,
    jsonb_build_object('amount', o.balance_amount, 'remitted', jsonb_build_object('from', prev.remitted, 'to', _remitted)));
  RETURN o.balance_amount;
END $$;

CREATE OR REPLACE FUNCTION public.admin_grant_member(_actor uuid, _email text, _role text, _name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE target uuid; temail text;
BEGIN
  IF public.staff_role_of(_actor) <> 'admin' THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _role NOT IN ('team','admin') THEN RAISE EXCEPTION 'invalid_role'; END IF;
  SELECT id, email INTO target, temail FROM auth.users WHERE lower(email) = lower(trim(_email)) AND email_confirmed_at IS NOT NULL;
  IF target IS NULL THEN RAISE EXCEPTION 'no_confirmed_user'; END IF;
  IF _role = 'admin' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (target, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.team_members (user_id, email, display_name, active, granted_by, granted_at, revoked_by, revoked_at)
    VALUES (target, temail, nullif(trim(_name),''), true, _actor, now(), NULL, NULL)
    ON CONFLICT (user_id) DO UPDATE SET active = true, display_name = coalesce(EXCLUDED.display_name, team_members.display_name), granted_by = _actor, granted_at = now(), revoked_by = NULL, revoked_at = NULL;
  END IF;
  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_key, changes) VALUES (_actor, 'team.grant', 'user', target::text, jsonb_build_object('role', _role));
  RETURN target;
END $$;

CREATE OR REPLACE FUNCTION public.admin_revoke_member(_actor uuid, _target uuid, _role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.staff_role_of(_actor) <> 'admin' THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _role = 'admin' THEN
    PERFORM 1 FROM public.user_roles WHERE role = 'admin' FOR UPDATE;
    IF (SELECT count(*) FROM public.user_roles WHERE role = 'admin') <= 1 AND EXISTS (SELECT 1 FROM public.user_roles WHERE role='admin' AND user_id = _target) THEN
      RAISE EXCEPTION 'last_admin';
    END IF;
    DELETE FROM public.user_roles WHERE user_id = _target AND role = 'admin';
  ELSIF _role = 'team' THEN
    UPDATE public.team_members SET active = false, revoked_by = _actor, revoked_at = now() WHERE user_id = _target AND active;
    IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  ELSE RAISE EXCEPTION 'invalid_role'; END IF;
  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_key, changes) VALUES (_actor, 'team.revoke', 'user', _target::text, jsonb_build_object('role', _role));
END $$;

DO $$ DECLARE f text; BEGIN
  FOREACH f IN ARRAY ARRAY['admin_update_order_ops(uuid,uuid,integer,jsonb)','admin_update_message(uuid,uuid,integer,jsonb)','admin_add_note(uuid,text,text,text)','admin_set_availability(uuid,text,text,boolean,text)','admin_record_balance(uuid,uuid,boolean,text)','admin_grant_member(uuid,text,text,text)','admin_revoke_member(uuid,uuid,text)']
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', f);
  END LOOP;
END $$;