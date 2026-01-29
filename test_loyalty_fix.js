// Test script to verify loyalty system works after RLS fix
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xeufezbuuccohiardtrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLoyaltySystemFix() {
  console.log('🧪 Testing Loyalty System After RLS Fix...\n');
  
  try {
    // Test 1: Check system settings (should work)
    console.log('1️⃣ Testing system settings access...');
    const { data: settings, error: settingsError } = await supabase
      .from('loyalty_system_settings')
      .select('*')
      .limit(1)
      .single();
    
    if (settingsError) {
      console.log('❌ System settings error:', settingsError.message);
    } else {
      console.log('✅ System settings accessible');
      console.log(`   - System enabled: ${settings.is_system_enabled}`);
      console.log(`   - Earning rate: ${settings.default_coins_per_rupee} coins per rupee`);
    }
    
    // Test 2: Check product settings (should work)
    console.log('\n2️⃣ Testing product settings access...');
    const { data: productSettings, error: productError } = await supabase
      .from('loyalty_product_settings')
      .select('*')
      .limit(1);
    
    if (productError) {
      console.log('❌ Product settings error:', productError.message);
    } else {
      console.log('✅ Product settings accessible');
      console.log(`   - Found ${productSettings?.length || 0} product configurations`);
    }
    
    // Test 3: Check wallet access (this was failing before)
    console.log('\n3️⃣ Testing wallet access (previously failing)...');
    const { data: wallet, error: walletError } = await supabase
      .from('loyalty_coins_wallet')
      .select('*')
      .limit(1);
    
    if (walletError) {
      if (walletError.code === '42501' || walletError.message?.includes('permission')) {
        console.log('❌ Wallet access still blocked - RLS policies need to be applied');
        console.log('   Please run fix_loyalty_rls_policies.sql in Supabase SQL Editor');
      } else {
        console.log('⚠️  Wallet error (might be normal if no user logged in):', walletError.message);
      }
    } else {
      console.log('✅ Wallet table accessible');
    }
    
    // Test 4: Check transactions access (this was failing before)
    console.log('\n4️⃣ Testing transactions access (previously failing)...');
    const { data: transactions, error: transactionError } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .limit(1);
    
    if (transactionError) {
      if (transactionError.code === '42501' || transactionError.message?.includes('permission')) {
        console.log('❌ Transactions access still blocked - RLS policies need to be applied');
        console.log('   Please run fix_loyalty_rls_policies.sql in Supabase SQL Editor');
      } else {
        console.log('⚠️  Transactions error (might be normal if no user logged in):', transactionError.message);
      }
    } else {
      console.log('✅ Transactions table accessible');
    }
    
    console.log('\n📊 Test Summary:');
    console.log('If you see "RLS policies need to be applied" messages above:');
    console.log('1. Open Supabase Dashboard → SQL Editor');
    console.log('2. Run the contents of fix_loyalty_rls_policies.sql');
    console.log('3. Refresh your app and test the Profile → Loyalty Coins tab');
    console.log('\nIf all tests show ✅ or ⚠️ (normal for anonymous access):');
    console.log('🎉 The loyalty system should work correctly now!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLoyaltySystemFix().catch(console.error);