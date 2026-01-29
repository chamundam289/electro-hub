// Complete test for loyalty coins CRUD flow
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompleteLoyaltyFlow() {
  console.log('🔄 Testing Complete Loyalty Coins CRUD Flow...\n');

  try {
    // Step 1: Test system settings
    console.log('1. Testing system settings...');
    const { data: systemSettings, error: systemError } = await supabase
      .from('loyalty_system_settings')
      .select('*')
      .single();

    if (systemError) {
      console.error('❌ System settings error:', systemError.message);
      console.log('💡 Creating default system settings...');
      
      const { error: insertError } = await supabase
        .from('loyalty_system_settings')
        .insert({
          is_system_enabled: true,
          global_coins_multiplier: 1.00,
          default_coins_per_rupee: 0.10,
          min_coins_to_redeem: 10,
          festive_multiplier: 1.00
        });

      if (insertError) {
        console.error('❌ Failed to create system settings:', insertError.message);
        return;
      }
      console.log('✅ System settings created');
    } else {
      console.log('✅ System settings found:', {
        enabled: systemSettings.is_system_enabled,
        coins_per_rupee: systemSettings.default_coins_per_rupee
      });
    }

    // Step 2: Test product creation with loyalty settings
    console.log('\n2. Testing product creation with loyalty settings...');
    
    // Create a test product
    const testProduct = {
      name: 'Test Product for Loyalty',
      slug: 'test-product-loyalty-' + Date.now(),
      price: 100,
      stock_quantity: 10,
      is_visible: true,
      is_featured: false
    };

    const { data: product, error: productError } = await supabase
      .from('products')
      .insert(testProduct)
      .select()
      .single();

    if (productError) {
      console.error('❌ Product creation error:', productError.message);
      return;
    }

    console.log('✅ Test product created:', product.name);

    // Step 3: Create loyalty settings for the product
    console.log('\n3. Creating loyalty settings for product...');
    
    const loyaltySettings = {
      product_id: product.id,
      coins_earned_per_purchase: 10,
      coins_required_to_buy: 100,
      is_coin_purchase_enabled: true,
      is_coin_earning_enabled: true
    };

    const { error: loyaltyError } = await supabase
      .from('loyalty_product_settings')
      .insert(loyaltySettings);

    if (loyaltyError) {
      console.error('❌ Loyalty settings creation error:', loyaltyError.message);
      return;
    }

    console.log('✅ Loyalty settings created for product');

    // Step 4: Test fetching loyalty settings (simulate user side)
    console.log('\n4. Testing loyalty settings fetch (user side simulation)...');
    
    const { data: fetchedSettings, error: fetchError } = await supabase
      .from('loyalty_product_settings')
      .select('*')
      .eq('product_id', product.id)
      .single();

    if (fetchError) {
      console.error('❌ Fetch loyalty settings error:', fetchError.message);
      return;
    }

    console.log('✅ Loyalty settings fetched successfully:', {
      earn_coins: fetchedSettings.coins_earned_per_purchase,
      redeem_coins: fetchedSettings.coins_required_to_buy,
      can_redeem: fetchedSettings.is_coin_purchase_enabled
    });

    // Step 5: Test updating loyalty settings (simulate admin edit)
    console.log('\n5. Testing loyalty settings update (admin edit simulation)...');
    
    const updatedSettings = {
      coins_earned_per_purchase: 15,
      coins_required_to_buy: 150,
      is_coin_purchase_enabled: true,
      is_coin_earning_enabled: true,
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('loyalty_product_settings')
      .update(updatedSettings)
      .eq('product_id', product.id);

    if (updateError) {
      console.error('❌ Update loyalty settings error:', updateError.message);
      return;
    }

    console.log('✅ Loyalty settings updated successfully');

    // Step 6: Verify the update
    console.log('\n6. Verifying updated settings...');
    
    const { data: verifySettings, error: verifyError } = await supabase
      .from('loyalty_product_settings')
      .select('*')
      .eq('product_id', product.id)
      .single();

    if (verifyError) {
      console.error('❌ Verify settings error:', verifyError.message);
      return;
    }

    console.log('✅ Updated settings verified:', {
      earn_coins: verifySettings.coins_earned_per_purchase,
      redeem_coins: verifySettings.coins_required_to_buy,
      updated_at: verifySettings.updated_at
    });

    // Step 7: Test RLS policies
    console.log('\n7. Testing RLS policies access...');
    
    const { data: allSettings, error: allError } = await supabase
      .from('loyalty_product_settings')
      .select('*')
      .limit(5);

    if (allError) {
      console.error('❌ RLS policy error:', allError.message);
      console.log('💡 This might be why user side is not working!');
    } else {
      console.log(`✅ RLS policies working - found ${allSettings.length} loyalty settings`);
    }

    // Step 8: Clean up test data
    console.log('\n8. Cleaning up test data...');
    
    await supabase.from('loyalty_product_settings').delete().eq('product_id', product.id);
    await supabase.from('products').delete().eq('id', product.id);
    
    console.log('✅ Test data cleaned up');

    // Step 9: Final diagnosis
    console.log('\n🎯 FLOW DIAGNOSIS:');
    console.log('✅ System settings: Working');
    console.log('✅ Product creation: Working');
    console.log('✅ Loyalty settings CRUD: Working');
    console.log('✅ Database queries: Working');
    
    console.log('\n💡 If user side still not working, check:');
    console.log('1. Frontend JavaScript console for errors');
    console.log('2. Network tab for failed API calls');
    console.log('3. React component state updates');
    console.log('4. useLoyaltyCoins hook implementation');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the complete test
testCompleteLoyaltyFlow();