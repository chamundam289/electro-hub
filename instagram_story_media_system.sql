-- Instagram Story Media System Database Setup
-- This creates tables for controlled story workflow with media upload/download

-- 1. Story Media Table (Admin uploads media for stories)
CREATE TABLE IF NOT EXISTS public.instagram_story_media (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    caption TEXT,
    instructions TEXT,
    coins_reward INTEGER NOT NULL DEFAULT 100,
    created_by_admin UUID REFERENCES auth.users(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Story Assignments Table (Admin assigns media to specific influencers)
CREATE TABLE IF NOT EXISTS public.instagram_story_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    story_media_id UUID NOT NULL REFERENCES public.instagram_story_media(id) ON DELETE CASCADE,
    instagram_user_id UUID NOT NULL REFERENCES public.instagram_users(id) ON DELETE CASCADE,
    assignment_status TEXT NOT NULL DEFAULT 'pending_download' CHECK (
        assignment_status IN ('pending_download', 'downloaded', 'posted', 'verified', 'expired', 'rejected')
    ),
    downloaded_at TIMESTAMP WITH TIME ZONE,
    posted_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
    coins_assigned BOOLEAN NOT NULL DEFAULT false,
    coins_amount INTEGER DEFAULT 0,
    admin_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(story_media_id, instagram_user_id)
);

-- 3. Story Verifications Table (Admin verification records)
CREATE TABLE IF NOT EXISTS public.instagram_story_verifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id UUID NOT NULL REFERENCES public.instagram_story_assignments(id) ON DELETE CASCADE,
    verified_by_admin UUID REFERENCES auth.users(id),
    verification_status TEXT NOT NULL CHECK (verification_status IN ('approved', 'rejected')),
    verification_notes TEXT,
    instagram_story_url TEXT,
    verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Update existing instagram_coin_transactions to link with assignments
ALTER TABLE public.instagram_coin_transactions 
ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES public.instagram_story_assignments(id);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_story_media_active ON public.instagram_story_media(is_active, created_at);
CREATE INDEX IF NOT EXISTS idx_story_assignments_user ON public.instagram_story_assignments(instagram_user_id, assignment_status);
CREATE INDEX IF NOT EXISTS idx_story_assignments_status ON public.instagram_story_assignments(assignment_status, expires_at);
CREATE INDEX IF NOT EXISTS idx_story_verifications_assignment ON public.instagram_story_verifications(assignment_id);

-- 6. Create RLS policies (disabled for development)
ALTER TABLE public.instagram_story_media DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_story_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_story_verifications DISABLE ROW LEVEL SECURITY;

-- 7. Grant permissions
GRANT ALL ON public.instagram_story_media TO anon, authenticated;
GRANT ALL ON public.instagram_story_assignments TO anon, authenticated;
GRANT ALL ON public.instagram_story_verifications TO anon, authenticated;

-- 8. Add comments for documentation
COMMENT ON TABLE public.instagram_story_media IS 'Admin uploaded media (images/videos) for Instagram stories';
COMMENT ON TABLE public.instagram_story_assignments IS 'Assignment of story media to specific Instagram users';
COMMENT ON TABLE public.instagram_story_verifications IS 'Admin verification records for posted stories';

COMMENT ON COLUMN public.instagram_story_media.media_type IS 'Type of media: image or video';
COMMENT ON COLUMN public.instagram_story_assignments.assignment_status IS 'Status: pending_download, downloaded, posted, verified, expired, rejected';
COMMENT ON COLUMN public.instagram_story_verifications.verification_status IS 'Admin verification result: approved or rejected';