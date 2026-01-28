# Fix Storage RLS Policies - Step by Step Guide

The error "new row violates row-level security policy" means your storage bucket needs proper access policies.

## Method 1: Using Supabase Dashboard (Recommended)

### Step 1: Go to Storage Policies
1. Open your Supabase Dashboard
2. Go to **Storage** in the left sidebar
3. Click on **Policies** tab (next to Buckets)
4. You should see your `product-images` bucket listed

### Step 2: Create Upload Policy
1. Click **"New Policy"** button
2. Choose **"For full customization"** 
3. Fill in the details:
   - **Policy name**: `Allow authenticated users to upload`
   - **Allowed operation**: `INSERT` ✅
   - **Target roles**: `authenticated` ✅
   - **USING expression**: `true`
   - **WITH CHECK expression**: `true`
4. Click **"Review"** then **"Save policy"**

### Step 3: Create Read Policy  
1. Click **"New Policy"** button again
2. Choose **"For full customization"**
3. Fill in the details:
   - **Policy name**: `Allow public read access`
   - **Allowed operation**: `SELECT` ✅
   - **Target roles**: `public` ✅
   - **USING expression**: `true`
   - **WITH CHECK expression**: Leave empty
4. Click **"Review"** then **"Save policy"**

### Step 4: Create Update Policy
1. Click **"New Policy"** button again
2. Choose **"For full customization"**
3. Fill in the details:
   - **Policy name**: `Allow authenticated users to update`
   - **Allowed operation**: `UPDATE` ✅
   - **Target roles**: `authenticated` ✅
   - **USING expression**: `true`
   - **WITH CHECK expression**: `true`
4. Click **"Review"** then **"Save policy"**

### Step 5: Create Delete Policy
1. Click **"New Policy"** button again
2. Choose **"For full customization"**
3. Fill in the details:
   - **Policy name**: `Allow authenticated users to delete`
   - **Allowed operation**: `DELETE` ✅
   - **Target roles**: `authenticated` ✅
   - **USING expression**: `true`
   - **WITH CHECK expression**: Leave empty
4. Click **"Review"** then **"Save policy"**

## Method 2: Quick Template (Alternative)

If the above seems complex, try this simpler approach:

1. Go to **Storage** → **Policies**
2. Click **"New Policy"**
3. Choose **"Get started quickly"**
4. Select **"Enable read access for all users"**
5. Select your `product-images` bucket
6. Click **"Use this template"**

Then create another policy:
1. Click **"New Policy"** again
2. Choose **"Get started quickly"**  
3. Select **"Enable insert access for authenticated users only"**
4. Select your `product-images` bucket
5. Click **"Use this template"**

## Method 3: SQL Script (If Dashboard doesn't work)

Run the updated `setup_product_images_storage.sql` script in your SQL editor.

## Verification

After creating the policies, you should see them listed under Storage → Policies:
- ✅ Allow authenticated users to upload (INSERT)
- ✅ Allow public read access (SELECT)  
- ✅ Allow authenticated users to update (UPDATE)
- ✅ Allow authenticated users to delete (DELETE)

## Test Upload

1. Go back to your admin panel
2. Try uploading an image in Product Management
3. It should work now! 🎉

## Common Issues

### "Policy not found" error:
- Make sure you selected the correct bucket (`product-images`)
- Ensure the policy is saved and active

### "Still getting permission denied":
- Check that you're logged into the admin panel
- Verify your user has the `authenticated` role
- Try refreshing the page

### "Public read not working":
- Ensure the bucket is marked as **Public**
- Check the SELECT policy allows `public` role

The upload should work perfectly after setting up these policies! 🚀