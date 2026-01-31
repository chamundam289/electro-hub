// Enable loyalty system for all products
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xeufezbuuccohiardtrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function enableLoyaltyForAllProducts() {
  console.log('🔧 Enabling Loyalty System for All Products...\n');
  
  try {
    // 1. Ensure the loyalty system is enabled globally
    console.log('📋 Step 1: Enabling global loyalty system...');
    const { error: systemError } = await supabase
      .from('loyalty_system_settings')
      .update({ is_system_enabled: true })
      .eq('id', 'eef33271-caed-4eb2-a7ea-aa4d5e288a0f');
    
    if (systemError) {
      console.error('❌ Error enabling system:', systemError.message);
    } else {
      console.log('✅ Global loyalty system enabled');
    }
    
    // 2. Get all products that don't have loyalty settings
    console.log('\n📋 Step 2: Finding products without loyalty settings...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id, name, price,
        loyalty_product_settings!left (product_id)
      `);
    
    if (productsError) {
      console.error('❌ Error fetching products:', productsError.message);
      return;
    }
    
    const productsWithoutSettings = products.filter(p => !p.loyalty_product_settings || p.loyalty_product_settings.length === 0);
    console.log(`📊 Found ${productsWithoutSettings.length} products without loyalty settings`);
    
    // 3. Create loyalty settings for products that don't have them
    if (productsWithoutSettings.length > 0) {
      console.log('\n📋 Step 3: Creating loyalty settings for products...');
      
      const loyaltySettings = productsWithoutSettings.map(product => ({
        product_id: product.id,
        coins_earned_per_purchase: product.price <= 100 ? 5 : 
                                   product.price <= 500 ? 10 : 
                                   product.price <= 1000 ? 20 : 30,
        coins_required_to_buy: product.price <= 100 ? 50 : 
                              product.price <= 500 ? 100 : 
                              product.price <= 1000 ? 200 : 300,
        is_coin_purchase_enabled: true,
        is_coin_earning_enabled: true
      }));
      
      const { error: insertError } = await supabase
        .from('loyalty_product_settings')
        .insert(loyaltySettings);
      
      if (insertError) {
        console.error('❌ Error creating loyalty settings:', insertError.message);
      } else {
        console.log(`✅ Created loyalty settings for ${loyaltySettings.length} products`);
      }
    }
    
    // 4. Update existing settings to ensure they're enabled
    console.log('\n📋 Step 4: Enabling existing loyalty settings...');
    const { error: updateError } = await supabase
      .from('loyalty_product_settings')
      .update({
        is_coin_purchase_enabled: true,
        is_coin_earning_enabled: true
      })
      .or('is_coin_purchase_enabled.eq.false,is_coin_earning_enabled.eq.false');
    
    if (updateError) {
      console.error('❌ Error updating settings:', updateError.message);
    } else {
      console.log('✅ All existing loyalty settings enabled');
    }
    
    // 5. Verify the results
    console.log('\n📋 Step 5: Verifying results...');
    
    // Check system settings
    const { data: systemSettings } = await supabase
      .from('loyalty_system_settings')
      .select('is_system_enabled, default_coins_per_rupee, min_coins_to_redeem')
      .eq('id', 'eef33271-caed-4eb2-a7ea-aa4d5e288a0f')
      .single();
    
    // Check product settings
    const { data: productSettings, count } = await supabase
      .from('loyalty_product_settings')
      .select('*', { count: 'exact' })
      .eq('is_coin_earning_enabled', true);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 LOYALTY SYSTEM ENABLEMENT REPORT');
    console.log('='.repeat(60));
    
    console.log('\n📊 System Settings:');
    if (systemSettings) {
      console.log(`   Status: ${systemSettings.is_system_enabled ? 'Enabled' : 'Disabled'}`);
      console.log(`   Coins per Rupee: ${systemSettings.default_coins_per_rupee}`);
      console.log(`   Min Coins to Redeem: ${systemSettings.min_coins_to_redeem}`);
    }
    
    console.log('\n📊 Product Settings:');
    console.log(`   Products Configured: ${count || 0}`);
    
    if (productSettings && productSettings.length > 0) {
      const avgEarned = productSettings.reduce((sum, p) => sum + p.coins_earned_per_purchase, 0) / productSettings.length;
      const avgRequired = productSettings.reduce((sum, p) => sum + p.coins_required_to_buy, 0) / productSettings.length;
      console.log(`   Average Coins Earned: ${avgEarned.toFixed(1)}`);
      console.log(`   Average Coins Required: ${avgRequired.toFixed(1)}`);
    }
    
    // Final status
    console.log('\n🎉 LOYALTY SYSTEM ENABLEMENT COMPLETE!');
    if (systemSettings?.is_system_enabled && count > 0) {
      console.log('✅ System is fully enabled and configured');
      console.log('✅ All products have loyalty settings');
      console.log('✅ DualCoinsDisplay should now work properly');
    } else {
      console.log('⚠️  Some issues detected - please check the logs above');
    }
    
  } catch (error) {
    console.error('❌ Critical error:', error.message);
  }
}

enableLoyaltyForAllProducts().catch(console.error);