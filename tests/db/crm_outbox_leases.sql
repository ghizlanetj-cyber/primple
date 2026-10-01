-- DB regression test for the CRM outbox lease/version contract.
-- One transaction, always ends with an exception so every fixture is rolled back.
-- Calls only database functions; nothing is sent to Zoho.
-- Fixture jobs use random source ids and next_attempt_at in the past so they are
-- claimed before any real job (claims use _limit 1).
-- Last live run (2026-10-01): 'CRM_OUTBOX_TEST PASS 8/8 (rolled back)'.
DO $$
DECLARE
  src uuid := gen_random_uuid(); job uuid; w1 uuid := gen_random_uuid(); w2 uuid := gen_random_uuid();
  r text; st text; ok int := 0; claimed uuid;
BEGIN
  PERFORM public.crm_enqueue('contact', 'profiles', src);
  SELECT id INTO job FROM public.crm_outbox WHERE source_table = 'profiles' AND source_id = src;
  UPDATE public.crm_outbox SET next_attempt_at = '2000-01-01' WHERE id = job;

  -- 1. Claim gives the lease to w1.
  SELECT id INTO claimed FROM public.crm_claim(w1, 1, 120);
  IF claimed IS DISTINCT FROM job THEN RAISE EXCEPTION 'CRM_OUTBOX_TEST FAIL: claim'; END IF;
  ok := ok + 1;

  -- 2. Completion by the wrong owner is rejected and changes nothing.
  r := public.crm_complete(job, w2, true, 'z1');
  SELECT status INTO st FROM public.crm_outbox WHERE id = job;
  IF r <> 'lease_lost' OR st <> 'processing' THEN RAISE EXCEPTION 'CRM_OUTBOX_TEST FAIL: wrong owner (% %)', r, st; END IF;
  IF EXISTS (SELECT 1 FROM public.crm_mappings WHERE source_id = src) THEN RAISE EXCEPTION 'CRM_OUTBOX_TEST FAIL: wrong owner wrote mapping'; END IF;
  ok := ok + 1;

  -- 3. New event during processing: success returns 'pending', not 'done'.
  PERFORM public.crm_enqueue('contact', 'profiles', src);
  r := public.crm_complete(job, w1, true, 'z1');
  IF r <> 'pending' THEN RAISE EXCEPTION 'CRM_OUTBOX_TEST FAIL: version bump lost (%)', r; END IF;
  ok := ok + 1;

  -- 4. Expired lease is reclaimed by another worker.
  UPDATE public.crm_outbox SET next_attempt_at = '2000-01-01' WHERE id = job;
  SELECT id INTO claimed FROM public.crm_claim(w1, 1, 120);
  UPDATE public.crm_outbox SET lease_expires_at = now() - interval '1 second', next_attempt_at = '2000-01-01' WHERE id = job;
  SELECT id INTO claimed FROM public.crm_claim(w2, 1, 120);
  IF claimed IS DISTINCT FROM job THEN RAISE EXCEPTION 'CRM_OUTBOX_TEST FAIL: expired lease not reclaimed'; END IF;
  ok := ok + 1;

  -- 5. The old owner can no longer complete it.
  IF public.crm_complete(job, w1, true, 'z-old') <> 'lease_lost' THEN RAISE EXCEPTION 'CRM_OUTBOX_TEST FAIL: stale owner completed'; END IF;
  ok := ok + 1;

  -- 6. Failure by the current owner → failed with a future retry time (not lost).
  r := public.crm_complete(job, w2, false, NULL, NULL, 'http_503', 'Zoho server error', 503);
  SELECT status INTO st FROM public.crm_outbox WHERE id = job AND next_attempt_at > now();
  IF r <> 'failed' OR st IS DISTINCT FROM 'failed' THEN RAISE EXCEPTION 'CRM_OUTBOX_TEST FAIL: retry state (% %)', r, st; END IF;
  ok := ok + 1;

  -- 7. Manual retry puts it back to pending immediately.
  PERFORM public.crm_retry(job);
  SELECT status INTO st FROM public.crm_outbox WHERE id = job AND next_attempt_at <= now();
  IF st IS DISTINCT FROM 'pending' THEN RAISE EXCEPTION 'CRM_OUTBOX_TEST FAIL: manual retry'; END IF;
  ok := ok + 1;

  -- 8. Final claim + success → done, mapping stored once.
  UPDATE public.crm_outbox SET next_attempt_at = '2000-01-01' WHERE id = job;
  SELECT id INTO claimed FROM public.crm_claim(w1, 1, 120);
  r := public.crm_complete(job, w1, true, 'z-final');
  IF r <> 'done' OR (SELECT zoho_id FROM public.crm_mappings WHERE source_id = src) <> 'z-final' THEN
    RAISE EXCEPTION 'CRM_OUTBOX_TEST FAIL: final completion (%)', r;
  END IF;
  ok := ok + 1;

  RAISE EXCEPTION 'CRM_OUTBOX_TEST PASS %/8 (rolled back)', ok;
END $$;
