-- Safe Database Management Fix - Handles Existing Tables
-- Run this in Supabase SQL Editor

-- 1. Create storage_usage_tracking table (safe)
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

-- 2. Create storage usage views (safe - will replace if exists)
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

-- 3. Create repair_technicians table (safe)
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

-- 4. Create users table (safe)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create indexes (safe - will not create if exists)
CREATE INDEX IF NOT EXISTS idx_storage_tracking_bucket ON public.storage_usage_tracking(bucket_name, is_deleted);
CREATE INDEX IF NOT EXISTS idx_storage_tracking_source ON public.storage_usage_tracking(upload_source, is_deleted);
CREATE INDEX IF NOT EXISTS idx_storage_tracking_uploaded_at ON public.storage_usage_tracking(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_repair_technicians_active ON public.repair_technicians(is_active, total_repairs_completed DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 6. Disable RLS for development (safe)
ALTER TABLE public.storage_usage_tracking DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_technicians DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Only disable RLS on website_settings if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'website_settings') THEN
        ALTER TABLE public.website_settings DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 7. Grant permissions (safe)
GRANT ALL ON public.storage_usage_tracking TO anon, authenticated;
GRANT ALL ON public.repair_technicians TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT SELECT ON public.storage_usage_summary TO anon, authenticated;
GRANT SELECT ON public.overall_storage_usage TO anon, authenticated;

-- Grant permissions on website_settings if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'website_settings') THEN
        GRANT ALL ON public.website_settings TO anon, authenticated;
    END IF;
END $$;

-- 8. Insert sample data (safe - only if tables are empty)

-- Sample repair technicians
INSERT INTO public.repair_technicians (name, email, phone, specialization, total_repairs_completed, average_rating, is_active)
SELECT * FROM (VALUES 
    ('John Smith', 'john@repair.com', '+1234567890', 'Screen Repair', 45, 4.8, true),
    ('Sarah Johnson', 'sarah@repair.com', '+1234567891', 'Battery Replacement', 38, 4.9, true),
    ('Mike Wilson', 'mike@repair.com', '+1234567892', 'Water Damage', 22, 4.6, true)
) AS v(name, email, phone, specialization, total_repairs_completed, average_rating, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.repair_technicians);

-- Sample storage tracking data
INSERT INTO public.storage_usage_tracking (file_name, bucket_name, file_size_bytes, file_type, upload_source)
SELECT * FROM (VALUES 
    ('sample-product-1.jpg', 'product-images', 1024000, 'image/jpeg', 'product_images'),
    ('sample-product-2.jpg', 'product-images', 1536000, 'image/jpeg', 'product_images'),
    ('sample-story-1.jpg', 'instagram-story-media', 2048000, 'image/jpeg', 'instagram_story_media'),
    ('sample-story-video.mp4', 'instagram-story-media', 5120000, 'video/mp4', 'instagram_story_media'),
    ('sample-repair-1.jpg', 'repair-images', 1024000, 'image/jpeg', 'repair_images')
) AS v(file_name, bucket_name, file_size_bytes, file_type, upload_source)
WHERE NOT EXISTS (SELECT 1 FROM public.storage_usage_tracking);

-- 9. Add comments
COMMENT ON TABLE public.storage_usage_tracking IS 'Tracks file uploads for approximate storage usage calculation';
COMMENT ON TABLE public.repair_technicians IS 'Repair service technicians and their statistics';
COMMENT ON TABLE public.users IS 'Application users (separate from auth.users)';
COMMENT ON VIEW public.storage_usage_summary IS 'Summary of storage usage by bucket and source';
COMMENT ON VIEW public.overall_storage_usage IS 'Overall storage usage with free plan calculations';

-- 10. Verification
SELECT 'Database Management setup completed successfully!' as status;
SELECT 'Storage tracking:' as category, COUNT(*) as records FROM public.storage_usage_tracking;
SELECT 'Repair technicians:' as category, COUNT(*) as records FROM public.repair_technicians;
SELECT 'Users:' as category, COUNT(*) as records FROM public.users;

-- Check if storage usage view works
SELECT 'Storage usage view:' as category, 
       COALESCE(total_files, 0) as total_files, 
       COALESCE(total_size_mb, 0) as total_size_mb, 
       COALESCE(usage_percentage, 0) as usage_percentage 
FROM public.overall_storage_usage
UNION ALL
SELECT 'Storage usage view:' as category, 0 as total_files, 0 as total_size_mb, 0 as usage_percentage
WHERE NOT EXISTS (SELECT 1 FROM public.overall_storage_usage);

SELECT 'Setup completed - Database Management page should now work!' as final_status;