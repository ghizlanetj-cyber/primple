-- Every fixture and temporary identity role is rolled back by the final exception.
DO $$
DECLARE adm uuid; tm uuid; cust uuid; tag text:=substr(gen_random_uuid()::text,1,8);
 o uuid; sh uuid; g uuid; v int; n int; ok int:=0; summary jsonb; q jsonb; z record;
BEGIN
 SELECT user_id INTO adm FROM public.user_roles WHERE role='admin' LIMIT 1;
 SELECT p.id INTO tm FROM public.profiles p WHERE NOT EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=p.id) LIMIT 1;
 SELECT p.id INTO cust FROM public.profiles p WHERE p.id<>tm AND NOT EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=p.id) LIMIT 1;
 IF adm IS NULL OR tm IS NULL OR cust IS NULL THEN RAISE EXCEPTION 'REVIEW_TEST SKIP: fixture identities unavailable'; END IF;
 INSERT INTO public.team_members(user_id,email) SELECT id,email FROM public.profiles WHERE id=tm;
 -- ALL inherited table privileges (including TRUNCATE/TRIGGER/MAINTAIN) must be removed.
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace ns ON ns.oid=c.relnamespace CROSS JOIN LATERAL aclexplode(c.relacl) a
 WHERE ns.nspname='public' AND c.relkind IN ('r','p') AND (a.grantee=0 OR a.grantee::regrole::text IN ('anon','authenticated')) AND a.privilege_type IN ('TRUNCATE','TRIGGER','MAINTAIN')) THEN RAISE EXCEPTION 'REVIEW_TEST FAIL: inherited unsafe grants'; END IF;ok:=ok+1;
 FOR z IN SELECT p.oid,p.proname FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace WHERE ns.nspname='public' AND p.proname LIKE 'admin_%' LOOP
  IF has_function_privilege('anon',z.oid,'EXECUTE') OR has_function_privilege('authenticated',z.oid,'EXECUTE') THEN RAISE EXCEPTION 'REVIEW_TEST FAIL: public RPC %',z.proname;END IF;
 END LOOP;ok:=ok+1;
 IF has_column_privilege('anon','public.catalog_availability','note','SELECT') OR has_column_privilege('authenticated','public.catalog_availability','updated_by','SELECT') THEN RAISE EXCEPTION 'REVIEW_TEST FAIL: private availability metadata';END IF;ok:=ok+1;
 BEGIN TRUNCATE public.admin_audit_log;RAISE EXCEPTION 'REVIEW_TEST FAIL: audit truncate';EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'append_only' THEN RAISE;END IF;ok:=ok+1;END;
 BEGIN TRUNCATE public.admin_notes;RAISE EXCEPTION 'REVIEW_TEST FAIL: notes truncate';EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'append_only' THEN RAISE;END IF;ok:=ok+1;END;
 -- Literal underscore/percent emails cannot match other customers. Totals have no 100-row cap.
 INSERT INTO public.orders(reference,email,guest_email,total,deposit_paid,payment_status) VALUES('RV-'||tag||'-literal','a_'||tag||'@test.invalid','a_'||tag||'@test.invalid',50,true,'paid') RETURNING id INTO o;
 INSERT INTO public.orders(reference,email,guest_email) VALUES('RV-'||tag||'-similar','ax'||tag||'@test.invalid','ax'||tag||'@test.invalid');
 SELECT count(*) INTO n FROM public.admin_customer_orders('a_'||tag||'@test.invalid',100,0);IF n<>1 THEN RAISE EXCEPTION 'REVIEW_TEST FAIL: underscore';END IF;ok:=ok+1;
 INSERT INTO public.orders(reference,email,guest_email) VALUES('RV-'||tag||'-percent','b%'||tag||'@test.invalid','b%'||tag||'@test.invalid');
 SELECT count(*) INTO n FROM public.admin_customer_orders('b%'||tag||'@test.invalid',100,0);IF n<>1 THEN RAISE EXCEPTION 'REVIEW_TEST FAIL: percent';END IF;ok:=ok+1;
 FOR n IN 1..120 LOOP
  INSERT INTO public.orders(reference,email,guest_email,created_at) VALUES('RV-'||tag||'-cap-'||n,'cap-'||n||'-'||tag||'@test.invalid','cap-'||n||'-'||tag||'@test.invalid',now()+interval '1 second');
 END LOOP;
 summary:=public.admin_customer_summary('a_'||tag||'@test.invalid');IF summary IS NULL OR (summary->>'orders')::int<>1 OR (summary->>'order_value')::numeric<>50 THEN RAISE EXCEPTION 'REVIEW_TEST FAIL: capped summary';END IF;ok:=ok+1;
 -- Linked orders with changed contact emails remain attached to the profile.
 INSERT INTO public.orders(user_id,reference,email) VALUES(cust,'RV-'||tag||'-linked','changed-'||tag||'@test.invalid') RETURNING id INTO g;
 IF NOT EXISTS(SELECT 1 FROM public.admin_customer_orders((SELECT email FROM public.profiles WHERE id=cust),100,0) WHERE id=g) THEN RAISE EXCEPTION 'REVIEW_TEST FAIL: linked history';END IF;ok:=ok+1;
 -- Cancelling never leaves balance/late/payment actions, and never executes a refund.
 UPDATE public.orders SET total=200,deposit_amount=100,balance_amount=100,deposit_paid=true,payment_status='paid',expected_at=current_date-5 WHERE id=o;
 PERFORM public.admin_update_order_ops(tm,o,NULL,'{"ops_stage":"refunded"}');
 IF (SELECT outstanding FROM public.admin_order_money() WHERE order_id=o)<>0 OR (SELECT payment_status FROM public.orders WHERE id=o)<>'paid' OR (SELECT status FROM public.orders WHERE id=o)<>'Cancelled' THEN RAISE EXCEPTION 'REVIEW_TEST FAIL: cancellation money';END IF;ok:=ok+1;
 q:=public.admin_action_queue();IF (q->'late') @> jsonb_build_array(jsonb_build_object('id',o)) OR (q->'missingFiles') @> jsonb_build_array(jsonb_build_object('id',o)) THEN RAISE EXCEPTION 'REVIEW_TEST FAIL: cancelled action';END IF;ok:=ok+1;
 -- Shop ops, notes and audits are atomic, versioned, and do not alter payment truth.
 INSERT INTO public.shop_orders(reference,amount_cents,currency,status,customer_email,customer_name,items) VALUES('RV-'||tag||'-shop',12345,'MAD','paid','a_'||tag||'@test.invalid','Fixture','[]') RETURNING id INTO sh;
 v:=public.admin_update_shop_ops(tm,sh,NULL,jsonb_build_object('ops_stage','shipped','assigned_to',tm));
 IF NOT EXISTS(SELECT 1 FROM public.admin_audit_log WHERE entity_type='shop_order' AND entity_key=sh::text AND actor_id=tm) OR (SELECT status FROM public.shop_orders WHERE id=sh)<>'paid' THEN RAISE EXCEPTION 'REVIEW_TEST FAIL: shop audit/payment';END IF;ok:=ok+1;
 BEGIN PERFORM public.admin_update_shop_ops(tm,sh,v-1,'{"ops_stage":"ready"}');RAISE EXCEPTION 'REVIEW_TEST FAIL: shop conflict';EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'conflict' THEN RAISE;END IF;ok:=ok+1;END;
 BEGIN PERFORM public.admin_update_shop_ops(cust,sh,NULL,'{}');RAISE EXCEPTION 'REVIEW_TEST FAIL: customer shop write';EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'forbidden' THEN RAISE;END IF;ok:=ok+1;END;
 PERFORM public.admin_add_note(tm,'shop_order',sh::text,'Test note');ok:=ok+1;
 summary:=public.admin_customer_summary('a_'||tag||'@test.invalid');IF (summary->>'shop_orders')::int<>1 OR (summary->>'shop_value')::numeric<>123.45 THEN RAISE EXCEPTION 'REVIEW_TEST FAIL: shop totals';END IF;ok:=ok+1;
 -- Existing manual payment transition and audit are idempotent and reject team.
 INSERT INTO public.orders(reference,payment_method,payment_status,total,deposit_amount) VALUES('RV-'||tag||'-bank','bank_transfer','awaiting_transfer',50,50) RETURNING id INTO g;
 BEGIN PERFORM public.admin_confirm_manual_payment(tm,g,ARRAY['bank_transfer']);RAISE EXCEPTION 'REVIEW_TEST FAIL: team manual payment';EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'forbidden' THEN RAISE;END IF;ok:=ok+1;END;
 PERFORM public.admin_confirm_manual_payment(adm,g,ARRAY['bank_transfer']);
 IF (SELECT count(*) FROM public.admin_audit_log WHERE action='payment.manual_confirm' AND entity_key=g::text)<>1 OR (SELECT payment_status FROM public.orders WHERE id=g)<>'paid' THEN RAISE EXCEPTION 'REVIEW_TEST FAIL: atomic manual audit';END IF;ok:=ok+1;
 IF public.admin_confirm_manual_payment(adm,g,ARRAY['bank_transfer']) IS NOT NULL THEN RAISE EXCEPTION 'REVIEW_TEST FAIL: repeat confirmation';END IF;ok:=ok+1;
 -- Pack constituent guard covers custom line selections and direct inserts.
 PERFORM public.admin_set_availability(adm,'product','business-cards',false,'private note');
 IF NOT ('pack-launch'=ANY(public.catalog_unavailable('[{"slug":"pack-launch","selection":{"lines":"custom"}}]'))) THEN RAISE EXCEPTION 'REVIEW_TEST FAIL: constituent pack';END IF;ok:=ok+1;
 BEGIN INSERT INTO public.orders(reference,items) VALUES('RV-'||tag||'-blocked','[{"slug":"pack-launch"}]');RAISE EXCEPTION 'REVIEW_TEST FAIL: constituent insert';EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'REVIEW_TEST%' THEN RAISE;END IF;ok:=ok+1;END;
 -- RLS customer data denial under a test claim, without issuing a login session.
 PERFORM set_config('request.jwt.claims',json_build_object('sub',cust,'role','authenticated')::text,true);
 PERFORM set_config('request.jwt.claim.sub',cust::text,true);PERFORM set_config('role','authenticated',true);
 BEGIN PERFORM 1 FROM public.shop_order_ops;RAISE EXCEPTION 'REVIEW_TEST FAIL: customer private shop data';EXCEPTION WHEN insufficient_privilege THEN ok:=ok+1;END;
 BEGIN PERFORM 1 FROM public.admin_customer_records;RAISE EXCEPTION 'REVIEW_TEST FAIL: customer aggregate';EXCEPTION WHEN insufficient_privilege THEN ok:=ok+1;END;
 RAISE EXCEPTION 'REVIEW_TEST PASS % (rolled back)',ok;
END $$;
