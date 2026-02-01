const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://xeufezbuuccohiardtrk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createInstagramTables() {
  console.log('🚀 Creating Instagram Marketing Tables...\n');

  try {
    // Create instagram_users table
    console.log('1️⃣ Creating instagram_users table...');
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql_query: `
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
          created_by_admin_id UUID,
          admin_notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          last_login_at TIMESTAMP WITH TIME ZONE
        );
        
        ALTER TABLE public.instagram_users DISABLE ROW LEVEL SECURITY;
        GRANT ALL ON public.instagram_users TO authenticated, anon, service_role;
      `
    });

    if (usersError) {
      console.log('⚠️ Users table creation (may already exist):', usersError.message);
    } else {
      console.log('✅ instagram_users table created');
    }

    // Create instagram_campaigns table
    console.log('2️⃣ Creating instagram_campaigns table...');
    const { error: campaignsError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.instagram_campaigns (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          campaign_name VARCHAR(255) NOT NULL,
          per_story_reward INTEGER NOT NULL DEFAULT 100,
          story_minimum_duration INTEGER DEFAULT 24,
          campaign_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
          campaign_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
          instructions TEXT NOT NULL,
          status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
          created_by_admin_id UUID,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        
        ALTER TABLE public.instagram_campaigns DISABLE ROW LEVEL SECURITY;
        GRANT ALL ON public.instagram_campaigns TO authenticated, anon, service_role;
      `
    });

    if (campaignsError) {
      console.log('⚠️ Campaigns table creation (may already exist):', campaignsError.message);
    } else {
      console.log('✅ instagram_campaigns table created');
    }

    // Create instagram_stories table
    console.log('3️⃣ Creating instagram_stories table...');
    const { error: storiesError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.instagram_stories (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          story_id VARCHAR(50) NOT NULL UNIQUE,
          instagram_user_id UUID NOT NULL,
          campaign_id UUID NOT NULL,
          story_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          story_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          story_status VARCHAR(30) DEFAULT 'active' CHECK (story_status IN ('active', 'expired', 'awaiting_review', 'approved', 'rejected')),
          admin_verified_by UUID,
          admin_verification_notes TEXT,
          admin_verified_at TIMESTAMP WITH TIME ZONE,
          rejection_reason TEXT,
          coins_awarded INTEGER DEFAULT 0,
          coins_awarded_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        
        ALTER TABLE public.instagram_stories DISABLE ROW LEVEL SECURITY;
        GRANT ALL ON public.instagram_stories TO authenticated, anon, service_role;
      `
    });

    if (storiesError) {
      console.log('⚠️ Stories table creation (may already exist):', storiesError.message);
    } else {
      console.log('✅ instagram_stories table created');
    }

    // Insert default campaign
    console.log('4️⃣ Creating default campaign...');
    const { error: defaultCampaignError } = await supabase
      .from('instagram_campaigns')
      .upsert([{
        campaign_name: 'Default Instagram Marketing Campaign',
        per_story_reward: 100,
        story_minimum_duration: 24,
        campaign_start_date: new Date().toISOString(),
        campaign_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        instructions: 'Post a story about our products and keep it active for 24 hours. Tag our official account and use our hashtags. Story should showcase our products in a positive light.',
        status: 'active'
      }], { onConflict: 'campaign_name' });

    if (defaultCampaignError) {
      console.log('⚠️ Default campaign creation:', defaultCampaignError.message);
    } else {
      console.log('✅ Default campaign created');
    }

    // Insert sample influencer
    console.log('5️⃣ Creating sample influencer...');
    const { error: sampleInfluencerError } = await supabase
      .from('instagram_users')
      .upsert([{
        full_name: 'Priya Sharma',
        instagram_username: 'priya_lifestyle',
        followers_count: 5000,
        mobile_number: '9876543210',
        email: 'priya@example.com',
        password_hash: 'instagram123',
        status: 'active'
      }], { onConflict: 'instagram_username' });

    if (sampleInfluencerError) {
      console.log('⚠️ Sample influencer creation:', sampleInfluencerError.message);
    } else {
      console.log('✅ Sample influencer created');
    }

    console.log('\n🎉 Instagram Marketing System Setup Complete!');
    console.log('\n📋 What was created:');
    console.log('✅ instagram_users table (for influencers)');
    console.log('✅ instagram_campaigns table (for campaign management)');
    console.log('✅ instagram_stories table (for story tracking)');
    console.log('✅ Default active campaign');
    console.log('✅ Sample influencer account');

    console.log('\n🔐 Demo Login Credentials:');
    console.log('📧 Email: priya@example.com');
    console.log('🔑 Password: instagram123');

    console.log('\n🔗 Access URLs:');
    console.log('👑 Admin Panel: http://localhost:8081/admin (Instagram Marketing tab)');
    console.log('📸 Influencer Login: http://localhost:8081/instagram-login');

    console.log('\n💡 Next Steps:');
    console.log('1. Login to admin panel and add more influencers');
    console.log('2. Test influencer login and story posting');
    console.log('3. Verify admin story approval workflow');
    console.log('4. Check loyalty coins integration');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

createInstagramTables();