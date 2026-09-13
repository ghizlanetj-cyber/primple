-- The auth trigger must remain SECURITY DEFINER, but it is never intended as a client-callable RPC.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;

-- Role checks can safely run with the caller's rights because user_roles RLS already
-- limits reads to the signed-in user's own role rows.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- Role assignment is deliberately unavailable through the client Data API.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.user_roles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.user_roles FROM authenticated;

-- Explicit default-deny policies document and enforce that client sessions cannot
-- create, alter, or remove role assignments even if table grants change later.
CREATE POLICY "Client role assignment is denied"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Client role changes are denied"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Client role deletion is denied"
ON public.user_roles
FOR DELETE
TO authenticated
USING (false);