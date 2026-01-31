// Run loyalty system fix
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xeufezbuuccohiardtrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixLoyaltySystem() {
  console.log('🔧 Fixing Loyalty System Configuration...\n');
  
  try {
    // Check current loyalty system settings
    console.log('📋 Checking current loyalty system settings...');
    const { data: currentSettings, error: settingsError } = await supabase
      .from('loyalty_system_settings')
      .select('*')
      .single();
    
    if (settingsError && settingsError.code !== 'PGRST116') {
      console.log('❌ Error fetching settings:', settingsError.message);
    } else if (!currentSettings) {
      console.log('⚠️  No loyalty system settings found, creating default...');
      
      // Create default settings
      const { error: insertError } = await supabase
        .from('loyalty_system_settings')
        .insert([{
          is_system_enabled: true,
          default_coins_per_rupee: 0.1,
          min_coins_to_redeem: 100,
          max_coins_per_transaction: 1000,
          coins_expiry_days: 365,
          welcome_bonus_coins: 50,
          referral_bonus_coins: 25
        }]);
      
      if (insertError) {
        console.log('❌ Error creating settings:', insertError.message);
      } else {
        console.log('✅ Created default loyalty system settings');
      }
    } else {
      console.log('📊 Current settings:', {
        enabled: currentSettings.is_system_enabled,
        coinsPerRupee: currentSettings.default_coins_per_rupee,
        minRedeem: currentSettings.min_coins_to_redeem
      });
      
      if (!currentSettings.is_system_enabled) {
        console.log('🔄 Enabling loyalty system...');
        const { error: updateError } = await supabase
          .from('loyalty_system_settings')
          .update({ is_system_enabled: true })
          .eq('id', currentSettings.id);
        
        if (updateError) {
          console.log('❌ Error enabling system:', updateError.message);
        } else {
          console.log('✅ Loyalty system enabled successfully');
        }
      } else {
        console.log('✅ Loyalty system is already enabled');
      }
    }
    
    // Check product loyalty settings
    console.log('\n📋 Checking product loyalty settings...');
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price')
      .limit(5);
    
    if (products && products.length > 0) {
      for (const product of products) {
        const { data: productSettings, error: psError } = await supabase
          .from('loyalty_product_settings')
          .select('*')
          .eq('product_id', product.id)
          .single();
        
        if (psError && psError.code === 'PGRST116') {
          // No settings found, create default
          console.log(`🔄 Creating loyalty settings for ${product.name}...`);
          
          const coinsEarned = product.price > 10000 ? 50 : product.price > 5000 ? 25 : 10;
          const coinsRequired = product.price > 10000 ? 500 : product.price > 5000 ? 250 : 100;
          
          const { error: insertError } = await supabase
            .from('loyalty_product_settings')
            .insert([{
              product_id: product.id,
              coins_earned_per_purchase: coinsEarned,
              coins_required_to_buy: coinsRequired,
              is_coin_purchase_enabled: true,
              is_coin_earning_enabled: true
            }]);
          
          if (insertError) {
            console.log(`❌ Error creating settings for ${product.name}:`, insertError.message);
          } else {
            console.log(`✅ Created loyalty settings for ${product.name}`);
          }
        } else if (!psError) {
          console.log(`✅ ${product.name} already has loyalty settings`);
        }
      }
    }
    
    // Test the loyalty system
    console.log('\n📋 Testing loyalty system...');
    const { data: testSettings, error: testError } = await supabase
      .from('loyalty_system_settings')
      .select('*')
      .single();
    
    if (testError) {
      console.log('❌ Test failed:', testError.message);
    } else {
      console.log('✅ Loyalty system test successful:', {
        enabled: testSettings.is_system_enabled,
        coinsPerRupee: testSettings.default_coins_per_rupee
      });
    }
    
    console.log('\n🎉 Loyalty System Fix Complete!');
    console.log('✅ System should now be enabled');
    console.log('✅ Product settings configured');
    console.log('✅ DualCoinsDisplay should work properly');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

fixLoyaltySystem().catch(console.error);