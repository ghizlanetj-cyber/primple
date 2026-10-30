ALTER TABLE public.order_ops ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.order_ops ADD COLUMN IF NOT EXISTS archived_by uuid;

CREATE OR REPLACE FUNCTION public.admin_set_order_archived(_actor uuid, _order uuid, _expected int, _archived boolean)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r text := public.staff_role_of(_actor); cur public.order_ops; nv int;
BEGIN
  IF r NOT IN ('admin','team') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = _order) THEN RAISE EXCEPTION 'not_found'; END IF;
  INSERT INTO public.order_ops (order_id) VALUES (_order) ON CONFLICT (order_id) DO NOTHING;
  SELECT * INTO cur FROM public.order_ops WHERE order_id = _order FOR UPDATE;
  IF _expected IS NOT NULL AND cur.version <> _expected THEN RAISE EXCEPTION 'conflict'; END IF;
  IF (cur.archived_at IS NOT NULL) = _archived THEN RETURN cur.version; END IF;
  UPDATE public.order_ops SET
    archived_at = CASE WHEN _archived THEN now() ELSE NULL END,
    archived_by = CASE WHEN _archived THEN _actor ELSE NULL END,
    version = version + 1, updated_by = _actor, updated_at = now()
  WHERE order_id = _order RETURNING version INTO nv;
  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_key, changes)
  VALUES (_actor, CASE WHEN _archived THEN 'order.archive' ELSE 'order.unarchive' END, 'order', _order::text,
    jsonb_build_object('archived', jsonb_build_object('from', NOT _archived, 'to', _archived)));
  RETURN nv;
END $$;
REVOKE ALL ON FUNCTION public.admin_set_order_archived(uuid,uuid,int,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_order_archived(uuid,uuid,int,boolean) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_orders_page(_q text, _status text, _payment text, _stage text, _assignee uuid, _from timestamptz, _to timestamptz, _limit int, _offset int, _archived boolean)
RETURNS TABLE (order_id uuid, total_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id, count(*) OVER ()
  FROM public.orders o LEFT JOIN public.order_ops op ON op.order_id = o.id
  WHERE (coalesce(_q,'') = '' OR o.reference ILIKE '%'||_q||'%' OR coalesce(o.email,'') ILIKE '%'||_q||'%' OR coalesce(o.guest_email,'') ILIKE '%'||_q||'%' OR coalesce(o.contact_name,'') ILIKE '%'||_q||'%' OR coalesce(o.company,'') ILIKE '%'||_q||'%' OR coalesce(o.phone,'') ILIKE '%'||_q||'%')
    AND (_status IS NULL OR o.status = _status)
    AND (_payment IS NULL OR o.payment_status = _payment)
    AND (_stage IS NULL OR coalesce(op.ops_stage,'new') = _stage)
    AND (_assignee IS NULL OR op.assigned_to = _assignee)
    AND (_from IS NULL OR o.created_at >= _from)
    AND (_to IS NULL OR o.created_at < _to)
    AND ((op.archived_at IS NOT NULL) = coalesce(_archived, false))
  ORDER BY o.created_at DESC
  LIMIT least(greatest(coalesce(_limit,25),1),100) OFFSET greatest(coalesce(_offset,0),0);
$$;
REVOKE ALL ON FUNCTION public.admin_orders_page(text,text,text,text,uuid,timestamptz,timestamptz,int,int,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_orders_page(text,text,text,text,uuid,timestamptz,timestamptz,int,int,boolean) TO service_role;