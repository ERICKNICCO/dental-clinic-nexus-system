
-- Make storage bucket "xray-images" fully public for upload/download/list/delete

-- For download (read images)
CREATE POLICY "public-download-xray-images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'xray-images');

-- For upload (write images)
CREATE POLICY "public-upload-xray-images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'xray-images');

-- For delete (remove images)
CREATE POLICY "public-delete-xray-images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'xray-images');

-- For list (allow listing images in the bucket)
CREATE POLICY "public-list-xray-images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'xray-images');
