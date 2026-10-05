-- NULL never satisfies NOT IN / <> checks; return 'none' so non-staff are always refused.
CREATE OR REPLACE FUNCTION public.staff_role_of(_uid uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN _uid IS NULL THEN 'none'
    WHEN public.has_role(_uid, 'admin') THEN 'admin'
    WHEN EXISTS (SELECT 1 FROM public.team_members WHERE user_id = _uid AND active) THEN 'team'
    WHEN public.has_role(_uid, 'moderator') THEN 'moderator'
    ELSE 'none' END;
$$;
REVOKE ALL ON FUNCTION public.staff_role_of(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.staff_role_of(uuid) TO service_role;