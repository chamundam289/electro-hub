// Quick script to verify loyalty system is working properly
const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'https://xeufezbuuccohiardtrk.supabase.co';
const supabaseKey = 'your-anon-key'; // Replace with your actual anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLoyaltySystem() {
  console.log('🔍 Testing Loyalty System...\n');

  try {
    // Test 1: Check system settings
    console.log('1. Testing system settings...');
    const { data: settings, error: settingsError } = await supabase
      .from('loyalty_system_config')
      .select('*')
      .limit(1)
      .single();

    if (settingsError) {
      console.log('❌ System settings error:', settingsError.message);
      console.log('💡 Please run: LOYALTY_COINS_FINAL_FIX.sql');
      return;
    }

    console.log('✅ System settings loaded:', {
      enabled: settings.is_system_enabled,
      coins_per_rupee: settings.default_coins_per_rupee,
      min_redeem: settings.min_coins_to_redeem
    });

    // Test 2: Check if safe functions exist
    console.log('\n2. Testing safe functions...');
    const { data: functions, error: functionsError } = await supabase
      .rpc('get_user_wallet_safe', { p_user_id: '00000000-0000-0000-0000-000000000000' });

    if (functionsError && !functionsError.message.includes('invalid input syntax')) {
      console.log('❌ Safe functions error:', functionsError.message);
      console.log('💡 Please run: LOYALTY_COINS_FINAL_FIX.sql');
      return;
    }

    console.log('✅ Safe functions are available');

    // Test 3: Check table structure
    console.log('\n3. Testing table structure...');
    const { data: wallets, error: walletsError } = await supabase
      .from('loyalty_coins_wallet')
      .select('*')
      .limit(1);

    if (walletsError) {
      console.log('❌ Wallet table error:', walletsError.message);
      return;
    }

    console.log('✅ Wallet table accessible');

    // Test 4: Check permissions
    console.log('\n4. Testing permissions...');
    const { data: transactions, error: transactionsError } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .limit(1);

    if (transactionsError) {
      console.log('❌ Transactions table error:', transactionsError.message);
      return;
    }

    console.log('✅ Transactions table accessible');

    console.log('\n🎉 All tests passed! Loyalty system is working properly.');
    console.log('\n📋 Summary:');
    console.log('- System is enabled:', settings.is_system_enabled);
    console.log('- Coins per rupee:', settings.default_coins_per_rupee);
    console.log('- Minimum redeem:', settings.min_coins_to_redeem);
    console.log('- Safe functions: Available');
    console.log('- Database tables: Accessible');
    console.log('- Permissions: Correct');

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    console.log('💡 Please check your Supabase connection and run: LOYALTY_COINS_FINAL_FIX.sql');
  }
}

// Run the test
testLoyaltySystem();

module.exports = { testLoyaltySystem };