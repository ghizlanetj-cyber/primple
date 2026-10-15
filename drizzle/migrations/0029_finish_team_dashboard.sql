-- Shared uncapped aggregates. Internal views/functions are service-only.
CREATE OR REPLACE VIEW public.admin_customer_records AS

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
  )
  SELECT k AS customer_key, nm AS name, co AS company, ph AS phone, uid AS user_id,
    n AS orders, sn AS shop_orders, v AS order_value, c AS collected, s AS outstanding,
    sv AS shop_value, mn AS messages, qn AS quotes, last_at AS last_activity
  FROM f;

REVOKE ALL ON public.admin_customer_records FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.admin_customer_records TO service_role;
CREATE OR REPLACE FUNCTION public.admin_customers_v2(_q text, _limit int, _offset int)
RETURNS TABLE (customer_key text, name text, company text, phone text, user_id uuid, orders bigint, shop_orders bigint, order_value numeric, collected numeric, outstanding numeric, shop_value numeric, messages bigint, quotes bigint, last_activity timestamptz, total_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT r.*, count(*) OVER () FROM public.admin_customer_records r
 WHERE coalesce(_q,'')='' OR strpos(r.customer_key,lower(_q))>0
 OR strpos(lower(coalesce(r.name,'')),lower(_q))>0
 OR strpos(lower(coalesce(r.company,'')),lower(_q))>0 OR strpos(coalesce(r.phone,''),_q)>0
 ORDER BY last_activity DESC NULLS LAST, customer_key
 LIMIT least(greatest(coalesce(_limit,25),1),100) OFFSET greatest(coalesce(_offset,0),0);
$$;
CREATE OR REPLACE FUNCTION public.admin_customer_summary(_key text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT to_jsonb(r) FROM public.admin_customer_records r WHERE customer_key=lower(trim(_key));
$$;
CREATE OR REPLACE FUNCTION public.admin_customer_messages(_key text, _limit int, _offset int)
RETURNS TABLE (id uuid, total_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT id, count(*) OVER () FROM public.contact_messages WHERE lower(trim(email))=lower(trim(_key))
 ORDER BY created_at DESC, id LIMIT least(greatest(coalesce(_limit,20),1),100) OFFSET greatest(coalesce(_offset,0),0);
$$;
REVOKE ALL ON FUNCTION public.admin_customer_messages(text,int,int) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_customer_messages(text,int,int) TO service_role;

-- Shop payment state remains processor-owned. Operations use a private sidecar.
CREATE TABLE public.shop_order_ops (
 order_id uuid PRIMARY KEY REFERENCES public.shop_orders(id) ON DELETE CASCADE,
 ops_stage text NOT NULL DEFAULT 'new' CHECK (ops_stage IN ('new','in_production','ready','shipped','delivered','cancelled')),
 assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 delivery_notes text, expected_at date, version integer NOT NULL DEFAULT 0,
 updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shop_order_ops ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shop_order_ops FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.shop_order_ops TO service_role;
ALTER TABLE public.admin_notes DROP CONSTRAINT admin_notes_entity_type_check;
ALTER TABLE public.admin_notes ADD CONSTRAINT admin_notes_entity_type_check CHECK (entity_type IN ('order','shop_order','customer','message'));
CREATE OR REPLACE FUNCTION public.admin_update_shop_ops(_actor uuid,_order uuid,_expected int,_f jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE cur public.shop_order_ops; before jsonb; after jsonb; nv int;
BEGIN
 IF public.staff_role_of(_actor) NOT IN ('admin','team') THEN RAISE EXCEPTION 'forbidden'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.shop_orders WHERE id=_order) THEN RAISE EXCEPTION 'not_found'; END IF;
 IF _f ? 'assigned_to' AND _f->>'assigned_to' IS NOT NULL AND public.staff_role_of((_f->>'assigned_to')::uuid) NOT IN ('admin','team') THEN RAISE EXCEPTION 'invalid_assignee'; END IF;
 INSERT INTO public.shop_order_ops(order_id) VALUES(_order) ON CONFLICT DO NOTHING;
 SELECT * INTO cur FROM public.shop_order_ops WHERE order_id=_order FOR UPDATE;
 IF _expected IS NOT NULL AND cur.version<>_expected THEN RAISE EXCEPTION 'conflict'; END IF;
 before:=to_jsonb(cur)-'updated_at'-'updated_by'-'version';
 UPDATE public.shop_order_ops SET ops_stage=coalesce(_f->>'ops_stage',ops_stage),
 assigned_to=CASE WHEN _f ? 'assigned_to' THEN (_f->>'assigned_to')::uuid ELSE assigned_to END,
 delivery_notes=CASE WHEN _f ? 'delivery_notes' THEN _f->>'delivery_notes' ELSE delivery_notes END,
 expected_at=CASE WHEN _f ? 'expected_at' THEN (_f->>'expected_at')::date ELSE expected_at END,
 version=version+1,updated_by=_actor,updated_at=now() WHERE order_id=_order RETURNING version INTO nv;
 SELECT to_jsonb(op)-'updated_at'-'updated_by'-'version' INTO after FROM public.shop_order_ops op WHERE order_id=_order;
 INSERT INTO public.admin_audit_log(actor_id,action,entity_type,entity_key,changes)
 SELECT _actor,'shop.ops_update','shop_order',_order::text,coalesce(jsonb_object_agg(k,jsonb_build_object('from',before->k,'to',after->k)),'{}')
 FROM jsonb_object_keys(after) k WHERE before->k IS DISTINCT FROM after->k;
 RETURN nv;
END $$;
REVOKE ALL ON FUNCTION public.admin_update_shop_ops(uuid,uuid,int,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_shop_ops(uuid,uuid,int,jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.admin_add_note(_actor uuid, _type text, _key text, _body text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE nid uuid;
BEGIN
  IF public.staff_role_of(_actor) NOT IN ('admin','team') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _type = 'order' AND NOT EXISTS (SELECT 1 FROM public.orders WHERE id::text = _key) THEN RAISE EXCEPTION 'not_found'; END IF;
  IF _type = 'shop_order' AND NOT EXISTS (SELECT 1 FROM public.shop_orders WHERE id::text = _key) THEN RAISE EXCEPTION 'not_found'; END IF;
  IF _type = 'message' AND NOT EXISTS (SELECT 1 FROM public.contact_messages WHERE id::text = _key) THEN RAISE EXCEPTION 'not_found'; END IF;
  INSERT INTO public.admin_notes (entity_type, entity_key, body, author_id) VALUES (_type, _key, _body, _actor) RETURNING id INTO nid;
  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_key, changes) VALUES (_actor, 'note.add', _type, _key, jsonb_build_object('note_id', nid, 'length', length(_body)));
  RETURN nid;
END $$;

CREATE TABLE public.catalog_pack_products(pack_slug text NOT NULL, product_slug text NOT NULL, PRIMARY KEY(pack_slug,product_slug));
ALTER TABLE public.catalog_pack_products ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.catalog_pack_products FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.catalog_pack_products TO service_role;
INSERT INTO public.catalog_pack_products(pack_slug,product_slug) VALUES
('beauty','flyers'),
('beauty','menus'),
('beauty','stickers'),
('brand','flyers'),
('brand','labels'),
('brand','stickers'),
('btp','business-cards'),
('btp','flyers'),
('btp','large-format'),
('ecommerce','labels'),
('ecommerce','stickers'),
('event','flyers'),
('event','posters'),
('event','roll-up-banners'),
('event','stickers'),
('launch','business-cards'),
('launch','flyers'),
('launch','roll-up-banners'),
('launch','stickers'),
('office','brochures'),
('office','business-cards'),
('restaurant','flyers'),
('restaurant','labels'),
('restaurant','menus'),
('restaurant','stickers'),
('retail','flyers'),
('salon','business-cards'),
('salon','flyers');
CREATE OR REPLACE FUNCTION public.catalog_unavailable(_items jsonb) RETURNS text[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT coalesce(array_agg(DISTINCT i->>'slug'),'{}') FROM jsonb_array_elements(CASE WHEN jsonb_typeof(_items)='array' THEN _items ELSE '[]' END) i
 WHERE EXISTS(SELECT 1 FROM public.catalog_availability a WHERE NOT a.available AND (
 (a.kind='product' AND a.slug=i->>'slug') OR (a.kind='pack' AND 'pack-'||a.slug=i->>'slug')
 OR (a.kind='product' AND EXISTS(SELECT 1 FROM public.catalog_pack_products p WHERE 'pack-'||p.pack_slug=i->>'slug' AND p.product_slug=a.slug))));
$$;
REVOKE ALL ON FUNCTION public.catalog_unavailable(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.catalog_unavailable(jsonb) TO service_role;
