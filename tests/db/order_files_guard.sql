-- DB regression test for order_files ownership guard.
-- Runs entirely inside one transaction and always ends with an exception, so every
-- fixture row is rolled back. Result is reported in the final exception message:
-- 'ORDER_FILES_GUARD_TEST PASS ...'. Last live run (2026-10-01): PASS 11/11 incl. reference-only variant.
-- Note: look up foreign references BEFORE switching to the customer role (RLS hides them). or 'ORDER_FILES_GUARD_TEST FAIL: <case>'.
DO $$
DECLARE
  a uuid; b uuid; order_a uuid; order_b uuid; file_a uuid; ok int := 0; ref_a text; ref_b text;
BEGIN
  SELECT id INTO a FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO b FROM auth.users WHERE id <> a ORDER BY created_at LIMIT 1;
  IF a IS NULL OR b IS NULL THEN RAISE EXCEPTION 'ORDER_FILES_GUARD_TEST SKIP: need two users'; END IF;

  -- Fixtures created as service role (guard-exempt).
  ref_a := 'TST-A-' || gen_random_uuid(); ref_b := 'TST-B-' || gen_random_uuid();
  INSERT INTO public.orders (user_id, reference, payment_method) VALUES (a, ref_a, 'card_youcanpay') RETURNING id INTO order_a;
  INSERT INTO public.orders (user_id, reference, payment_method) VALUES (b, ref_b, 'card_youcanpay') RETURNING id INTO order_b;

  -- Act as customer A.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.sub', a::text, true);
  PERFORM set_config('role', 'authenticated', true);

  -- 1. Valid own draft upload.
  INSERT INTO public.order_files (user_id, path, file_name) VALUES (a, a || '/drafts/x-ok.pdf', 'ok.pdf') RETURNING id INTO file_a;
  ok := ok + 1;

  -- 2. Forged path pointing to customer B's object.
  BEGIN
    INSERT INTO public.order_files (user_id, path, file_name) VALUES (a, b || '/drafts/victim.pdf', 'v.pdf');
    RAISE EXCEPTION 'ORDER_FILES_GUARD_TEST FAIL: forged foreign path accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'ORDER_FILES_GUARD_TEST%' THEN RAISE; END IF; ok := ok + 1;
  END;

  -- 3. Forged guest path.
  BEGIN
    INSERT INTO public.order_files (user_id, path, file_name) VALUES (a, 'guest/' || gen_random_uuid() || '/x.pdf', 'g.pdf');
    RAISE EXCEPTION 'ORDER_FILES_GUARD_TEST FAIL: forged guest path accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'ORDER_FILES_GUARD_TEST%' THEN RAISE; END IF; ok := ok + 1;
  END;

  -- 4. Other bucket.
  BEGIN
    INSERT INTO public.order_files (user_id, bucket, path, file_name) VALUES (a, 'other', a || '/x.pdf', 'b.pdf');
    RAISE EXCEPTION 'ORDER_FILES_GUARD_TEST FAIL: other bucket accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'ORDER_FILES_GUARD_TEST%' THEN RAISE; END IF; ok := ok + 1;
  END;

  -- 5. Cross-order linking to B's order.
  BEGIN
    UPDATE public.order_files SET order_id = order_b, status = 'attached' WHERE id = file_a;
    RAISE EXCEPTION 'ORDER_FILES_GUARD_TEST FAIL: linked to foreign order';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'ORDER_FILES_GUARD_TEST%' THEN RAISE; END IF; ok := ok + 1;
  END;

  -- 6. Own order with mismatched (foreign) reference.
  BEGIN
    UPDATE public.order_files SET order_id = order_a, order_reference = ref_b WHERE id = file_a;
    RAISE EXCEPTION 'ORDER_FILES_GUARD_TEST FAIL: foreign reference accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'ORDER_FILES_GUARD_TEST%' THEN RAISE; END IF; ok := ok + 1;
  END;

  -- 7. Path rewrite after insert.
  BEGIN
    UPDATE public.order_files SET path = b || '/drafts/victim.pdf' WHERE id = file_a;
    RAISE EXCEPTION 'ORDER_FILES_GUARD_TEST FAIL: path rewrite accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'ORDER_FILES_GUARD_TEST%' THEN RAISE; END IF; ok := ok + 1;
  END;

  -- 8. Valid attachFilesToOrder: own draft -> own order.
  UPDATE public.order_files SET order_id = order_a, order_reference = ref_a, status = 'attached' WHERE id = file_a;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_FILES_GUARD_TEST FAIL: valid attach rejected'; END IF;
  ok := ok + 1;

  -- 9. Customer cannot reassign order ownership / claim identity.
  BEGIN
    UPDATE public.orders SET claim_token = 'x' WHERE id = order_a;
    RAISE EXCEPTION 'ORDER_FILES_GUARD_TEST FAIL: claim_token change accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'ORDER_FILES_GUARD_TEST%' THEN RAISE; END IF; ok := ok + 1;
  END;

  -- 10. Server (non-client) path is guard-exempt, as used by guest claim.
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM set_config('request.jwt.claim.sub', '', true);
  UPDATE public.order_files SET user_id = b WHERE id = file_a;
  ok := ok + 1;

  RAISE EXCEPTION 'ORDER_FILES_GUARD_TEST PASS % / 10 (rolled back)', ok;
END $$;
