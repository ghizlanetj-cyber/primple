CREATE OR REPLACE FUNCTION public.admin_set_pricing(_actor uuid, _kind text, _slug text, _expected integer, _config jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE prev public.catalog_pricing; next_version integer; next_config jsonb;
BEGIN
  IF coalesce(public.staff_role_of(_actor), '') <> 'admin' THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _kind NOT IN ('product','pack','internal') OR _slug !~ '^[a-z0-9-]{1,60}$' THEN RAISE EXCEPTION 'not_found'; END IF;
  IF _config IS NOT NULL AND (jsonb_typeof(_config) <> 'object' OR pg_column_size(_config) >= 20000) THEN RAISE EXCEPTION 'invalid_pricing'; END IF;
  -- Serializes writers even when no row exists yet (FOR UPDATE cannot lock an absent row).
  PERFORM pg_advisory_xact_lock(hashtext('catalog_pricing:' || _kind || ':' || _slug));
  SELECT * INTO prev FROM public.catalog_pricing WHERE kind = _kind AND slug = _slug FOR UPDATE;
  IF coalesce(prev.version, 0) <> coalesce(_expected, -1) THEN RAISE EXCEPTION 'conflict'; END IF;
  next_version := coalesce(prev.version, 0) + 1;
  -- Reset keeps a tombstone ({} = source defaults) so versions never go back.
  next_config := coalesce(_config, '{}'::jsonb);
  INSERT INTO public.catalog_pricing (kind, slug, config, version, updated_by, updated_at)
  VALUES (_kind, _slug, next_config, next_version, _actor, now())
  ON CONFLICT (kind, slug) DO UPDATE SET config = EXCLUDED.config, version = EXCLUDED.version, updated_by = _actor, updated_at = now();
  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_key, changes)
  VALUES (_actor, CASE WHEN next_config = '{}'::jsonb THEN 'catalog.pricing_reset' ELSE 'catalog.pricing' END, _kind, _slug,
    jsonb_build_object('from', prev.config, 'to', next_config, 'version', next_version));
  RETURN next_version;
END $$;
REVOKE ALL ON FUNCTION public.admin_set_pricing(uuid, text, text, integer, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_pricing(uuid, text, text, integer, jsonb) TO service_role;
COMMENT ON TABLE public.catalog_pricing IS 'Admin pricing overrides. Missing row or config {} = source defaults. Versions are monotonic. Public columns: kind, slug, config, version.';