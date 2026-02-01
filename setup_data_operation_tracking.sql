-- Setup Data Operation Tracking for Admin-Side Order Creation and Database Operations
-- This extends the storage tracking system to include database operations

-- Create data operation tracking table
CREATE TABLE IF NOT EXISTS public.data_operation_tracking (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    operation_type TEXT NOT NULL CHECK (operation_type IN ('create', 'update', 'delete')),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    data_size_bytes BIGINT NOT NULL DEFAULT 0,
    operation_source TEXT NOT NULL,
    operated_by UUID,
    operated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT data_operation_tracking_pkey PRIMARY KEY (id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_data_operation_tracking_table_name ON public.data_operation_tracking(table_name);
CREATE INDEX IF NOT EXISTS idx_data_operation_tracking_operation_source ON public.data_operation_tracking(operation_source);
CREATE INDEX IF NOT EXISTS idx_data_operation_tracking_operated_at ON public.data_operation_tracking(operated_at);
CREATE INDEX IF NOT EXISTS idx_data_operation_tracking_operation_type ON public.data_operation_tracking(operation_type);

-- Drop existing view if it exists to avoid column name conflicts
DROP VIEW IF EXISTS public.overall_storage_usage;

-- Update the overall storage usage view to include database operations
-- Handle case where storage_usage_tracking table might not exist
CREATE VIEW public.overall_storage_usage AS
SELECT 
    -- File storage stats (with fallback if table doesn't exist)
    COALESCE(file_stats.total_files, 0) as total_files,
    COALESCE(file_stats.total_file_size_bytes, 0) as file_size_bytes,
    
    -- Database operation stats
    COALESCE(data_stats.total_operations, 0) as total_database_operations,
    COALESCE(data_stats.total_data_size_bytes, 0) as database_size_bytes,
    
    -- Combined stats
    COALESCE(file_stats.total_file_size_bytes, 0) + COALESCE(data_stats.total_data_size_bytes, 0) as total_size_bytes,
    ROUND((COALESCE(file_stats.total_file_size_bytes, 0) + COALESCE(data_stats.total_data_size_bytes, 0)) / 1024.0 / 1024.0, 2) as total_size_mb,
    ROUND((COALESCE(file_stats.total_file_size_bytes, 0) + COALESCE(data_stats.total_data_size_bytes, 0)) / 1024.0 / 1024.0 / 1024.0, 3) as total_size_gb,
    ROUND((1024.0 - (COALESCE(file_stats.total_file_size_bytes, 0) + COALESCE(data_stats.total_data_size_bytes, 0)) / 1024.0 / 1024.0), 2) as remaining_mb_approx,
    ROUND((1.0 - (COALESCE(file_stats.total_file_size_bytes, 0) + COALESCE(data_stats.total_data_size_bytes, 0)) / 1024.0 / 1024.0 / 1024.0), 3) as remaining_gb_approx,
    ROUND(((COALESCE(file_stats.total_file_size_bytes, 0) + COALESCE(data_stats.total_data_size_bytes, 0)) / 1024.0 / 1024.0 / 1024.0 / 1.0) * 100, 1) as usage_percentage
FROM 
    (
        -- File storage stats with existence check
        SELECT 
            CASE 
                WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'storage_usage_tracking' AND table_schema = 'public') 
                THEN (SELECT COUNT(*) FROM public.storage_usage_tracking WHERE is_deleted = false)
                ELSE 0 
            END as total_files,
            CASE 
                WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'storage_usage_tracking' AND table_schema = 'public') 
                THEN (SELECT COALESCE(SUM(file_size_bytes), 0) FROM public.storage_usage_tracking WHERE is_deleted = false)
                ELSE 0 
            END as total_file_size_bytes
    ) file_stats
CROSS JOIN
    (
        SELECT 
            COUNT(*) as total_operations,
            SUM(data_size_bytes) as total_data_size_bytes
        FROM public.data_operation_tracking 
        WHERE is_deleted = false
    ) data_stats;

-- Drop existing views if they exist to avoid conflicts
DROP VIEW IF EXISTS public.data_operation_summary;
DROP VIEW IF EXISTS public.combined_usage_summary;

-- Create a view for data operation summary by source
CREATE VIEW public.data_operation_summary AS
SELECT 
    operation_source,
    table_name,
    COUNT(*) as total_operations,
    SUM(data_size_bytes) as total_size_bytes,
    ROUND(SUM(data_size_bytes) / 1024.0 / 1024.0, 2) as total_size_mb,
    ROUND(SUM(data_size_bytes) / 1024.0 / 1024.0 / 1024.0, 3) as total_size_gb,
    MIN(operated_at) as first_operation,
    MAX(operated_at) as last_operation,
    COUNT(CASE WHEN operation_type = 'create' THEN 1 END) as create_operations,
    COUNT(CASE WHEN operation_type = 'update' THEN 1 END) as update_operations,
    COUNT(CASE WHEN operation_type = 'delete' THEN 1 END) as delete_operations
FROM public.data_operation_tracking 
WHERE is_deleted = false
GROUP BY operation_source, table_name
ORDER BY total_size_bytes DESC;

-- Create a combined storage and data usage summary with fallback for missing tables
CREATE VIEW public.combined_usage_summary AS
SELECT 
    'file_storage' as usage_type,
    upload_source as source_name,
    bucket_name as location,
    COUNT(*) as total_items,
    SUM(file_size_bytes) as total_size_bytes,
    ROUND(SUM(file_size_bytes) / 1024.0 / 1024.0, 2) as total_size_mb,
    ROUND(SUM(file_size_bytes) / 1024.0 / 1024.0 / 1024.0, 3) as total_size_gb,
    MIN(uploaded_at) as first_activity,
    MAX(uploaded_at) as last_activity
FROM public.storage_usage_tracking 
WHERE is_deleted = false 
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'storage_usage_tracking' AND table_schema = 'public')
GROUP BY upload_source, bucket_name

