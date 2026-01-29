// Test script to verify loyalty product settings creation
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testLoyaltyProductSettings() {
  console.log('🧪 Testing Loyalty Product Settings Creation...\n');

  try {
    // 1. Check if loyalty_product_settings table exists
    console.log('1. Checking loyalty_product_settings table...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('loyalty_product_settings')
      .select('count(*)')
      .limit(1);

    if (tableError) {
      console.error('❌ loyalty_product_settings table not found:', tableError.message);
      console.log('💡 Please run the loyalty_coins_system_setup.sql script first');
      return;
    }
    console.log('✅ loyalty_product_settings table exists');

    // 2. Get a sample product
    console.log('\n2. Getting sample product...');
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, name, price')
      .limit(1);

    if (productError || !products || products.length === 0) {
      console.error('❌ No products found:', productError?.message);
      return;
    }

    const sampleProduct = products[0];
    console.log(`✅ Found product: ${sampleProduct.name} (ID: ${sampleProduct.id})`);

    // 3. Check existing loyalty settings for this product
    console.log('\n3. Checking existing loyalty settings...');
    const { data: existingSettings, error: settingsError } = await supabase
      .from('loyalty_product_settings')
      .select('*')
      .eq('product_id', sampleProduct.id)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('❌ Error checking loyalty settings:', settingsError.message);
      return;
    }

    if (existingSettings) {
      console.log('✅ Existing loyalty settings found:');
      console.log(`   - Coins earned per purchase: ${existingSettings.coins_earned_per_purchase}`);
      console.log(`   - Coins required to buy: ${existingSettings.coins_required_to_buy}`);
      console.log(`   - Coin purchase enabled: ${existingSettings.is_coin_purchase_enabled}`);
    } else {
      console.log('ℹ️  No existing loyalty settings found');
    }

    // 4. Create/Update loyalty settings
    console.log('\n4. Creating/updating loyalty settings...');
    const testLoyaltySettings = {
      product_id: sampleProduct.id,
      coins_earned_per_purchase: 15,
      coins_required_to_buy: Math.floor(sampleProduct.price * 0.8),
      is_coin_purchase_enabled: true,
      is_coin_earning_enabled: true,
      updated_at: new Date().toISOString()
    };

    const { data: upsertResult, error: upsertError } = await supabase
      .from('loyalty_product_settings')
      .upsert(testLoyaltySettings, { 
        onConflict: 'product_id',
        ignoreDuplicates: false 
      })
      .select();

    if (upsertError) {
      console.error('❌ Failed to create loyalty settings:', upsertError.message);
      return;
    }

    console.log('✅ Loyalty settings created/updated successfully:');
    console.log(`   - Product: ${sampleProduct.name}`);
    console.log(`   - Coins earned per purchase: ${testLoyaltySettings.coins_earned_per_purchase}`);
    console.log(`   - Coins required to buy: ${testLoyaltySettings.coins_required_to_buy}`);
    console.log(`   - Coin purchase enabled: ${testLoyaltySettings.is_coin_purchase_enabled}`);

    // 5. Verify the settings were saved
    console.log('\n5. Verifying saved settings...');
    const { data: verifySettings, error: verifyError } = await supabase
      .from('loyalty_product_settings')
      .select('*')
      .eq('product_id', sampleProduct.id)
      .single();

    if (verifyError) {
      console.error('❌ Failed to verify settings:', verifyError.message);
      return;
    }

    console.log('✅ Settings verified successfully:');
    console.log(`   - ID: ${verifySettings.id}`);
    console.log(`   - Product ID: ${verifySettings.product_id}`);
    console.log(`   - Coins earned: ${verifySettings.coins_earned_per_purchase}`);
    console.log(`   - Coins required: ${verifySettings.coins_required_to_buy}`);
    console.log(`   - Purchase enabled: ${verifySettings.is_coin_purchase_enabled}`);
    console.log(`   - Earning enabled: ${verifySettings.is_coin_earning_enabled}`);
    console.log(`   - Created at: ${verifySettings.created_at}`);
    console.log(`   - Updated at: ${verifySettings.updated_at}`);

    console.log('\n🎉 All tests passed! Loyalty product settings are working correctly.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testLoyaltyProductSettings();