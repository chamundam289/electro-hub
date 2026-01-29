// Debug script to check why loyalty coins are not showing in product cards
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugLoyaltyCoinsDisplay() {
  console.log('🔍 Debugging Loyalty Coins Display Issue...\n');

  try {
    // 1. Check if loyalty system is enabled
    console.log('1. Checking loyalty system settings...');
    const { data: systemSettings, error: systemError } = await supabase
      .from('loyalty_system_settings')
      .select('*')
      .limit(1);

    if (systemError) {
      console.error('❌ System settings error:', systemError.message);
      console.log('💡 Run: fix_all_loyalty_errors.sql');
      return;
    }

    if (!systemSettings || systemSettings.length === 0) {
      console.log('❌ No system settings found');
      console.log('💡 Run: quick_loyalty_setup.sql');
      return;
    }

    const settings = systemSettings[0];
    console.log('✅ System settings found:');
    console.log(`   - System enabled: ${settings.is_system_enabled}`);
    console.log(`   - Coins per rupee: ${settings.default_coins_per_rupee}`);
    console.log(`   - Min coins to redeem: ${settings.min_coins_to_redeem}`);

    if (!settings.is_system_enabled) {
      console.log('❌ Loyalty system is DISABLED');
      console.log('💡 Enable it with: UPDATE loyalty_system_settings SET is_system_enabled = true;');
      return;
    }

    // 2. Check products and their loyalty settings
    console.log('\n2. Checking products and loyalty settings...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price')
      .limit(5);

    if (productsError) {
      console.error('❌ Products error:', productsError.message);
      return;
    }

    if (!products || products.length === 0) {
      console.log('❌ No products found');
      console.log('💡 Add some products first');
      return;
    }

    console.log(`✅ Found ${products.length} products`);

    // 3. Check loyalty settings for each product
    for (const product of products) {
      console.log(`\n   📦 Product: ${product.name} (₹${product.price})`);
      
      const { data: loyaltySettings, error: loyaltyError } = await supabase
        .from('loyalty_product_settings')
        .select('*')
        .eq('product_id', product.id)
        .single();

      if (loyaltyError && loyaltyError.code !== 'PGRST116') {
        console.log(`   ❌ Loyalty settings error: ${loyaltyError.message}`);
        continue;
      }

      if (!loyaltySettings) {
        console.log('   ❌ No loyalty settings found');
        console.log('   💡 This is why coins are not showing!');
        
        // Create default loyalty settings
        const defaultSettings = {
          product_id: product.id,
          coins_earned_per_purchase: Math.floor(product.price * 0.1), // 10% of price
          coins_required_to_buy: Math.floor(product.price * 8), // 8x price in coins
          is_coin_purchase_enabled: true,
          is_coin_earning_enabled: true
        };

        console.log('   🔧 Creating default loyalty settings...');
        const { error: insertError } = await supabase
          .from('loyalty_product_settings')
          .insert(defaultSettings);

        if (insertError) {
          console.log(`   ❌ Failed to create settings: ${insertError.message}`);
        } else {
          console.log('   ✅ Default loyalty settings created!');
          console.log(`      - Earn: ${defaultSettings.coins_earned_per_purchase} coins`);
          console.log(`      - Redeem: ${defaultSettings.coins_required_to_buy} coins`);
        }
      } else {
        console.log('   ✅ Loyalty settings found:');
        console.log(`      - Earn: ${loyaltySettings.coins_earned_per_purchase} coins`);
        console.log(`      - Redeem: ${loyaltySettings.coins_required_to_buy} coins`);
        console.log(`      - Purchase enabled: ${loyaltySettings.is_coin_purchase_enabled}`);
        console.log(`      - Earning enabled: ${loyaltySettings.is_coin_earning_enabled}`);
      }
    }

    // 4. Check RLS policies
    console.log('\n4. Checking RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .rpc('pg_policies')
      .select('*')
      .eq('tablename', 'loyalty_product_settings')
      .catch(() => null);

    if (policies && policies.length > 0) {
      console.log(`✅ Found ${policies.length} RLS policies for loyalty_product_settings`);
    } else {
      console.log('⚠️  Could not check RLS policies (may need admin access)');
    }

    // 5. Test a direct query
    console.log('\n5. Testing direct loyalty settings query...');
    const { data: testSettings, error: testError } = await supabase
      .from('loyalty_product_settings')
      .select('*')
      .limit(3);

    if (testError) {
      console.error('❌ Direct query failed:', testError.message);
      console.log('💡 This is likely the main issue - RLS policies or permissions');
    } else {
      console.log(`✅ Direct query successful - found ${testSettings?.length || 0} loyalty settings`);
    }

    console.log('\n🎯 SUMMARY:');
    console.log('If loyalty coins are still not showing, the issue is likely:');
    console.log('1. ❌ Loyalty system disabled in settings');
    console.log('2. ❌ No loyalty_product_settings records for products');
    console.log('3. ❌ RLS policies blocking access');
    console.log('4. ❌ Frontend not calling the right API');
    
    console.log('\n💡 SOLUTIONS:');
    console.log('1. Run: UPDATE loyalty_system_settings SET is_system_enabled = true;');
    console.log('2. Run: quick_loyalty_setup.sql');
    console.log('3. Check browser console for JavaScript errors');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug
debugLoyaltyCoinsDisplay();