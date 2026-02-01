-- Fix All Database Errors - Complete Setup Script
-- Run this in Supabase SQL Editor to fix all 404 errors

-- 1. Create storage_usage_tracking table and views
CREATE TABLE IF NOT EXISTS public.storage_usage_tracking (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name TEXT NOT NULL,
    bucket_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_type TEXT,
    upload_source TEXT,
    uploaded_by UUID,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create storage usage summary view
CREATE OR REPLACE VIEW public.storage_usage_summary AS
SELECT 
    bucket_name,
    upload_source,
    COUNT(*) as total_files,
    SUM(file_size_bytes) as total_size_bytes,
    ROUND(SUM(file_size_bytes) / 1024.0 / 1024.0, 2) as total_size_mb,
    ROUND(SUM(file_size_bytes) / 1024.0 / 1024.0 / 1024.0, 3) as total_size_gb,
    MIN(uploaded_at) as first_upload,
    MAX(uploaded_at) as last_upload
FROM public.storage_usage_tracking 
WHERE is_deleted = false
GROUP BY bucket_name, upload_source;

-- 3. Create overall storage usage view
CREATE OR REPLACE VIEW public.overall_storage_usage AS
SELECT 
    COUNT(*) as total_files,
    SUM(file_size_bytes) as total_size_bytes,
    ROUND(SUM(file_size_bytes) / 1024.0 / 1024.0, 2) as total_size_mb,
    ROUND(SUM(file_size_bytes) / 1024.0 / 1024.0 / 1024.0, 3) as total_size_gb,
    ROUND((1024.0 - SUM(file_size_bytes) / 1024.0 / 1024.0), 2) as remaining_mb_approx,
    ROUND((1.0 - SUM(file_size_bytes) / 1024.0 / 1024.0 / 1024.0), 3) as remaining_gb_approx,
    ROUND((SUM(file_size_bytes) / 1024.0 / 1024.0 / 1024.0 / 1.0) * 100, 1) as usage_percentage
FROM public.storage_usage_tracking 
WHERE is_deleted = false;

-- 4. Create repair_technicians table (for RepairAnalytics)
CREATE TABLE IF NOT EXISTS public.repair_technicians (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    specialization TEXT,
    total_repairs_completed INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Handle website_settings table (check if it exists and add missing columns)
DO $$ 
BEGIN
    -- Create table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.website_settings (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'website_settings' AND column_name = 'setting_key') THEN
        ALTER TABLE public.website_settings ADD COLUMN setting_key TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'website_settings' AND column_name = 'setting_value') THEN
        ALTER TABLE public.website_settings ADD COLUMN setting_value TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'website_settings' AND column_name = 'setting_type') THEN
        ALTER TABLE public.website_settings ADD COLUMN setting_type TEXT DEFAULT 'text';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'website_settings' AND column_name = 'description') THEN
        ALTER TABLE public.website_settings ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'website_settings' AND column_name = 'is_public') THEN
        ALTER TABLE public.website_settings ADD COLUMN is_public BOOLEAN DEFAULT false;
    END IF;
    
    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'website_settings' AND constraint_name = 'website_settings_setting_key_key') THEN
        ALTER TABLE public.website_settings ADD CONSTRAINT website_settings_setting_key_key UNIQUE (setting_key);
    END IF;
END $$;

-- 6. Create users table if it doesn't exist (auth.users might be separate)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_storage_tracking_bucket ON public.storage_usage_tracking(bucket_name, is_deleted);
CREATE INDEX IF NOT EXISTS idx_storage_tracking_source ON public.storage_usage_tracking(upload_source, is_deleted);
CREATE INDEX IF NOT EXISTS idx_storage_tracking_uploaded_at ON public.storage_usage_tracking(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_repair_technicians_active ON public.repair_technicians(is_active, total_repairs_completed DESC);
CREATE INDEX IF NOT EXISTS idx_website_settings_key ON public.website_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 8. Disable RLS for development (enable in production)
ALTER TABLE public.storage_usage_tracking DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_technicians DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 9. Grant permissions
GRANT ALL ON public.storage_usage_tracking TO anon, authenticated;
GRANT ALL ON public.repair_technicians TO anon, authenticated;
GRANT ALL ON public.website_settings TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT SELECT ON public.storage_usage_summary TO anon, authenticated;
GRANT SELECT ON public.overall_storage_usage TO anon, authenticated;

-- 10. Insert sample data for testing

-- Sample repair technicians
INSERT INTO public.repair_technicians (name, email, phone, specialization, total_repairs_completed, average_rating, is_active)
VALUES 
    ('John Smith', 'john@repair.com', '+1234567890', 'Screen Repair', 45, 4.8, true),
    ('Sarah Johnson', 'sarah@repair.com', '+1234567891', 'Battery Replacement', 38, 4.9, true),
    ('Mike Wilson', 'mike@repair.com', '+1234567892', 'Water Damage', 22, 4.6, true)
ON CONFLICT DO NOTHING;

-- Sample website settings (only insert if table is empty)
INSERT INTO public.website_settings (setting_key, setting_value, setting_type, description, is_public)
SELECT * FROM (VALUES 
    ('site_name', 'ElectroStore', 'text', 'Website name', true),
    ('site_description', 'Your trusted electronics store', 'text', 'Website description', true),
    ('contact_email', 'info@electrostore.com', 'email', 'Contact email', true),
    ('contact_phone', '+1234567890', 'phone', 'Contact phone', true),
    ('maintenance_mode', 'false', 'boolean', 'Maintenance mode status', false),
    ('max_upload_size', '50', 'number', 'Max upload size in MB', false)
) AS v(setting_key, setting_value, setting_type, description, is_public)
WHERE NOT EXISTS (SELECT 1 FROM public.website_settings WHERE website_settings.setting_key = v.setting_key);

-- Sample storage tracking data (to show functionality)
INSERT INTO public.storage_usage_tracking (file_name, bucket_name, file_size_bytes, file_type, upload_source)
VALUES 
    ('sample-product-1.jpg', 'product-images', 1024000, 'image/jpeg', 'product_images'),
    ('sample-product-2.jpg', 'product-images', 1536000, 'image/jpeg', 'product_images'),
    ('sample-story-1.jpg', 'instagram-story-media', 2048000, 'image/jpeg', 'instagram_story_media'),
    ('sample-story-video.mp4', 'instagram-story-media', 5120000, 'video/mp4', 'instagram_story_media'),
    ('sample-repair-1.jpg', 'repair-images', 1024000, 'image/jpeg', 'repair_images')
ON CONFLICT DO NOTHING;

-- 11. Add comments for documentation
COMMENT ON TABLE public.storage_usage_tracking IS 'Tracks file uploads for approximate storage usage calculation';
COMMENT ON TABLE public.repair_technicians IS 'Repair service technicians and their statistics';
COMMENT ON TABLE public.website_settings IS 'Website configuration settings';
COMMENT ON TABLE public.users IS 'Application users (separate from auth.users)';

COMMENT ON VIEW public.storage_usage_summary IS 'Summary of storage usage by bucket and source';
COMMENT ON VIEW public.overall_storage_usage IS 'Overall storage usage with free plan calculations';

-- 12. Verification queries
SELECT 'Setup completed successfully!' as status;
SELECT 'Storage tracking:' as category, COUNT(*) as records FROM public.storage_usage_tracking;
SELECT 'Repair technicians:' as category, COUNT(*) as records FROM public.repair_technicians;
SELECT 'Website settings:' as category, COUNT(*) as records FROM public.website_settings;
SELECT 'Storage usage view:' as category, total_files, total_size_mb, usage_percentage FROM public.overall_storage_usage;