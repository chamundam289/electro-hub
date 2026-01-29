// Debug script to test user side loyalty coins display
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUserSideLoyalty() {
  console.log('🔍 Debugging User Side Loyalty Coins Display...\n');

  try {
    // Step 1: Check system settings
    console.log('1. Checking system settings...');
    const { data: systemSettings, error: systemError } = await supabase
      .from('loyalty_system_settings')
      .select('*')
      .single();

    if (systemError) {
      console.error('❌ System settings error:', systemError.message);
      console.log('💡 SOLUTION: Run force_enable_loyalty_coins.sql');
      return;
    }

    console.log('✅ System settings found:', {
      enabled: systemSettings.is_system_enabled,
      coins_per_rupee: systemSettings.default_coins_per_rupee,
      min_redeem: systemSettings.min_coins_to_redeem
    });

    if (!systemSettings.is_system_enabled) {
      console.log('❌ MAIN ISSUE: System is DISABLED!');
      console.log('💡 SOLUTION: UPDATE loyalty_system_settings SET is_system_enabled = true;');
      return;
    }

    // Step 2: Check products with loyalty settings
    console.log('\n2. Checking products with loyalty settings...');
    const { data: productsWithLoyalty, error: loyaltyError } = await supabase
      .from('products')
      .select(`
        id, name, price,
        loyalty_product_settings (
          coins_earned_per_purchase,
          coins_required_to_buy,
          is_coin_purchase_enabled,
          is_coin_earning_enabled
        )
      `)
      .limit(5);

    if (loyaltyError) {
      console.error('❌ Products with loyalty error:', loyaltyError.message);
      return;
    }

    console.log(`✅ Found ${productsWithLoyalty.length} products`);

    let productsWithSettings = 0;
    let productsWithoutSettings = 0;

    productsWithLoyalty.forEach(product => {
      const hasSettings = product.loyalty_product_settings && product.loyalty_product_settings.length > 0;
      
      if (hasSettings) {
        productsWithSettings++;
        const settings = product.loyalty_product_settings[0];
        console.log(`   ✅ ${product.name}: Earn ${settings.coins_earned_per_purchase}, Redeem ${settings.coins_required_to_buy}`);
      } else {
        productsWithoutSettings++;
        console.log(`   ❌ ${product.name}: NO LOYALTY SETTINGS`);
      }
    });

    console.log(`\n📊 Summary: ${productsWithSettings} with settings, ${productsWithoutSettings} without`);

    if (productsWithoutSettings > 0) {
      console.log('❌ MAIN ISSUE: Products missing loyalty settings!');
      console.log('💡 SOLUTION: Admin panel should create loyalty settings when saving products');
    }

    // Step 3: Test direct loyalty settings query
    console.log('\n3. Testing direct loyalty settings query...');
    const { data: allLoyaltySettings, error: allError } = await supabase
      .from('loyalty_product_settings')
      .select('*')
      .limit(10);

    if (allError) {
      console.error('❌ Direct loyalty query error:', allError.message);
      console.log('💡 SOLUTION: Check RLS policies or table permissions');
      return;
    }

    console.log(`✅ Found ${allLoyaltySettings.length} loyalty settings in database`);

    if (allLoyaltySettings.length === 0) {
      console.log('❌ MAIN ISSUE: No loyalty settings exist in database!');
      console.log('💡 SOLUTION: Admin panel is not creating loyalty settings properly');
      return;
    }

    // Step 4: Simulate user side flow
    console.log('\n4. Simulating user side flow...');
    
    if (allLoyaltySettings.length > 0) {
      const testSetting = allLoyaltySettings[0];
      console.log('🧪 Testing with product:', testSetting.product_id);

      // Simulate getProductLoyaltySettings call
      const { data: singleSetting, error: singleError } = await supabase
        .from('loyalty_product_settings')
        .select('*')
        .eq('product_id', testSetting.product_id)
        .single();

      if (singleError) {
        console.error('❌ Single product query error:', singleError.message);
        return;
      }

      console.log('✅ Single product loyalty settings:', {
        earn: singleSetting.coins_earned_per_purchase,
        redeem: singleSetting.coins_required_to_buy,
        enabled: singleSetting.is_coin_purchase_enabled
      });
    }

    // Step 5: Check for common issues
    console.log('\n5. Checking for common issues...');

    // Check if products table has loyalty columns
    const { data: productSample, error: productError } = await supabase
      .from('products')
      .select('id, name, coins_earned_per_purchase, coins_required_to_buy, is_coin_purchase_enabled')
      .limit(1);

    if (productError) {
      console.log('⚠️  Products table might not have loyalty columns');
    } else if (productSample.length > 0) {
      const product = productSample[0];
      console.log('📋 Product table loyalty columns:', {
        earn: product.coins_earned_per_purchase,
        redeem: product.coins_required_to_buy,
        enabled: product.is_coin_purchase_enabled
      });
    }

    // Final diagnosis
    console.log('\n🎯 FINAL DIAGNOSIS:');
    
    if (systemSettings.is_system_enabled && allLoyaltySettings.length > 0) {
      console.log('✅ Backend is working correctly!');
      console.log('💡 Issue is likely in frontend:');
      console.log('   1. Check browser console for JavaScript errors');
      console.log('   2. Check if useLoyaltyCoins hook is being called');
      console.log('   3. Check if DualCoinsDisplay component is rendering');
      console.log('   4. Check React component state updates');
    } else {
      console.log('❌ Backend issues found:');
      if (!systemSettings.is_system_enabled) {
        console.log('   - System disabled');
      }
      if (allLoyaltySettings.length === 0) {
        console.log('   - No loyalty settings in database');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug
debugUserSideLoyalty();