-- Fix notification_logs table to use 'data' column instead of 'metadata'
-- The service is trying to insert 'metadata' but table has 'data' column

-- First, let's check if the table exists and what columns it has
DO $$
BEGIN
    -- Check if metadata column exists, if not, add it as an alias or rename data to metadata
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification_logs' 
        AND column_name = 'metadata'
        AND table_schema = 'public'
    ) THEN
        -- Add metadata column as alias to data column
        ALTER TABLE public.notification_logs ADD COLUMN IF NOT EXISTS metadata JSONB;
        
        -- Copy existing data from data column to metadata column if data column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notification_logs' 
            AND column_name = 'data'
            AND table_schema = 'public'
        ) THEN
            UPDATE public.notification_logs SET metadata = data WHERE metadata IS NULL AND data IS NOT NULL;
        END IF;
    END IF;
END $$;

-- Ensure the table has all required columns
ALTER TABLE public.notification_logs ADD COLUMN IF NOT EXISTS repair_request_id UUID;

-- Add index for repair_request_id
CREATE INDEX IF NOT EXISTS idx_notification_logs_repair_request_id ON public.notification_logs(repair_request_id);

-- Add foreign key constraint if repair_requests table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'repair_requests' AND table_schema = 'public') THEN
        -- Add foreign key constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_notification_logs_repair_request'
            AND table_name = 'notification_logs'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.notification_logs 
            ADD CONSTRAINT fk_notification_logs_repair_request 
            FOREIGN KEY (repair_request_id) REFERENCES public.repair_requests(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Ensure RLS is disabled for development
ALTER TABLE public.notification_logs DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL ON public.notification_logs TO authenticated, anon, service_role;

COMMENT ON COLUMN public.notification_logs.metadata IS 'Additional metadata for the notification (JSON format)';
COMMENT ON COLUMN public.notification_logs.repair_request_id IS 'Reference to the repair request that triggered this notification';