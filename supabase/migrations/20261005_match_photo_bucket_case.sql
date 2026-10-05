-- Match the existing private bucket. No photo, bucket or project data is modified.
BEGIN;

ALTER POLICY "View own project photos" ON storage.objects
USING (
  bucket_id = 'Project-photos'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

ALTER POLICY "Upload own project photos" ON storage.objects
WITH CHECK (
  bucket_id = 'Project-photos'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

ALTER POLICY "Update own project photos" ON storage.objects
USING (
  bucket_id = 'Project-photos'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
)
WITH CHECK (
  bucket_id = 'Project-photos'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

ALTER POLICY "Delete own project photos" ON storage.objects
USING (
  bucket_id = 'Project-photos'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

COMMIT;

SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;
