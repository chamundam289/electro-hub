// Test script to verify loyalty system fixes
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testLoyaltySystemFixes() {
  console.log('🧪 Testing Loyalty System Final Fixes...\n');

  try {
    // Test 1: System Settings Consistency
    console.log('1️⃣ Testing system settings consistency...');
    const { data: settings, error: settingsError } = await supabase
      .from('loyalty_system_config')
      .select('*')
      .limit(1)
      .single();
    
    if (settingsError) {
      console.error('❌ System settings error:', settingsError);
    } else {
      console.log('✅ System settings loaded:', {
        enabled: settings.is_system_enabled,
        coinsPerRupee: settings.default_coins_per_rupee
      });
    }

    // Test 2: Product Settings Auto-Creation
    console.log('\n2️⃣ Testing product settings auto-creation...');
    const { data: products } = await supabase
      .from('products')
      .select('id, name')
      .limit(3);
    
    if (products && products.length > 0) {
      for (const product of products) {
        const { data: productSettings } = await supabase
          .rpc('get_or_create_loyalty_settings', { p_product_id: product.id });
        
        if (productSettings && productSettings.length > 0) {
          console.log(`✅ Product "${product.name}" has loyalty settings`);
        } else {
          console.log(`❌ Product "${product.name}" missing loyalty settings`);
        }
      }
    }

    // Test 3: Wallet Creation (simulate user)
    console.log('\n3️⃣ Testing wallet creation...');
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const { data: wallet } = await supabase
      .rpc('get_user_wallet_safe', { p_user_id: testUserId });
    
    if (wallet && wallet.length > 0) {
      console.log('✅ Wallet creation/retrieval works');
    } else {
      console.log('❌ Wallet creation failed');
    }

    console.log('\n🎉 Loyalty system test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLoyaltySystemFixes();