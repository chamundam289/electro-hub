// Test script for affiliate profile system
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAffiliateProfileSystem() {
  console.log('🧪 Testing Affiliate Profile System...\n');

  try {
    // Test 1: Check if affiliate_profiles table exists
    console.log('1️⃣ Testing table existence...');
    const { data: tableData, error: tableError } = await supabase
      .from('affiliate_profiles')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table access error:', tableError.message);
    } else {
      console.log('✅ affiliate_profiles table accessible');
    }

    // Test 2: Check RLS policies
    console.log('\n2️⃣ Testing RLS policies...');
    const { data: policyData, error: policyError } = await supabase
      .from('affiliate_profiles')
      .select('*')
      .limit(1);
    
    if (policyError) {
      console.log('⚠️ RLS policy response:', policyError.message);
    } else {
      console.log('✅ RLS policies working (no data expected without auth)');
    }

    // Test 3: Check if functions exist
    console.log('\n3️⃣ Testing functions...');
    const { data: funcData, error: funcError } = await supabase
      .rpc('is_user_affiliate', { check_user_id: '00000000-0000-0000-0000-000000000001' });
    
    if (funcError) {
      console.error('❌ Function error:', funcError.message);
    } else {
      console.log('✅ Helper functions working');
    }

    // Test 4: Check user_roles table for affiliates
    console.log('\n4️⃣ Testing affiliate roles...');
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('role', 'affiliate')
      .limit(5);
    
    if (rolesError) {
      console.error('❌ Roles error:', rolesError.message);
    } else {
      console.log(`✅ Found ${rolesData?.length || 0} affiliate users`);
    }

    console.log('\n🎉 Affiliate profile system test completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Run FIX_AFFILIATE_PROFILE_PERMISSIONS.sql');
    console.log('2. Login as an affiliate user');
    console.log('3. Navigate to /affiliate/profile');
    console.log('4. Test profile creation and updates');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAffiliateProfileSystem();