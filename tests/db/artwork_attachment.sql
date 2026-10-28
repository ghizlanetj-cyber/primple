-- Rollback-only regression suite. Success is deliberately raised so every fixture
-- is rolled back, even when this file is run through a database query console.
DO $$
DECLARE
  a uuid; b uuid; oa uuid := gen_random_uuid(); oa2 uuid := gen_random_uuid(); og uuid := gen_random_uuid();
  owned uuid := gen_random_uuid(); foreign_file uuid := gen_random_uuid(); guest uuid := gen_random_uuid(); transition uuid := gen_random_uuid(); draft uuid := gen_random_uuid();
  tok uuid := gen_random_uuid(); tok2 uuid := gen_random_uuid(); prefix text := 'artwork-test/' || gen_random_uuid() || '/';
  ok integer := 0; n integer; c record;
BEGIN
  SELECT id INTO a FROM auth.users ORDER BY id LIMIT 1;
  SELECT id INTO b FROM auth.users WHERE id <> a ORDER BY id LIMIT 1;
  IF a IS NULL OR b IS NULL THEN RAISE EXCEPTION 'ARTWORK_TEST SKIP: need two fixture users'; END IF;
  INSERT INTO public.orders(id, user_id, reference, claim_token) VALUES
    (oa,a,'TST-'||oa,NULL),(oa2,a,'TST-'||oa2,NULL),(og,NULL,'TST-'||og,'guest-claim');
  INSERT INTO public.order_files(id,user_id,guest_token,bucket,path,file_name) VALUES
    (owned,a,NULL,'client-artwork',prefix||'owned','Owned.pdf'),
    (foreign_file,b,NULL,'client-artwork',prefix||'foreign','Foreign.pdf'),
    (guest,NULL,tok,'client-artwork',prefix||'guest','Guest.pdf'),
    (transition,NULL,tok2,'client-artwork',prefix||'transition','Transition.pdf'),
    (draft,a,NULL,'client-artwork',prefix||'draft','Draft.pdf');

  n := public.attach_order_files(oa,a,NULL,jsonb_build_array(jsonb_build_object('path',prefix||'owned')));
  IF n <> 1 OR NOT EXISTS(SELECT 1 FROM public.order_files WHERE id=owned AND order_id=oa AND status='attached') THEN RAISE EXCEPTION 'ARTWORK_TEST FAIL own attach'; END IF; ok:=ok+1;
  n := public.attach_order_files(oa,a,NULL,jsonb_build_array(jsonb_build_object('path',prefix||'owned')));
  IF n <> 1 THEN RAISE EXCEPTION 'ARTWORK_TEST FAIL idempotency'; END IF; ok:=ok+1;

  FOR c IN SELECT * FROM (VALUES
    (oa2,a,NULL::text,prefix||'owned',NULL::text,'file_already_attached'),
    (oa,b,NULL::text,prefix||'foreign',NULL::text,'order_forbidden'),
    (oa,a,NULL::text,prefix||'foreign',NULL::text,'file_forbidden'),
    (oa,a,NULL::text,prefix||'missing',NULL::text,'file_missing'),
    (og,NULL::uuid,'wrong-claim',prefix||'guest',tok::text,'order_forbidden'),
    (og,NULL::uuid,'guest-claim',prefix||'guest',gen_random_uuid()::text,'file_forbidden')
  ) AS cases(order_id, actor, claim, path, token, expected) LOOP
    BEGIN
      PERFORM public.attach_order_files(c.order_id,c.actor,c.claim,jsonb_build_array(jsonb_build_object('path',c.path,'guestToken',c.token)));
      RAISE EXCEPTION 'ARTWORK_TEST FAIL expected %',c.expected;
    EXCEPTION WHEN raise_exception THEN
      IF SQLERRM <> c.expected THEN RAISE; END IF; ok:=ok+1;
    END;
  END LOOP;

  n := public.attach_order_files(og,NULL,'guest-claim',jsonb_build_array(jsonb_build_object('path',prefix||'guest','guestToken',tok)));
  IF n<>1 THEN RAISE EXCEPTION 'ARTWORK_TEST FAIL guest attach'; END IF; ok:=ok+1;
  n := public.attach_order_files(og,NULL,'guest-claim',jsonb_build_array(jsonb_build_object('path',prefix||'guest','guestToken',tok)));
  IF n<>1 THEN RAISE EXCEPTION 'ARTWORK_TEST FAIL guest retry'; END IF; ok:=ok+1;
  n := public.attach_order_files(oa,a,NULL,jsonb_build_array(jsonb_build_object('path',prefix||'transition','guestToken',tok2)));
  IF n<>1 OR NOT EXISTS(SELECT 1 FROM public.order_files WHERE id=transition AND user_id=a AND guest_token IS NULL AND order_id=oa) THEN RAISE EXCEPTION 'ARTWORK_TEST FAIL guest login transition'; END IF; ok:=ok+1;
  n := public.attach_order_files(oa,a,NULL,jsonb_build_array(jsonb_build_object('path',prefix||'transition','guestToken',tok2)));
  IF n<>1 THEN RAISE EXCEPTION 'ARTWORK_TEST FAIL transition retry'; END IF; ok:=ok+1;

  BEGIN
    PERFORM public.attach_order_files(oa,a,NULL,jsonb_build_array(jsonb_build_object('path',prefix||'draft'),jsonb_build_object('path',prefix||'foreign')));
    RAISE EXCEPTION 'ARTWORK_TEST FAIL partial attach accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'file_forbidden' THEN RAISE; END IF;
  END;
  IF EXISTS(SELECT 1 FROM public.order_files WHERE id=draft AND order_id IS NOT NULL) THEN RAISE EXCEPTION 'ARTWORK_TEST FAIL partial write retained'; END IF; ok:=ok+1;

  IF has_function_privilege('anon','public.attach_order_files(uuid,uuid,text,jsonb)','EXECUTE') OR has_function_privilege('authenticated','public.attach_order_files(uuid,uuid,text,jsonb)','EXECUTE')
     OR has_function_privilege('anon','public.admin_unlinked_uploads(integer,integer)','EXECUTE') OR has_function_privilege('authenticated','public.admin_unlinked_uploads(integer,integer)','EXECUTE') THEN RAISE EXCEPTION 'ARTWORK_TEST FAIL public RPC access'; END IF; ok:=ok+1;

  PERFORM set_config('request.jwt.claim.role','authenticated',true);
  PERFORM set_config('request.jwt.claim.sub',a::text,true);
  PERFORM set_config('request.jwt.claims',json_build_object('sub',a,'role','authenticated')::text,true);
  BEGIN
    UPDATE public.order_files SET order_id=oa2,order_reference='TST-'||oa2 WHERE id=owned;
    RAISE EXCEPTION 'ARTWORK_TEST FAIL direct reassignment';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Attached files cannot be reassigned' THEN RAISE; END IF;
  END; ok:=ok+1;
  UPDATE public.order_files SET uploader_email='spoof@example.com',contact_source='guest_form' WHERE id=draft;
  IF EXISTS(SELECT 1 FROM public.order_files WHERE id=draft AND uploader_email IS NOT NULL) THEN RAISE EXCEPTION 'ARTWORK_TEST FAIL contact spoof'; END IF; ok:=ok+1;

  RAISE EXCEPTION 'ARTWORK_TEST PASS %/16 (all fixtures rolled back)',ok;
END $$;

