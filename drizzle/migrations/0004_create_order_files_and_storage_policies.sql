CREATE TABLE public.order_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  order_reference text,
  bucket text NOT NULL DEFAULT 'client-artwork',
  path text NOT NULL UNIQUE,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'uploaded',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_files TO authenticated;
GRANT ALL ON public.order_files TO service_role;

ALTER TABLE public.order_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own files"
  ON public.order_files FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add own files"
  ON public.order_files FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files"
  ON public.order_files FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
  ON public.order_files FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX order_files_user_idx ON public.order_files (user_id, created_at DESC);
CREATE INDEX order_files_order_idx ON public.order_files (order_id);

CREATE POLICY "Clients read own artwork objects"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'client-artwork' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Clients upload own artwork objects"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'client-artwork' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Clients update own artwork objects"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'client-artwork' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'client-artwork' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Clients delete own artwork objects"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'client-artwork' AND auth.uid()::text = (storage.foldername(name))[1]);