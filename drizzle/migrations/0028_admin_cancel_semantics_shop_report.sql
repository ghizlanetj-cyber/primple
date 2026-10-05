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
    WHEN 'shipped' THEN 'Shipped' WHEN 'delivered' THEN 'Delivered'
    WHEN 'cancelled' THEN 'Cancelled' WHEN 'refunded' THEN 'Cancelled' ELSE NULL END;
  IF cust IS NOT NULL THEN UPDATE public.orders SET status = cust, updated_at = now() WHERE id = _order AND status <> cust; END IF;
  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_key, changes)
  SELECT _actor, 'order.ops_update', 'order', _order::text,
    coalesce(jsonb_object_agg(k, jsonb_build_object('from', before->k, 'to', after->k)), '{}')
  FROM jsonb_object_keys(after) k WHERE before->k IS DISTINCT FROM after->k;
  RETURN nv;
END $$;

CREATE OR REPLACE FUNCTION public.admin_action_queue() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'unread', (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT c.id, c.name, c.topic, c.created_at FROM public.contact_messages c LEFT JOIN public.message_meta mm ON mm.message_id = c.id WHERE coalesce(mm.is_read,false) = false ORDER BY c.created_at DESC LIMIT 20) x),
    'unreadCount', (SELECT count(*) FROM public.contact_messages c LEFT JOIN public.message_meta mm ON mm.message_id = c.id WHERE coalesce(mm.is_read,false) = false),
    'staleQuotes', (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT c.id, c.name, mm.quote_stage, coalesce(mm.stage_changed_at, c.created_at) since FROM public.message_meta mm JOIN public.contact_messages c ON c.id = mm.message_id WHERE mm.classification IN ('quote','sales') AND mm.quote_stage NOT IN ('won','lost') AND coalesce(mm.stage_changed_at, c.created_at) < now() - interval '3 days' ORDER BY 4 LIMIT 20) x),
    'awaitingPayment', (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT id, reference, payment_method, created_at FROM public.orders WHERE payment_status = 'awaiting_transfer' AND status <> 'Cancelled' AND NOT EXISTS (SELECT 1 FROM public.order_ops op WHERE op.order_id = orders.id AND op.ops_stage IN ('cancelled','refunded')) ORDER BY created_at LIMIT 20) x),
    'awaitingPaymentCount', (SELECT count(*) FROM public.orders WHERE payment_status = 'awaiting_transfer' AND status <> 'Cancelled' AND NOT EXISTS (SELECT 1 FROM public.order_ops op WHERE op.order_id = orders.id AND op.ops_stage IN ('cancelled','refunded'))),
    'late', (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT o.id, o.reference, o.expected_at FROM public.orders o LEFT JOIN public.order_ops op ON op.order_id = o.id WHERE (o.payment_status = 'paid' OR o.deposit_paid) AND o.expected_at < current_date AND coalesce(op.ops_stage,'new') NOT IN ('shipped','delivered','cancelled','refunded') AND o.status NOT IN ('Shipped','Delivered','Cancelled') ORDER BY o.expected_at LIMIT 20) x),
    'missingFiles', (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT o.id, o.reference, o.created_at FROM public.orders o WHERE (o.payment_status = 'paid' OR o.deposit_paid) AND o.status <> 'Cancelled' AND NOT EXISTS (SELECT 1 FROM public.order_ops op WHERE op.order_id = o.id AND op.ops_stage IN ('cancelled','refunded')) AND NOT EXISTS (SELECT 1 FROM public.order_files f WHERE f.order_id = o.id) AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(o.items)='array' THEN o.items ELSE '[]' END) i WHERE i->>'slug' = 'design-service' OR coalesce(i->'selection'->>'design','') <> '') ORDER BY o.created_at DESC LIMIT 20) x),
    'courierCash', (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT o.id, o.reference, bc.amount, bc.recorded_at FROM public.balance_collections bc JOIN public.orders o ON o.id = bc.order_id WHERE NOT bc.remitted AND bc.recorded_at < now() - interval '7 days' ORDER BY bc.recorded_at LIMIT 20) x),
    'crmProblems', (SELECT count(*) FROM public.crm_outbox WHERE status IN ('failed','dead','blocked'))
  );
$$;

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
    'shopOrders', (SELECT count(*) FROM public.shop_orders WHERE created_at >= _from AND created_at < _to),
    'shopPaid', (SELECT count(*) FROM public.shop_orders WHERE status = 'paid' AND created_at >= _from AND created_at < _to),
    'shopValue', (SELECT coalesce(sum(amount_cents),0) / 100.0 FROM public.shop_orders WHERE status = 'paid' AND currency = 'MAD' AND created_at >= _from AND created_at < _to),
    'late', (SELECT count(*) FROM o LEFT JOIN public.order_ops op ON op.order_id = o.id
             WHERE (o.payment_status = 'paid' OR o.deposit_paid) AND o.expected_at < current_date AND coalesce(op.ops_stage,'new') NOT IN ('shipped','delivered','cancelled','refunded') AND o.status NOT IN ('Shipped','Delivered','Cancelled')),
    'daily', (SELECT coalesce(jsonb_agg(d ORDER BY d->>'day'),'[]') FROM (
       SELECT jsonb_build_object('day', to_char(date_trunc('day', created_at),'YYYY-MM-DD'), 'orders', count(*),
         'orderValue', sum(order_value), 'collected', sum(collected)) d
       FROM m GROUP BY date_trunc('day', created_at)) t)
  );
$$;