ALTER TABLE public.order_files
  ADD COLUMN IF NOT EXISTS uploader_name text,
  ADD COLUMN IF NOT EXISTS uploader_email text,
  ADD COLUMN IF NOT EXISTS uploader_phone text,
  ADD COLUMN IF NOT EXISTS contact_source text;

ALTER TABLE public.order_files
  ADD CONSTRAINT order_files_uploader_contact_check CHECK (
    (contact_source IS NULL OR contact_source = 'guest_form')
    AND (uploader_name IS NULL OR char_length(uploader_name) <= 120)
    AND (uploader_email IS NULL OR char_length(uploader_email) <= 160)
    AND (uploader_phone IS NULL OR char_length(uploader_phone) <= 40)
  );

COMMENT ON COLUMN public.order_files.uploader_name IS 'Customer-supplied guest contact (unverified). Server-written only.';
COMMENT ON COLUMN public.order_files.contact_source IS 'guest_form when the guest contact form supplied uploader_*; NULL = not collected.';

-- Customers can never write or change uploader contact; only server code (service role) can.
CREATE OR REPLACE FUNCTION public.guard_order_files_contact()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF coalesce(auth.role(), '') IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.uploader_name := NULL; NEW.uploader_email := NULL; NEW.uploader_phone := NULL; NEW.contact_source := NULL;
    ELSE
      NEW.uploader_name := OLD.uploader_name; NEW.uploader_email := OLD.uploader_email;
      NEW.uploader_phone := OLD.uploader_phone; NEW.contact_source := OLD.contact_source;
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_order_files_contact() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER order_files_contact_guard
  BEFORE INSERT OR UPDATE ON public.order_files
  FOR EACH ROW EXECUTE FUNCTION public.guard_order_files_contact();

-- Atomically links every requested file to one order, or nothing.
-- _user set: signed-in caller (owns order; may use own files or guest files proven by token).
-- _user NULL: guest caller proven by the order claim token; only guest files proven by token.
CREATE OR REPLACE FUNCTION public.attach_order_files(_order uuid, _user uuid, _claim text, _files jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o record; f jsonb; r record; n int := 0; cnt int; tok text;
BEGIN
  IF _files IS NULL OR jsonb_typeof(_files) <> 'array' OR jsonb_array_length(_files) > 30 THEN
    RAISE EXCEPTION 'invalid_files';
  END IF;
  SELECT id, reference, user_id, claim_token INTO o FROM public.orders WHERE id = _order FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF _user IS NOT NULL THEN
    IF o.user_id IS DISTINCT FROM _user THEN RAISE EXCEPTION 'order_forbidden'; END IF;
  ELSIF o.user_id IS NOT NULL OR o.claim_token IS NULL OR _claim IS NULL OR o.claim_token <> _claim THEN
    RAISE EXCEPTION 'order_forbidden';
  END IF;

  FOR f IN SELECT value FROM jsonb_array_elements(_files) LOOP
    SELECT id, user_id, guest_token, order_id INTO r
      FROM public.order_files WHERE path = f->>'path' AND bucket = 'client-artwork' FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'file_missing'; END IF;
    tok := lower(nullif(f->>'guestToken', ''));
    IF r.user_id IS NOT NULL THEN
      IF _user IS NULL OR r.user_id <> _user THEN RAISE EXCEPTION 'file_forbidden'; END IF;
    ELSIF r.guest_token IS NULL OR tok IS NULL OR r.guest_token::text <> tok THEN
      RAISE EXCEPTION 'file_forbidden';
    END IF;
    IF r.order_id IS NOT NULL AND r.order_id <> o.id THEN RAISE EXCEPTION 'file_already_attached'; END IF;

    UPDATE public.order_files
       SET order_id = o.id, order_reference = o.reference, status = 'attached',
           user_id = coalesce(user_id, _user),
           guest_token = CASE WHEN _user IS NOT NULL THEN NULL ELSE guest_token END
     WHERE id = r.id AND (order_id IS NULL OR order_id = o.id);
    GET DIAGNOSTICS cnt = ROW_COUNT;
    IF cnt <> 1 THEN RAISE EXCEPTION 'file_attach_failed'; END IF;
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.attach_order_files(uuid, uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.attach_order_files(uuid, uuid, text, jsonb) TO service_role;

-- Staff list of uploads not linked to any order (service role only).
CREATE OR REPLACE FUNCTION public.admin_unlinked_uploads(_limit integer, _offset integer)
RETURNS TABLE(id uuid, file_name text, mime_type text, size_bytes bigint, created_at timestamptz,
              uploader_name text, uploader_email text, uploader_phone text, contact_source text,
              account_name text, account_email text, total_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT f.id, f.file_name, f.mime_type, f.size_bytes, f.created_at,
         f.uploader_name, f.uploader_email, f.uploader_phone, f.contact_source,
         p.full_name, coalesce(p.email, u.email::text),
         count(*) OVER ()
    FROM public.order_files f
    LEFT JOIN public.profiles p ON p.id = f.user_id
    LEFT JOIN auth.users u ON u.id = f.user_id
   WHERE f.order_id IS NULL AND f.bucket = 'client-artwork'
   ORDER BY f.created_at DESC
   LIMIT least(greatest(coalesce(_limit, 25), 1), 100) OFFSET greatest(coalesce(_offset, 0), 0)
$$;
REVOKE ALL ON FUNCTION public.admin_unlinked_uploads(integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_unlinked_uploads(integer, integer) TO service_role;