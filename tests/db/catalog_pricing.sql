-- Catalog pricing permissions and versioning. Ends with RAISE so everything rolls back.
DO $$
DECLARE admin_id uuid; v int; n int; ok boolean;
BEGIN
  SELECT user_id INTO admin_id FROM public.user_roles WHERE role = 'admin' LIMIT 1;
  IF admin_id IS NULL THEN RAISE EXCEPTION 'FAIL no admin'; END IF;

  -- client grants: read only allowed columns, never write or call the RPC
  IF has_table_privilege('anon', 'public.catalog_pricing', 'INSERT') OR has_table_privilege('authenticated', 'public.catalog_pricing', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.catalog_pricing', 'DELETE') OR has_table_privilege('anon', 'public.catalog_pricing', 'TRUNCATE')
     OR has_table_privilege('authenticated', 'public.catalog_pricing', 'TRIGGER') THEN RAISE EXCEPTION 'FAIL client write grant'; END IF;
  IF has_column_privilege('anon', 'public.catalog_pricing', 'updated_by', 'SELECT') OR has_column_privilege('authenticated', 'public.catalog_pricing', 'updated_at', 'SELECT') THEN RAISE EXCEPTION 'FAIL staff columns public'; END IF;
  IF NOT has_column_privilege('anon', 'public.catalog_pricing', 'config', 'SELECT') THEN RAISE EXCEPTION 'FAIL public price read'; END IF;
  IF has_function_privilege('anon', 'public.admin_set_pricing(uuid,text,text,integer,jsonb)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.admin_set_pricing(uuid,text,text,integer,jsonb)', 'EXECUTE') THEN RAISE EXCEPTION 'FAIL client rpc'; END IF;
  RAISE NOTICE 'PASS grants';

  -- non-admin actor refused
  BEGIN PERFORM public.admin_set_pricing(gen_random_uuid(), 'product', 'flyers', 0, '{"a":1}'); RAISE EXCEPTION 'FAIL non-admin accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'forbidden' THEN RAISE; END IF; END;
  RAISE NOTICE 'PASS forbidden';

  v := public.admin_set_pricing(admin_id, 'internal', 'letterhead', 0, '{"unitPriceCents":200}');
  IF v <> 1 THEN RAISE EXCEPTION 'FAIL first version %', v; END IF;
  BEGIN PERFORM public.admin_set_pricing(admin_id, 'internal', 'letterhead', 0, '{"unitPriceCents":300}'); RAISE EXCEPTION 'FAIL stale accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'conflict' THEN RAISE; END IF; END;
  v := public.admin_set_pricing(admin_id, 'internal', 'letterhead', 1, '{"unitPriceCents":300}');
  IF v <> 2 THEN RAISE EXCEPTION 'FAIL second version'; END IF;
  RAISE NOTICE 'PASS versioning';

  SELECT count(*) INTO n FROM public.admin_audit_log WHERE entity_key = 'letterhead' AND action = 'catalog.pricing' AND at > now() - interval '1 minute';
  IF n < 2 THEN RAISE EXCEPTION 'FAIL audit %', n; END IF;
  RAISE NOTICE 'PASS audit';

  v := public.admin_set_pricing(admin_id, 'internal', 'letterhead', 2, NULL);
  SELECT EXISTS(SELECT 1 FROM public.catalog_pricing WHERE slug = 'letterhead') INTO ok;
  IF ok OR v <> 0 THEN RAISE EXCEPTION 'FAIL reset'; END IF;
  BEGIN PERFORM public.admin_set_pricing(admin_id, 'product', 'flyers', 0, '[1]'); RAISE EXCEPTION 'FAIL array accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'invalid_pricing' THEN RAISE; END IF; END;
  RAISE NOTICE 'PASS reset and shape';

  RAISE EXCEPTION 'ALL PASS (rolled back)';
END $$;
