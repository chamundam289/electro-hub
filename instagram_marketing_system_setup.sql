-- Instagram Influencer Marketing System Database Setup
-- Complete system for manual influencer hiring and story-based loyalty coin rewards

-- 1. Instagram Users (Influencers) Table
CREATE TABLE IF NOT EXISTS public.instagram_users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    instagram_username VARCHAR(100) NOT NULL UNIQUE,
    followers_count INTEGER NOT NULL CHECK (followers_count >= 1000),
    mobile_number VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    total_coins_earned INTEGER DEFAULT 0,
    total_stories_approved INTEGER DEFAULT 0,
    total_stories_rejected INTEGER DEFAULT 0,
    
    -- Admin tracking
    created_by_admin_id UUID,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- 2. Instagram Campaigns Table
CREATE TABLE IF NOT EXISTS public.instagram_campaigns (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_name VARCHAR(255) NOT NULL,
    per_story_reward INTEGER NOT NULL DEFAULT 100, -- Loyalty coins per approved story
    story_minimum_duration INTEGER DEFAULT 24, -- Hours
    campaign_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    campaign_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    instructions TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    
    -- Admin tracking
    created_by_admin_id UUID,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Instagram Stories Table
CREATE TABLE IF NOT EXISTS public.instagram_stories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id VARCHAR(50) NOT NULL UNIQUE, -- Format: IG-YYYYMMDD-XXX
    instagram_user_id UUID NOT NULL REFERENCES public.instagram_users(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.instagram_campaigns(id) ON DELETE CASCADE,
    
    -- Story tracking
    story_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    story_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    story_status VARCHAR(30) DEFAULT 'active' CHECK (story_status IN ('active', 'expired', 'awaiting_review', 'approved', 'rejected')),
    
    -- Admin verification
    admin_verified_by UUID,
    admin_verification_notes TEXT,
    admin_verified_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Rewards
    coins_awarded INTEGER DEFAULT 0,
    coins_awarded_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Instagram Story Timers Table (for tracking and reminders)
CREATE TABLE IF NOT EXISTS public.instagram_story_timers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES public.instagram_stories(id) ON DELETE CASCADE,
    instagram_user_id UUID NOT NULL REFERENCES public.instagram_users(id) ON DELETE CASCADE,
    
    -- Timer tracking
    timer_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    timer_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    timer_status VARCHAR(20) DEFAULT 'running' CHECK (timer_status IN ('running', 'expired', 'completed')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Instagram Coin Transactions Table
CREATE TABLE IF NOT EXISTS public.instagram_coin_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id VARCHAR(50) NOT NULL UNIQUE, -- Format: ICT-YYYYMMDD-XXX
    instagram_user_id UUID NOT NULL REFERENCES public.instagram_users(id) ON DELETE CASCADE,
    story_id UUID REFERENCES public.instagram_stories(id) ON DELETE SET NULL,
    
    -- Transaction details
    transaction_type VARCHAR(20) DEFAULT 'story_reward' CHECK (transaction_type IN ('story_reward', 'bonus', 'penalty', 'adjustment')),
    coins_amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    
    -- Admin tracking
    processed_by_admin_id UUID,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Instagram Notifications Table
CREATE TABLE IF NOT EXISTS public.instagram_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_type VARCHAR(30) NOT NULL CHECK (notification_type IN ('story_started', 'story_expiring', 'story_expired', 'story_approved', 'story_rejected', 'coins_awarded')),
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('admin', 'instagram_user')),
    recipient_id UUID, -- Can be admin_id or instagram_user_id
    
    -- Notification content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    story_id UUID REFERENCES public.instagram_stories(id) ON DELETE CASCADE,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_instagram_users_username ON public.instagram_users(instagram_username);
CREATE INDEX IF NOT EXISTS idx_instagram_users_email ON public.instagram_users(email);
CREATE INDEX IF NOT EXISTS idx_instagram_users_status ON public.instagram_users(status);
CREATE INDEX IF NOT EXISTS idx_instagram_stories_user_id ON public.instagram_stories(instagram_user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_stories_campaign_id ON public.instagram_stories(campaign_id);
CREATE INDEX IF NOT EXISTS idx_instagram_stories_status ON public.instagram_stories(story_status);
CREATE INDEX IF NOT EXISTS idx_instagram_stories_expires_at ON public.instagram_stories(story_expires_at);
CREATE INDEX IF NOT EXISTS idx_instagram_story_timers_expires_at ON public.instagram_story_timers(timer_expires_at);
CREATE INDEX IF NOT EXISTS idx_instagram_coin_transactions_user_id ON public.instagram_coin_transactions(instagram_user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_notifications_recipient ON public.instagram_notifications(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_instagram_notifications_type ON public.instagram_notifications(notification_type);

-- Disable RLS for development
ALTER TABLE public.instagram_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_stories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_story_timers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_coin_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_notifications DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.instagram_users TO authenticated, anon, service_role;
GRANT ALL ON public.instagram_campaigns TO authenticated, anon, service_role;
GRANT ALL ON public.instagram_stories TO authenticated, anon, service_role;
GRANT ALL ON public.instagram_story_timers TO authenticated, anon, service_role;
GRANT ALL ON public.instagram_coin_transactions TO authenticated, anon, service_role;
GRANT ALL ON public.instagram_notifications TO authenticated, anon, service_role;

-- Insert default campaign
INSERT INTO public.instagram_campaigns (
    campaign_name,
    per_story_reward,
    story_minimum_duration,
    campaign_start_date,
    campaign_end_date,
    instructions,
    status
) VALUES (
    'Default Instagram Marketing Campaign',
    100,
    24,
    now(),
    now() + interval '1 year',
    'Post a story about our products and keep it active for 24 hours. Tag our official account and use our hashtags. Story should showcase our products in a positive light.',
    'active'
) ON CONFLICT DO NOTHING;

-- Insert sample Instagram user (for testing)
INSERT INTO public.instagram_users (
    full_name,
    instagram_username,
    followers_count,
    mobile_number,
    email,
    password_hash,
    status
) VALUES (
    'Priya Sharma',
    'priya_lifestyle',
    5000,
    '9876543210',
    'priya@example.com',
    '$2b$10$example_hash_here', -- In real implementation, this should be properly hashed
    'active'
) ON CONFLICT (instagram_username) DO NOTHING;

-- Add comments
COMMENT ON TABLE public.instagram_users IS 'Instagram influencers manually hired by admin';
COMMENT ON TABLE public.instagram_campaigns IS 'Instagram marketing campaigns with reward rules';
COMMENT ON TABLE public.instagram_stories IS 'Individual story posts by influencers';
COMMENT ON TABLE public.instagram_story_timers IS 'Timer tracking for story duration and reminders';
COMMENT ON TABLE public.instagram_coin_transactions IS 'Loyalty coin transactions for story rewards';
COMMENT ON TABLE public.instagram_notifications IS 'Notifications for admins and Instagram users';

COMMENT ON COLUMN public.instagram_users.followers_count IS 'Must be >= 1000 to be eligible';
COMMENT ON COLUMN public.instagram_campaigns.per_story_reward IS 'Loyalty coins awarded per approved story';
COMMENT ON COLUMN public.instagram_stories.story_status IS 'Tracks story lifecycle from active to approved/rejected';
COMMENT ON COLUMN public.instagram_story_timers.timer_status IS 'Tracks 24-hour timer status';