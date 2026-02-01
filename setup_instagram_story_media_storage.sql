-- Setup Supabase Storage for Instagram Story Media
-- This creates the necessary storage bucket and policies for Instagram story media uploads

-- 1. Create storage bucket for Instagram story media (if not exists)
-- Note: This needs to be done via Supabase Dashboard → Storage → New Bucket
-- Bucket name: instagram-story-media
-- Public: true
-- File size limit: 50MB
-- Allowed MIME types: image/*, video/*

-- 2. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated uploads to instagram-story-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to instagram-story-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to instagram-story-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from instagram-story-media" ON storage.objects;

-- 3. Create storage policies for the bucket
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to instagram-story-media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'instagram-story-media');

-- Allow public access to view files
CREATE POLICY "Allow public access to instagram-story-media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'instagram-story-media');

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated updates to instagram-story-media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'instagram-story-media');

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletes from instagram-story-media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'instagram-story-media');

-- 4. Update instagram_story_media table to add metadata columns
ALTER TABLE public.instagram_story_media 
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS original_filename TEXT;

-- 5. Add comments for documentation
COMMENT ON COLUMN public.instagram_story_media.file_size IS 'File size in bytes';
COMMENT ON COLUMN public.instagram_story_media.file_type IS 'MIME type of the uploaded file';
COMMENT ON COLUMN public.instagram_story_media.original_filename IS 'Original filename when uploaded';

-- 6. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_story_media_type ON public.instagram_story_media(media_type, is_active);
CREATE INDEX IF NOT EXISTS idx_story_media_created ON public.instagram_story_media(created_at DESC);

-- Instructions for manual setup:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New Bucket"
-- 3. Name: instagram-story-media
-- 4. Public: Yes (checked)
-- 5. File size limit: 52428800 (50MB in bytes)
-- 6. Allowed MIME types: image/*, video/*
-- 7. Click "Save"

-- Verification query to check if bucket exists:
-- SELECT * FROM storage.buckets WHERE name = 'instagram-story-media';