UNION ALL

SELECT 
    'database_operations' as usage_type,
    operation_source as source_name,
    table_name as location,
    COUNT(*) as total_items,
    SUM(data_size_bytes) as total_size_bytes,
    ROUND(SUM(data_size_bytes) / 1024.0 / 1024.0, 2) as total_size_mb,
    ROUND(SUM(data_size_bytes) / 1024.0 / 1024.0 / 1024.0, 3) as total_size_gb,
    MIN(operated_at) as first_activity,
    MAX(operated_at) as last_activity
FROM public.data_operation_tracking 
WHERE is_deleted = false
GROUP BY operation_source, table_name

ORDER BY total_size_bytes DESC;

-- Disable RLS for development (enable in production with proper policies)
ALTER TABLE public.data_operation_tracking DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.data_operation_tracking TO anon, authenticated;
GRANT SELECT ON public.overall_storage_usage TO anon, authenticated;
GRANT SELECT ON public.data_operation_summary TO anon, authenticated;
GRANT SELECT ON public.combined_usage_summary TO anon, authenticated;

-- Add helpful comments
COMMENT ON TABLE public.data_operation_tracking IS 'Tracks database operations (create, update, delete) for storage management and analytics';
COMMENT ON COLUMN public.data_operation_tracking.operation_type IS 'Type of database operation: create, update, or delete';
COMMENT ON COLUMN public.data_operation_tracking.table_name IS 'Name of the database table affected';
COMMENT ON COLUMN public.data_operation_tracking.record_id IS 'ID or identifier of the affected record';
COMMENT ON COLUMN public.data_operation_tracking.data_size_bytes IS 'Estimated size of the data operation in bytes';
COMMENT ON COLUMN public.data_operation_tracking.operation_source IS 'Source of the operation (e.g., admin_pos_order_create)';
COMMENT ON COLUMN public.data_operation_tracking.metadata IS 'Additional metadata about the operation in JSON format';

COMMENT ON VIEW public.overall_storage_usage IS 'Combined view of file storage and database operation usage statistics';
COMMENT ON VIEW public.data_operation_summary IS 'Summary of database operations grouped by source and table';
COMMENT ON VIEW public.combined_usage_summary IS 'Combined summary of both file storage and database operations';

-- Insert some sample data operation sources for reference
INSERT INTO public.data_operation_tracking (
    operation_type, 
    table_name, 
    record_id, 
    data_size_bytes, 
    operation_source, 
    metadata
) VALUES 
(
    'create', 
    'setup_info', 
    'data-tracking-setup', 
    512, 
    'system_setup', 
    jsonb_build_object(
        'description', 'Data operation tracking system setup',
        'version', '1.0',
        'setup_date', now()::text
    )
)
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Data operation tracking system setup completed successfully!' as status;