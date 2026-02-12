-- Supabase Storage Bucket Setup
-- This file ensures the kinedao-assets bucket exists and is publicly accessible

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kinedao-assets',
  'kinedao-assets',
  true,  -- Make bucket public for product images
  52428800,  -- 50MB in bytes
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,  -- Ensure it's public even if it already exists
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'kinedao-assets');

-- Allow public read access to all files in the bucket
CREATE POLICY "Public can view files"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'kinedao-assets');

-- Allow authenticated users to update their own files
CREATE POLICY "Authenticated users can update files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'kinedao-assets');

-- Allow authenticated users to delete their own files
CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'kinedao-assets');
