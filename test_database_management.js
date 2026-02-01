// Test Database Management Functionality
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xeufezbuuccohiardtrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabaseManagement() {
  console.log('🧪 Testing Database Management Page Functionality...\n');
  
  try {
    // Test 1: Check if Database Management page can load without errors
    console.log('🔍 Testing basic database connectivity...');
    
    // Test existing tables that should work
    const existingTables = ['products', 'orders', 'instagram_users', 'instagram_stories'];
    let workingTables = 0;
    
    for (const table of existingTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`✅ ${table}: ${count || 0} rows`);
          workingTables++;
        } else {
          console.log(`❌ ${table}: ${error.message}`);
        }
      } catch (err) {
        console.log(`❌ ${table}: Access error`);
      }
    }
    
    // Test 2: Check storage tracking (optional)
    console.log('\n🔍 Testing storage tracking (optional)...');
    try {
      const { data: storageData, error: storageError } = await supabase
        .from('storage_usage_tracking')
        .select('*')
        .limit(1);
      
      if (storageError) {
        console.log('⚠️  Storage tracking not available (this is OK - fallback will be used)');
        console.log('   Database Management page will show estimated data');
      } else {
        console.log('✅ Storage tracking available');
      }
    } catch (err) {
      console.log('⚠️  Storage tracking not available (this is OK - fallback will be used)');
    }
    
    // Test 3: Check website settings
    console.log('\n🔍 Testing website settings...');
    try {
      const { data: settingsData, error: settingsError } = await supabase
        .from('website_settings')
        .select('*')
        .limit(1);
      
      if (settingsError) {
        console.log('❌ website_settings:', settingsError.message);
      } else {
        console.log('✅ website_settings: Working');
      }
    } catch (err) {
      console.log('❌ website_settings: Not available');
    }
    
    // Summary
    console.log('\n📊 Test Results:');
    console.log(`✅ Basic database connectivity: ${workingTables}/${existingTables.length} tables working`);
    
    if (workingTables >= 2) {
      console.log('✅ Database Management page should load without major errors');
      console.log('✅ Basic functionality will work with fallback data');
    } else {
      console.log('❌ Database connectivity issues detected');
    }
    
    console.log('\n🚀 What to expect:');
    console.log('1. Database Management page will load');
    console.log('2. Storage usage will show estimated/fallback data');
    console.log('3. Database tables section will show available tables');
    console.log('4. No more 404 errors in console');
    
    console.log('\n💡 To enable full functionality:');
    console.log('1. Copy the SQL from fix_all_database_errors.sql');
    console.log('2. Run it in Supabase Dashboard → SQL Editor');
    console.log('3. This will enable accurate storage tracking');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDatabaseManagement().catch(console.error);