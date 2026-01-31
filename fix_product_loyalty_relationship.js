// Fix product loyalty relationship and ensure all products have settings
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xeufezbuuccohiardtrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixProductLoyaltyRelationship() {
  console.log('🔧 Fixing Product Loyalty Relationship...\n');
  
  try {
    // 1. Get all products
    console.log('📋 Step 1: Getting all products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, offer_price');
    
    if (productsError) {
      console.error('❌ Error fetching products:', productsError.message);
      return;
    }
    
    console.log(`✅ Found ${products.length} products`);
    
    // 2. Check existing loyalty settings
    console.log('\n📋 Step 2: Checking existing loyalty settings...');
    const { data: existingSettings, error: settingsError } = await supabase
      .from('loyalty_product_settings')
      .select('product_id, coins_earned_per_purchase, coins_required_to_buy');
    
    if (settingsError) {
      console.error('❌ Error fetching settings:', settingsError.message);
      return;
    }
    
    console.log(`✅ Found ${existingSettings.length} existing loyalty settings`);
    
    // 3. Find products without settings
    const existingProductIds = new Set(existingSettings.map(s => s.product_id));
    const productsWithoutSettings = products.filter(p => !existingProductIds.has(p.id));
    
    console.log(`📊 Products without settings: ${productsWithoutSettings.length}`);
    
    // 4. Create settings for products that don't have them
    if (productsWithoutSettings.length > 0) {
      console.log('\n📋 Step 3: Creating loyalty settings for missing products...');
      
      const newSettings = productsWithoutSettings.map(product => {
        const price = product.offer_price || product.price;
        return {
          product_id: product.id,
          coins_earned_per_purchase: price <= 100 ? 5 : 
                                    price <= 500 ? 10 : 
                                    price <= 1000 ? 20 : 
                                    Math.floor(price / 1000) * 10,
          coins_required_to_buy: price <= 100 ? 50 : 
                                price <= 500 ? 100 : 
                                price <= 1000 ? 200 : 
                                Math.floor(price / 10),
          is_coin_purchase_enabled: true,
          is_coin_earning_enabled: true
        };
      });
      
      console.log('Creating settings for products:');
      newSettings.forEach((setting, index) => {
        const product = productsWithoutSettings[index];
        console.log(`   📦 ${product.name}: Earn ${setting.coins_earned_per_purchase}, Redeem ${setting.coins_required_to_buy}`);
      });
      
      const { error: insertError } = await supabase
        .from('loyalty_product_settings')
        .insert(newSettings);
      
      if (insertError) {
        console.error('❌ Error creating settings:', insertError.message);
        return;
      }
      
      console.log(`✅ Created loyalty settings for ${newSettings.length} products`);
    }
    
    // 5. Verify the fix by testing the relationship
    console.log('\n📋 Step 4: Verifying product-loyalty relationship...');
    
    const { data: verifyProducts, error: verifyError } = await supabase
      .from('products')
      .select(`
        id, name, price, offer_price,
        loyalty_product_settings (
          coins_earned_per_purchase,
          coins_required_to_buy,
          is_coin_purchase_enabled,
          is_coin_earning_enabled
        )
      `);
    
    if (verifyError) {
      console.error('❌ Verification error:', verifyError.message);
      return;
    }
    
    let verifyProductsWithSettings = 0;
    let verifyProductsWithoutSettings = 0;
    
    console.log('\n📊 Verification Results:');
    verifyProducts.forEach(product => {
      const settings = product.loyalty_product_settings?.[0];
      if (settings) {
        verifyProductsWithSettings++;
        console.log(`   ✅ ${product.name}: Earn ${settings.coins_earned_per_purchase}, Redeem ${settings.coins_required_to_buy}`);
      } else {
        verifyProductsWithoutSettings++;
        console.log(`   ❌ ${product.name}: No loyalty settings`);
      }
    });
    
    // 6. Test individual product lookup (simulating DualCoinsDisplay)
    console.log('\n📋 Step 5: Testing individual product lookup...');
    
    for (const product of verifyProducts.slice(0, 2)) {
      console.log(`\n   🔍 Testing ${product.name}:`);
      
      // Test direct table query
      const { data: directSettings, error: directError } = await supabase
        .from('loyalty_product_settings')
        .select('*')
        .eq('product_id', product.id)
        .single();
      
      if (directError) {
        console.log(`      ❌ Direct query failed: ${directError.message}`);
      } else {
        console.log(`      ✅ Direct query: Earn ${directSettings.coins_earned_per_purchase}, Redeem ${directSettings.coins_required_to_buy}`);
      }
      
      // Test function call
      const { data: functionSettings, error: functionError } = await supabase
        .rpc('get_or_create_loyalty_settings', { input_product_id: product.id });
      
      if (functionError) {
        console.log(`      ⚠️  Function failed: ${functionError.message}`);
      } else if (functionSettings && functionSettings.length > 0) {
        const settings = functionSettings[0];
        console.log(`      ✅ Function query: Earn ${settings.coins_earned_per_purchase}, Redeem ${settings.coins_required_to_buy}`);
      }
    }
    
    // Final report
    console.log('\n' + '='.repeat(60));
    console.log('🎯 PRODUCT LOYALTY RELATIONSHIP FIX REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Final Status:`);
    console.log(`   Total Products: ${verifyProducts.length}`);
    console.log(`   Products with Settings: ${verifyProductsWithSettings}`);
    console.log(`   Products without Settings: ${verifyProductsWithoutSettings}`);
    
    if (verifyProductsWithoutSettings === 0) {
      console.log('\n🎉 RELATIONSHIP FIX SUCCESSFUL!');
      console.log('✅ All products now have loyalty settings');
      console.log('✅ DualCoinsDisplay should work for all products');
      console.log('✅ No more "not configured" messages');
    } else {
      console.log('\n⚠️  SOME ISSUES REMAIN:');
      console.log(`❌ ${verifyProductsWithoutSettings} products still missing settings`);
      console.log('🔄 May need manual intervention');
    }
    
  } catch (error) {
    console.error('❌ Critical error:', error.message);
  }
}

fixProductLoyaltyRelationship().catch(console.error);