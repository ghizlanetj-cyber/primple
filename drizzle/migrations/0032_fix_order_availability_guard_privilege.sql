CREATE OR REPLACE FUNCTION public.guard_order_availability()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF cardinality(public.catalog_unavailable(NEW.items)) > 0 THEN
    RAISE EXCEPTION 'catalog_unavailable';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_order_availability() FROM PUBLIC, anon, authenticated;