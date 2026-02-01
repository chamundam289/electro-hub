-- Add coins_assigned_at column to instagram_stories table
-- This tracks when admin manually assigned coins to approved stories

ALTER TABLE instagram_stories 
ADD COLUMN IF NOT EXISTS coins_assigned_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN instagram_stories.coins_assigned_at IS 'Timestamp when admin manually assigned coins for approved story';

-- Update existing approved stories that have coins_awarded > 0 to set coins_assigned_at
UPDATE instagram_stories 
SET coins_assigned_at = admin_verified_at 
WHERE story_status = 'approved' 
  AND coins_awarded > 0 
  AND coins_assigned_at IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_instagram_stories_coins_assigned_at 
ON instagram_stories(coins_assigned_at) 
WHERE coins_assigned_at IS NOT NULL;