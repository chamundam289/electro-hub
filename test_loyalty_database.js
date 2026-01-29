// Simple test to check if loyalty database tables exist
// Run this to verify your setup

import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase credentials
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xeufezbuuccohiardtrk.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLoyaltyDatabase() {
  console.log('🧪 Testing Loyalty Database Setup...\n');
  
  const tables = [
    'loyalty_coins_wallet',
    'loyalty_transactions', 
    'loyalty_product_settings',
    'loyalty_system_settings'
  ];
  
  let allTablesExist = true;
  
  for (const table of tables) {
    try {
      console.log(`🔍 Checking table: ${table}`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === '42P01' || error.message?.includes('relation')) {
          console.log(`❌ Table ${table} does not exist`);
          allTablesExist = false;
        } else if (error.code === '42501' || error.message?.includes('permission')) {
          console.log(`⚠️  Table ${table} exists but RLS policies may need setup`);
        } else {
          console.log(`✅ Table ${table} exists and accessible`);
        }
      } else {
        console.log(`✅ Table ${table} exists and accessible`);
      }
    } catch (err) {
      console.log(`❌ Error checking ${table}:`, err.message);
      allTablesExist = false;
    }
  }
  
  console.log('\n📊 Test Results:');
  
  if (allTablesExist) {
    console.log('🎉 All loyalty tables exist! System should work correctly.');
    
    // Test system settings
    try {
      const { data: settings } = await supabase
        .from('loyalty_system_settings')
        .select('*')
        .limit(1)
        .single();
        
      if (settings) {
        console.log('⚙️  System Settings:');
        console.log(`   - System Enabled: ${settings.is_system_enabled}`);
        console.log(`   - Coins per Rupee: ${settings.default_coins_per_rupee}`);
        console.log(`   - Min Redemption: ${settings.min_coins_to_redeem}`);
      }
    } catch (err) {
      console.log('⚠️  Could not fetch system settings');
    }
    
  } else {
    console.log('❌ Some tables are missing. Please run the setup script:');
    console.log('   1. Open Supabase Dashboard → SQL Editor');
    console.log('   2. Copy contents of loyalty_coins_system_setup.sql');
    console.log('   3. Paste and execute in SQL Editor');
  }
}

// Run the test
testLoyaltyDatabase().catch(console.error);