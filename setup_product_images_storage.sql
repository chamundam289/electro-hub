-- Setup Supabase Storage Policies for Product Images
-- This script creates the necessary RLS policies for the product-images bucket

-- Policy 1: Allow authenticated users to INSERT (upload) images
CREATE POLICY "Allow authenticated users to upload product images"
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Policy 2: Allow public SELECT (read) access to images
CREATE POLICY "Allow public read access to product images"
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

-- Policy 3: Allow authenticated users to UPDATE images
CREATE POLICY "Allow authenticated users to update product images"
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Policy 4: Allow authenticated users to DELETE images
CREATE POLICY "Allow authenticated users to delete product images"
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);