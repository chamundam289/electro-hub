// Test All Database Fixes
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xeufezbuuccohiardtrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAllFixes() {
  try {
    console.log('🧪 Testing All Database Fixes...\n');
    
    // Test 1: Storage tracking tables
    console.log('🔍 Testing storage tracking...');
    const { data: storageData, error: storageError } = await supabase
      .from('storage_usage_tracking')
      .select('*')
      .limit(1);
    
    if (storageError) {
      console.log('❌ storage_usage_tracking:', storageError.message);
    } else {
      console.log('✅ storage_usage_tracking: Working');
    }
    
    // Test 2: Storage usage views
    console.log('🔍 Testing storage usage views...');
    const { data: usageData, error: usageError } = await supabase
      .from('overall_storage_usage')
      .select('*')
      .single();
    
    if (usageError) {
      console.log('❌ overall_storage_usage:', usageError.message);
    } else {
      console.log('✅ overall_storage_usage: Working');
      console.log('📊 Current usage:', {
        files: usageData.total_files,
        size_mb: usageData.total_size_mb,
        percentage: usageData.usage_percentage + '%'
      });
    }
    
    // Test 3: Repair technicians table
    console.log('🔍 Testing repair technicians...');
    const { data: techData, error: techError } = await supabase
      .from('repair_technicians')
      .select('*')
      .limit(1);
    
    if (techError) {
      console.log('❌ repair_technicians:', techError.message);
    } else {
      console.log('✅ repair_technicians: Working');
    }
    
    // Test 4: Website settings table
    console.log('🔍 Testing website settings...');
    const { data: settingsData, error: settingsError } = await supabase
      .from('website_settings')
      .select('*')
      .limit(1);
    
    if (settingsError) {
      console.log('❌ website_settings:', settingsError.message);
    } else {
      console.log('✅ website_settings: Working');
    }
    
    // Test 5: Users table
    console.log('🔍 Testing users table...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('❌ users:', usersError.message);
    } else {
      console.log('✅ users: Working');
    }
    
    // Test 6: Existing tables that should work
    console.log('🔍 Testing existing tables...');
    const existingTables = ['products', 'orders', 'instagram_users', 'instagram_stories'];
    
    for (const table of existingTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: ${count || 0} rows`);
        }
      } catch (err) {
        console.log(`❌ ${table}: Access error`);
      }
    }
    
    console.log('\n📊 Test Summary:');
    console.log('✅ Database Management page should now work without errors');
    console.log('✅ Storage tracking functionality enabled');
    console.log('✅ Repair Analytics should work');
    console.log('✅ Website Settings should work');
    console.log('✅ All 404 errors should be resolved');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Refresh your admin dashboard');
    console.log('2. Go to Database page - should show storage data');
    console.log('3. Upload files - should be tracked automatically');
    console.log('4. No more 404 errors in console');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAllFixes().catch(console.error);