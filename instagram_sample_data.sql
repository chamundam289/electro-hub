-- Instagram Marketing Sample Data
-- Run this AFTER running instagram_tables_fixed_setup.sql

-- Insert default campaign (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.instagram_campaigns WHERE campaign_name = 'Default Instagram Marketing Campaign') THEN
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
        );
    END IF;
END $$;

-- Insert sample Instagram user (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.instagram_users WHERE instagram_username = 'priya_lifestyle') THEN
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
            'instagram123',
            'active'
        );
    END IF;
END $$;

-- Insert another sample user for testing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.instagram_users WHERE instagram_username = 'tech_reviewer_raj') THEN
        INSERT INTO public.instagram_users (
            full_name,
            instagram_username,
            followers_count,
            mobile_number,
            email,
            password_hash,
            status
        ) VALUES (
            'Raj Kumar',
            'tech_reviewer_raj',
            15000,
            '9876543211',
            'raj@example.com',
            'instagram123',
            'active'
        );
    END IF;
END $$;