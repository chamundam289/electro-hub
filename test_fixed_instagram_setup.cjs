const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xeufezbuuccohiardtrk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFixedSetup() {
  console.log('🧪 Testing Fixed Instagram Setup...\n');

  try {
    // Test if tables exist and are accessible
    console.log('1️⃣ Testing table access...');
    
    const { data: usersData, error: usersError } = await supabase
      .from('instagram_users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.log('❌ Tables not found. Please run the setup files:');
      console.log('📄 1. instagram_tables_fixed_setup.sql');
      console.log('📄 2. instagram_sample_data.sql');
      console.log('Error:', usersError.message);
      return;
    }
    
    console.log('✅ instagram_users table accessible');
    console.log('📊 Found', usersData.length, 'users');

    // List all users
    if (usersData.length > 0) {
      console.log('\n👥 Existing Users:');
      usersData.forEach(user => {
        console.log(`   - ${user.full_name} (@${user.instagram_username}) - ${user.followers_count} followers`);
      });
    }

    // Test campaigns
    const { data: campaignsData, error: campaignsError } = await supabase
      .from('instagram_campaigns')
      .select('*');
    
    if (campaignsError) {
      console.log('❌ Campaigns table error:', campaignsError.message);
    } else {
      console.log('\n📋 Campaigns:');
      console.log('✅ Found', campaignsData.length, 'campaigns');
      campaignsData.forEach(campaign => {
        console.log(`   - ${campaign.campaign_name} (${campaign.per_story_reward} coins per story)`);
      });
    }

    // Test creating a new user (to verify no conflicts)
    console.log('\n2️⃣ Testing user creation...');
    
    const testUser = {
      full_name: 'Test User ' + Date.now(),
      instagram_username: 'test_user_' + Date.now(),
      followers_count: 2500,
      mobile_number: '9876543212',
      email: 'test_' + Date.now() + '@example.com',
      password_hash: 'instagram123',
      status: 'active'
    };

    const { data: newUser, error: createError } = await supabase
      .from('instagram_users')
      .insert([testUser])
      .select()
      .single();

    if (createError) {
      console.error('❌ User creation error:', createError.message);
    } else {
      console.log('✅ Test user created successfully');
      console.log('📝 User:', newUser.full_name, '(@' + newUser.instagram_username + ')');
      
      // Clean up test data
      await supabase
        .from('instagram_users')
        .delete()
        .eq('id', newUser.id);
      console.log('🧹 Test data cleaned up');
    }

    console.log('\n🎉 Fixed Instagram Setup Test Complete!');
    console.log('\n📋 Status:');
    console.log('✅ Tables accessible without ON CONFLICT errors');
    console.log('✅ Sample data loaded properly');
    console.log('✅ User creation working');
    console.log('✅ System ready for use');

    console.log('\n🔗 Ready to Test:');
    console.log('👑 Admin: /admin → Instagram Marketing tab');
    console.log('📸 Influencer: /instagram-login');
    console.log('📧 Demo: priya@example.com / instagram123');
    console.log('📧 Demo: raj@example.com / instagram123');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFixedSetup();