CREATE OR REPLACE FUNCTION public.admin_orders_page(_q text, _status text, _payment text, _stage text, _assignee uuid, _from timestamptz, _to timestamptz, _limit int, _offset int)
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
  ORDER BY o.created_at DESC
  LIMIT least(greatest(coalesce(_limit,25),1),100) OFFSET greatest(coalesce(_offset,0),0);
$$;
REVOKE ALL ON FUNCTION public.admin_orders_page(text,text,text,text,uuid,timestamptz,timestamptz,int,int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_orders_page(text,text,text,text,uuid,timestamptz,timestamptz,int,int) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_messages_page(_q text, _classification text, _unread boolean, _quotes boolean, _stage text, _assignee uuid, _limit int, _offset int)
RETURNS TABLE (message_id uuid, total_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, count(*) OVER ()
  FROM public.contact_messages c LEFT JOIN public.message_meta mm ON mm.message_id = c.id
  WHERE (coalesce(_q,'') = '' OR c.name ILIKE '%'||_q||'%' OR c.email ILIKE '%'||_q||'%' OR coalesce(c.company,'') ILIKE '%'||_q||'%' OR coalesce(c.topic,'') ILIKE '%'||_q||'%' OR c.message ILIKE '%'||_q||'%')
    AND (_classification IS NULL OR coalesce(mm.classification,'unclassified') = _classification)
    AND (_unread IS NOT TRUE OR coalesce(mm.is_read,false) = false)
    AND (_quotes IS NOT TRUE OR mm.classification IN ('quote','sales'))
    AND (_stage IS NULL OR coalesce(mm.quote_stage,'new') = _stage)
    AND (_assignee IS NULL OR mm.assigned_to = _assignee)
  ORDER BY c.created_at DESC
  LIMIT least(greatest(coalesce(_limit,25),1),100) OFFSET greatest(coalesce(_offset,0),0);
$$;
REVOKE ALL ON FUNCTION public.admin_messages_page(text,text,boolean,boolean,text,uuid,int,int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_messages_page(text,text,boolean,boolean,text,uuid,int,int) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_quote_stage_counts() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(jsonb_object_agg(quote_stage, n), '{}') FROM (
    SELECT quote_stage, count(*) n FROM public.message_meta WHERE classification IN ('quote','sales') GROUP BY quote_stage) s;
$$;
REVOKE ALL ON FUNCTION public.admin_quote_stage_counts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_quote_stage_counts() TO service_role;

-- Staff directory with emails (auth.users is not reachable from the Data API).
CREATE OR REPLACE FUNCTION public.admin_staff_directory()
RETURNS TABLE (user_id uuid, email text, display_name text, role text, active boolean, granted_at timestamptz, revoked_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT r.user_id, u.email::text, p.full_name, r.role::text, true, r.created_at, NULL::timestamptz
  FROM public.user_roles r JOIN auth.users u ON u.id = r.user_id LEFT JOIN public.profiles p ON p.id = r.user_id
  WHERE r.role IN ('admin','moderator')
  UNION ALL
  SELECT t.user_id, coalesce(u.email::text, t.email), coalesce(t.display_name, p.full_name), 'team', t.active, t.granted_at, t.revoked_at
  FROM public.team_members t LEFT JOIN auth.users u ON u.id = t.user_id LEFT JOIN public.profiles p ON p.id = t.user_id;
$$;
REVOKE ALL ON FUNCTION public.admin_staff_directory() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_staff_directory() TO service_role;