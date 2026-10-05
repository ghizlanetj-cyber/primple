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
             WHERE (o.payment_status = 'paid' OR o.deposit_paid) AND o.expected_at < current_date AND coalesce(op.ops_stage,'new') NOT IN ('shipped','delivered','cancelled','refunded') AND o.status NOT IN ('Shipped','Delivered','Cancelled')),
    'daily', (SELECT coalesce(jsonb_agg(d ORDER BY d->>'day'),'[]') FROM (
       SELECT jsonb_build_object('day', to_char(date_trunc('day', created_at),'YYYY-MM-DD'), 'orders', count(*),
         'orderValue', sum(order_value), 'collected', sum(collected)) d
       FROM m GROUP BY date_trunc('day', created_at)) t)
  );
$$;