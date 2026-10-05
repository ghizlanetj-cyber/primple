-- DB regression test for the team dashboard (permissions, audit, money, availability).
-- Synthetic fixtures only, inside one transaction that always ends with an exception,
-- so every row (including synthetic auth users) is rolled back. Real roles are never changed.
-- Result: 'TEAM_DASHBOARD_TEST PASS n' or 'TEAM_DASHBOARD_TEST FAIL: <case>'.
DO $$
DECLARE
  adm uuid := gen_random_uuid(); tm uuid := gen_random_uuid(); cust uuid := gen_random_uuid(); other uuid := gen_random_uuid(); unconf uuid := gen_random_uuid();
  o1 uuid; o2 uuid; msg uuid; v int; ok int := 0; n int; m record; real_admin uuid; tag text := substr(gen_random_uuid()::text, 1, 8);
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, email_confirmed_at, created_at, updated_at)
  VALUES (adm, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'adm-' || tag || '@test.invalid', now(), now(), now()),
         (tm, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tm-' || tag || '@test.invalid', now(), now(), now()),
         (cust, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cu-' || tag || '@test.invalid', now(), now(), now()),
         (other, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ot-' || tag || '@test.invalid', now(), now(), now()),
         (unconf, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'un-' || tag || '@test.invalid', NULL, now(), now());
  INSERT INTO public.user_roles (user_id, role) VALUES (adm, 'admin');
  INSERT INTO public.orders (user_id, reference, email, payment_method, total, deposit_amount, balance_amount, deposit_paid, payment_status, status)
    VALUES (cust, 'TST-' || tag || '-1', 'cu-' || tag || '@test.invalid', 'deposit_50_cod', 200, 100, 100, true, 'paid', 'Delivered') RETURNING id INTO o1;
  INSERT INTO public.orders (user_id, reference, payment_method) VALUES (other, 'TST-' || tag || '-2', 'card_youcanpay') RETURNING id INTO o2;
  INSERT INTO public.contact_messages (name, email, topic, message) VALUES ('T', 'q-' || tag || '@test.invalid', 'quote', 'x') RETURNING id INTO msg;
  INSERT INTO public.message_meta (message_id, classification) VALUES (msg, 'quote') ON CONFLICT (message_id) DO UPDATE SET classification = 'quote';

  -- 1. Admin grants team to a confirmed user; unconfirmed and bad roles fail.
  PERFORM public.admin_grant_member(adm, 'TM-' || tag || '@test.invalid', 'team', 'Team T');
  IF public.staff_role_of(tm) <> 'team' THEN RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: grant team'; END IF; ok := ok + 1;
  BEGIN PERFORM public.admin_grant_member(adm, 'un-' || tag || '@test.invalid', 'team', NULL); RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: unconfirmed granted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEAM_DASHBOARD_TEST%' THEN RAISE; END IF; ok := ok + 1; END;
  BEGIN PERFORM public.admin_grant_member(adm, 'cu-' || tag || '@test.invalid', 'moderator', NULL); RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: moderator via team mgmt';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEAM_DASHBOARD_TEST%' THEN RAISE; END IF; ok := ok + 1; END;

  -- 2. Team cannot escalate, change availability, record money.
  BEGIN PERFORM public.admin_grant_member(tm, 'tm-' || tag || '@test.invalid', 'admin', NULL); RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: team self-admin';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEAM_DASHBOARD_TEST%' THEN RAISE; END IF; ok := ok + 1; END;
  BEGIN PERFORM public.admin_set_availability(tm, 'product', 'flyers', false, NULL); RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: team availability';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEAM_DASHBOARD_TEST%' THEN RAISE; END IF; ok := ok + 1; END;
  BEGIN PERFORM public.admin_record_balance(tm, o1, false, NULL); RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: team balance';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEAM_DASHBOARD_TEST%' THEN RAISE; END IF; ok := ok + 1; END;
  BEGIN PERFORM public.admin_update_order_ops(cust, o1, NULL, '{"ops_stage":"in_production"}'); RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: customer ops';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEAM_DASHBOARD_TEST%' THEN RAISE; END IF; ok := ok + 1; END;

  -- 3. Team ops update with assignment, audit, conflict, invalid assignee, missing order.
  v := public.admin_update_order_ops(tm, o1, NULL, jsonb_build_object('ops_stage', 'in_production', 'assigned_to', tm));
  IF (SELECT status FROM public.orders WHERE id = o1) <> 'In production' THEN RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: status sync'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.admin_audit_log WHERE entity_key = o1::text AND actor_id = tm AND changes ? 'assigned_to') THEN RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: audit'; END IF; ok := ok + 1;
  BEGIN PERFORM public.admin_update_order_ops(tm, o1, v - 1, '{"ops_stage":"ready"}'); RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: stale version accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEAM_DASHBOARD_TEST%' THEN RAISE; END IF; IF SQLERRM <> 'conflict' THEN RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: conflict code %', SQLERRM; END IF; ok := ok + 1; END;
  BEGIN PERFORM public.admin_update_order_ops(tm, o1, NULL, jsonb_build_object('assigned_to', cust)); RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: customer assignee';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEAM_DASHBOARD_TEST%' THEN RAISE; END IF; ok := ok + 1; END;
  BEGIN PERFORM public.admin_update_order_ops(tm, gen_random_uuid(), NULL, '{}'); RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: missing order';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEAM_DASHBOARD_TEST%' THEN RAISE; END IF; ok := ok + 1; END;

  -- 4. Notes are append-only.
  PERFORM public.admin_add_note(tm, 'order', o1::text, 'Appel client');
  BEGIN UPDATE public.admin_notes SET body = 'x' WHERE entity_key = o1::text; RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: note updated';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEAM_DASHBOARD_TEST%' THEN RAISE; END IF; ok := ok + 1; END;
  BEGIN DELETE FROM public.admin_audit_log WHERE entity_key = o1::text; RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: audit deleted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEAM_DASHBOARD_TEST%' THEN RAISE; END IF; ok := ok + 1; END;

  -- 5. Quote transitions.
  PERFORM public.admin_update_message(tm, msg, NULL, '{"quote_stage":"proposal","is_read":true}');
  IF (SELECT stage_changed_at FROM public.message_meta WHERE message_id = msg) IS NULL THEN RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: stage time'; END IF; ok := ok + 1;
  BEGIN PERFORM public.admin_update_message(tm, msg, NULL, '{"quote_stage":"paid"}'); RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: invalid stage';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEAM_DASHBOARD_TEST%' THEN RAISE; END IF; ok := ok + 1; END;

  -- 6. Money: Delivered alone is never collected.
  SELECT * INTO m FROM public.admin_order_money() WHERE order_id = o1;
  IF m.collected <> 100 OR m.outstanding <> 100 OR m.courier_held <> 0 THEN RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: delivered counted as collected %', row_to_json(m); END IF; ok := ok + 1;
  PERFORM public.admin_record_balance(adm, o1, false, NULL);
  SELECT * INTO m FROM public.admin_order_money() WHERE order_id = o1;
  IF m.collected <> 100 OR m.courier_held <> 100 OR m.outstanding <> 0 THEN RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: courier held'; END IF; ok := ok + 1;
  PERFORM public.admin_record_balance(adm, o1, true, NULL);
  SELECT * INTO m FROM public.admin_order_money() WHERE order_id = o1;
  IF m.collected <> 200 OR m.courier_held <> 0 THEN RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: remitted'; END IF; ok := ok + 1;

  -- 7. Availability is enforced on order insert.
  PERFORM public.admin_set_availability(adm, 'pack', 'restaurant', false, 'test');
  IF NOT ('pack-restaurant' = ANY (public.catalog_unavailable('[{"slug":"pack-restaurant"}]'))) THEN RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: unavailable fn'; END IF;
  BEGIN INSERT INTO public.orders (user_id, reference, items) VALUES (cust, 'TST-' || tag || '-3', '[{"slug":"pack-restaurant","quantity":1}]'); RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: unavailable order accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEAM_DASHBOARD_TEST%' THEN RAISE; END IF; ok := ok + 1; END;

  -- 8. Last admin preserved (checked before any delete); synthetic admin revocation works when another admin exists.
  SELECT count(*) INTO n FROM public.user_roles WHERE role = 'admin';
  IF n >= 2 THEN PERFORM public.admin_revoke_member(adm, adm, 'admin'); END IF;
  BEGIN
    SELECT user_id INTO real_admin FROM public.user_roles WHERE role = 'admin' LIMIT 1;
    IF real_admin IS NULL THEN real_admin := adm; END IF;
    PERFORM public.admin_revoke_member(CASE WHEN real_admin = adm THEN adm ELSE real_admin END, real_admin, 'admin');
    RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: last admin removed';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEAM_DASHBOARD_TEST%' THEN RAISE; END IF; IF SQLERRM <> 'last_admin' THEN RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: last admin code %', SQLERRM; END IF; ok := ok + 1; END;
  -- restore synthetic admin for later cases
  INSERT INTO public.user_roles (user_id, role) VALUES (adm, 'admin') ON CONFLICT DO NOTHING;

  -- 9. Customer (authenticated) cannot reach internal data or privileged functions.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', cust, 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.sub', cust::text, true);
  PERFORM set_config('role', 'authenticated', true);
  IF public.my_staff_role() IS NOT NULL THEN RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: customer staff role'; END IF; ok := ok + 1;
  SELECT count(*) INTO n FROM public.team_members; IF n <> 0 THEN RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: customer sees team'; END IF; ok := ok + 1;
  SELECT count(*) INTO n FROM public.orders WHERE id = o2; IF n <> 0 THEN RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: cross-customer order'; END IF; ok := ok + 1;
  BEGIN PERFORM 1 FROM public.admin_notes; RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: customer reads notes';
  EXCEPTION WHEN insufficient_privilege THEN ok := ok + 1; END;
  BEGIN PERFORM 1 FROM public.order_ops; RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: customer reads ops';
  EXCEPTION WHEN insufficient_privilege THEN ok := ok + 1; END;
  BEGIN PERFORM public.admin_update_order_ops(cust, o1, NULL, '{}'); RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: customer executes rpc';
  EXCEPTION WHEN insufficient_privilege THEN ok := ok + 1; END;
  BEGIN PERFORM public.admin_report(now() - interval '1 day', now()); RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: customer report';
  EXCEPTION WHEN insufficient_privilege THEN ok := ok + 1; END;
  BEGIN INSERT INTO public.team_members (user_id, email) VALUES (cust, 'x'); RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: forged membership';
  EXCEPTION WHEN insufficient_privilege THEN ok := ok + 1; END;
  BEGIN INSERT INTO public.user_roles (user_id, role) VALUES (cust, 'admin'); RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: self admin';
  EXCEPTION WHEN insufficient_privilege OR check_violation OR raise_exception THEN IF SQLERRM LIKE 'TEAM_DASHBOARD_TEST%' THEN RAISE; END IF; ok := ok + 1; END;
  BEGIN UPDATE public.catalog_availability SET available = true; GET DIAGNOSTICS n = ROW_COUNT; IF n > 0 THEN RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: customer availability'; END IF; ok := ok + 1;
  EXCEPTION WHEN insufficient_privilege THEN ok := ok + 1; END;

  -- 10. Team member reads only its own membership row.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', tm, 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.sub', tm::text, true);
  IF public.my_staff_role() <> 'team' THEN RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: team role'; END IF;
  SELECT count(*) INTO n FROM public.team_members; IF n <> 1 THEN RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: team sees others'; END IF; ok := ok + 1;

  -- 11. Anonymous.
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('role', 'anon', true);
  BEGIN PERFORM 1 FROM public.team_members; RAISE EXCEPTION 'TEAM_DASHBOARD_TEST FAIL: anon team';
  EXCEPTION WHEN insufficient_privilege THEN ok := ok + 1; END;
  SELECT count(*) INTO n FROM public.catalog_availability; ok := ok + 1; -- public read allowed

  RAISE EXCEPTION 'TEAM_DASHBOARD_TEST PASS %', ok;
END $$;
