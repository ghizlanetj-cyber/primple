ALTER TABLE public.order_files
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN guest_token uuid;

CREATE UNIQUE INDEX order_files_guest_token_idx
  ON public.order_files (guest_token)
  WHERE guest_token IS NOT NULL;

ALTER TABLE public.order_files
  ADD CONSTRAINT order_files_owner_or_guest_check
  CHECK (user_id IS NOT NULL OR guest_token IS NOT NULL);

GRANT ALL ON public.order_files TO service_role;