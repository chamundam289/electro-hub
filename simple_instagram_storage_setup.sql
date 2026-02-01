-- Simple Instagram Story Media Storage Setup
-- This adds metadata columns to the existing table

-- Add metadata columns to instagram_story_media table
ALTER TABLE public.instagram_story_media 
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS original_filename TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.instagram_story_media.file_size IS 'File size in bytes';
COMMENT ON COLUMN public.instagram_story_media.file_type IS 'MIME type of the uploaded file';
COMMENT ON COLUMN public.instagram_story_media.original_filename IS 'Original filename when uploaded';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_story_media_type ON public.instagram_story_media(media_type, is_active);
CREATE INDEX IF NOT EXISTS idx_story_media_created ON public.instagram_story_media(created_at DESC);

-- Verification
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'instagram_story_media' 
AND table_schema = 'public'
ORDER BY ordinal_position;