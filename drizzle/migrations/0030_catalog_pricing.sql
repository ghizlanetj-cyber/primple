CREATE TABLE public.catalog_pricing (
  kind text NOT NULL CHECK (kind IN ('product','pack','internal')),
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9-]{1,60}$'),
  config jsonb NOT NULL CHECK (jsonb_typeof(config) = 'object' AND pg_column_size(config) < 20000),
  version integer NOT NULL DEFAULT 1,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kind, slug)
);
REVOKE ALL ON public.catalog_pricing FROM PUBLIC, anon, authenticated;
GRANT SELECT (kind, slug, config, version) ON public.catalog_pricing TO anon, authenticated;
GRANT ALL ON public.catalog_pricing TO service_role;
ALTER TABLE public.catalog_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads live prices" ON public.catalog_pricing FOR SELECT TO anon, authenticated USING (true);
COMMENT ON TABLE public.catalog_pricing IS 'Admin pricing overrides. Missing row = source defaults. Public columns: kind, slug, config, version.';

CREATE OR REPLACE FUNCTION public.admin_set_pricing(_actor uuid, _kind text, _slug text, _expected integer, _config jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE prev public.catalog_pricing; next_version integer;
BEGIN
  IF coalesce(public.staff_role_of(_actor), '') <> 'admin' THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _kind NOT IN ('product','pack','internal') OR _slug !~ '^[a-z0-9-]{1,60}$' THEN RAISE EXCEPTION 'not_found'; END IF;
  IF _config IS NOT NULL AND (jsonb_typeof(_config) <> 'object' OR pg_column_size(_config) >= 20000) THEN RAISE EXCEPTION 'invalid_pricing'; END IF;
  SELECT * INTO prev FROM public.catalog_pricing WHERE kind = _kind AND slug = _slug FOR UPDATE;
  IF coalesce(prev.version, 0) <> coalesce(_expected, -1) THEN RAISE EXCEPTION 'conflict'; END IF;
  next_version := coalesce(prev.version, 0) + 1;
  IF _config IS NULL THEN
    DELETE FROM public.catalog_pricing WHERE kind = _kind AND slug = _slug;
    next_version := 0;
  ELSE
    INSERT INTO public.catalog_pricing (kind, slug, config, version, updated_by, updated_at)
    VALUES (_kind, _slug, _config, next_version, _actor, now())
    ON CONFLICT (kind, slug) DO UPDATE SET config = EXCLUDED.config, version = EXCLUDED.version, updated_by = _actor, updated_at = now();
  END IF;
  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_key, changes)
  VALUES (_actor, CASE WHEN _config IS NULL THEN 'catalog.pricing_reset' ELSE 'catalog.pricing' END, _kind, _slug,
    jsonb_build_object('from', prev.config, 'to', _config, 'version', next_version));
  RETURN next_version;
END $$;
REVOKE ALL ON FUNCTION public.admin_set_pricing(uuid, text, text, integer, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_pricing(uuid, text, text, integer, jsonb) TO service_role;
