CREATE POLICY "Clients read claimed guest artwork objects"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'client-artwork'
    AND EXISTS (
      SELECT 1 FROM public.order_files
      WHERE public.order_files.path = storage.objects.name
        AND public.order_files.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients update claimed guest artwork objects"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'client-artwork'
    AND EXISTS (
      SELECT 1 FROM public.order_files
      WHERE public.order_files.path = storage.objects.name
        AND public.order_files.user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'client-artwork'
    AND EXISTS (
      SELECT 1 FROM public.order_files
      WHERE public.order_files.path = storage.objects.name
        AND public.order_files.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients delete claimed guest artwork objects"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'client-artwork'
    AND EXISTS (
      SELECT 1 FROM public.order_files
      WHERE public.order_files.path = storage.objects.name
        AND public.order_files.user_id = auth.uid()
    )
  );