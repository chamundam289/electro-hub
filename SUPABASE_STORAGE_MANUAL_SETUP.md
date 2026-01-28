# Manual Supabase Storage Setup Guide

If you're getting permission errors when running the SQL script, follow these manual steps in the Supabase Dashboard:

## Method 1: Dashboard Setup (Recommended)

### Step 1: Create Storage Bucket
1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"Create a new bucket"**
4. Enter bucket details:
   - **Name**: `product-images`
   - **Public bucket**: ✅ **Enable this** (makes images publicly accessible)
   - **File size limit**: 50MB (optional)
   - **Allowed MIME types**: Leave empty for all types
5. Click **"Create bucket"**

### Step 2: Verify Bucket Settings
1. Click on the newly created `product-images` bucket
2. Go to **Configuration** tab
3. Ensure **"Public bucket"** is enabled
4. Note the bucket URL format: `https://[your-project].supabase.co/storage/v1/object/public/product-images/`

### Step 3: Test Upload (Optional)
1. In the bucket, click **"Upload file"**
2. Upload a test image
3. Copy the public URL and test it in a browser
4. Delete the test image

## Method 2: Alternative SQL (If Dashboard doesn't work)

If you prefer SQL and have the right permissions, try this minimal approach:

```sql
-- Only create the bucket, skip policies for now
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images', 
  'product-images', 
  true, 
  52428800, -- 50MB in bytes
  NULL -- Allow all MIME types
)
ON CONFLICT (id) DO NOTHING;
```

## Method 3: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Create bucket via CLI
supabase storage create product-images --public
```

## Verification Steps

After setup, verify the bucket works:

1. **Check bucket exists**: Go to Storage in Supabase Dashboard
2. **Test public access**: Upload a test image and access its public URL
3. **Test from app**: Try uploading an image through the ProductManagement form

## Troubleshooting

### Common Issues:

1. **"Bucket not found" error in app**:
   - Verify bucket name is exactly `product-images`
   - Check bucket is marked as public

2. **"Permission denied" during upload**:
   - Ensure user is authenticated
   - Check bucket is public
   - Verify Supabase client configuration

3. **Images not loading**:
   - Confirm bucket is public
   - Test direct URL access
   - Check CORS settings if needed

### Success Indicators:
- ✅ Bucket appears in Storage dashboard
- ✅ Public URL format works: `https://[project].supabase.co/storage/v1/object/public/product-images/test.jpg`
- ✅ Upload works from ProductManagement form
- ✅ Images display in product listings

## Next Steps

Once the bucket is set up:
1. Test image upload in ProductManagement
2. Verify images save to database
3. Check images display in product listings
4. Test image deletion functionality

The ImageUpload component will automatically work once the storage bucket is properly configured!