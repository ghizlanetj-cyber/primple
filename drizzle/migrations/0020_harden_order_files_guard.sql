CREATE OR REPLACE FUNCTION public.guard_order_files()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  -- Service role (guest upload, claim, admin) is exempt.
  IF coalesce(auth.role(), '') NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Sign in required to manage files';
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.guest_token := NULL;
    IF NEW.user_id IS DISTINCT FROM uid THEN
      RAISE EXCEPTION 'Files must belong to the signed-in user';
    END IF;
    IF NEW.bucket IS DISTINCT FROM 'client-artwork' THEN
      RAISE EXCEPTION 'Invalid file bucket';
    END IF;
    IF NEW.path IS NULL OR left(NEW.path, 37) <> uid::text || '/' OR NEW.path LIKE '%..%' THEN
      RAISE EXCEPTION 'File path must be inside your own folder';
    END IF;
  ELSE
    IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.path IS DISTINCT FROM OLD.path
       OR NEW.bucket IS DISTINCT FROM OLD.bucket OR NEW.guest_token IS DISTINCT FROM OLD.guest_token THEN
      RAISE EXCEPTION 'File ownership cannot be changed';
    END IF;
  END IF;

  IF NEW.order_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.orders o WHERE o.id = NEW.order_id AND o.user_id = uid
                   AND (NEW.order_reference IS NULL OR o.reference = NEW.order_reference)) THEN
      RAISE EXCEPTION 'Files can only be attached to your own orders';
    END IF;
  ELSIF NEW.order_reference IS NOT NULL
        AND (TG_OP = 'INSERT' OR NEW.order_reference IS DISTINCT FROM OLD.order_reference)
        AND NOT EXISTS (SELECT 1 FROM public.orders o WHERE o.reference = NEW.order_reference AND o.user_id = uid) THEN
    RAISE EXCEPTION 'Files can only be attached to your own orders';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_order_files() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS order_files_guard ON public.order_files;
CREATE TRIGGER order_files_guard BEFORE INSERT OR UPDATE ON public.order_files FOR EACH ROW EXECUTE FUNCTION public.guard_order_files();