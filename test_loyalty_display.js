// Test loyalty display functionality
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xeufezbuuccohiardtrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLoyaltyDisplay() {
  console.log('🧪 Testing Loyalty Display Functionality...\n');
  
  try {
    // 1. Test system settings
    console.log('📋 Step 1: Testing system settings...');
    const { data: systemSettings, error: systemError } = await supabase
      .from('loyalty_system_settings')
      .select('*')
      .eq('id', 'eef33271-caed-4eb2-a7ea-aa4d5e288a0f')
      .single();
    
    if (systemError) {
      console.error('❌ System settings error:', systemError.message);
      return;
    }
    
    console.log('✅ System settings loaded:', {
      enabled: systemSettings.is_system_enabled,
      coinsPerRupee: systemSettings.default_coins_per_rupee,
      minRedeem: systemSettings.min_coins_to_redeem
    });
    
    // 2. Test product settings
    console.log('\n📋 Step 2: Testing product settings...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id, name, price, offer_price,
        loyalty_product_settings (
          coins_earned_per_purchase,
          coins_required_to_buy,
          is_coin_purchase_enabled,
          is_coin_earning_enabled
        )
      `)
      .limit(3);
    
    if (productsError) {
      console.error('❌ Products error:', productsError.message);
      return;
    }
    
    console.log(`✅ Found ${products.length} products with loyalty settings:`);
    products.forEach(product => {
      const settings = product.loyalty_product_settings?.[0];
      console.log(`   📦 ${product.name}:`);
      console.log(`      Price: ₹${product.price} ${product.offer_price ? `(Offer: ₹${product.offer_price})` : ''}`);
      if (settings) {
        console.log(`      Earn: ${settings.coins_earned_per_purchase} coins`);
        console.log(`      Redeem: ${settings.coins_required_to_buy} coins`);
        console.log(`      Purchase Enabled: ${settings.is_coin_purchase_enabled}`);
        console.log(`      Earning Enabled: ${settings.is_coin_earning_enabled}`);
      } else {
        console.log('      ⚠️  No loyalty settings found');
      }
    });
    
    // 3. Test the get_or_create_loyalty_settings function
    console.log('\n📋 Step 3: Testing loyalty settings function...');
    if (products.length > 0) {
      const testProductId = products[0].id;
      const { data: functionResult, error: functionError } = await supabase
        .rpc('get_or_create_loyalty_settings', { input_product_id: testProductId });
      
      if (functionError) {
        console.warn('⚠️  Function not available:', functionError.message);
        console.log('   Using direct table query instead');
      } else {
        console.log('✅ Loyalty settings function working:', functionResult?.[0]);
      }
    }
    
    // 4. Simulate DualCoinsDisplay logic
    console.log('\n📋 Step 4: Simulating DualCoinsDisplay logic...');
    
    if (!systemSettings.is_system_enabled) {
      console.log('❌ System not enabled - DualCoinsDisplay would not render');
      return;
    }
    
    let workingProducts = 0;
    let issueProducts = 0;
    
    products.forEach(product => {
      const settings = product.loyalty_product_settings?.[0];
      console.log(`\n   🔍 Testing ${product.name}:`);
      
      if (!settings) {
        console.log('      ❌ No settings - would show "not configured" message');
        issueProducts++;
        return;
      }
      
      const coinsEarned = settings.coins_earned_per_purchase || 0;
      const coinsRequired = settings.coins_required_to_buy || 0;
      const canEarn = settings.is_coin_earning_enabled;
      const canRedeem = settings.is_coin_purchase_enabled;
      
      console.log(`      💰 Coins to earn: ${coinsEarned} (enabled: ${canEarn})`);
      console.log(`      🎁 Coins to redeem: ${coinsRequired} (enabled: ${canRedeem})`);
      
      if (coinsEarned > 0 && canEarn) {
        console.log('      ✅ Would show "Buy & Earn" badge');
      }
      
      if (coinsRequired > 0 && canRedeem) {
        console.log('      ✅ Would show "Redeem with Coins" badge');
      }
      
      if ((coinsEarned > 0 && canEarn) || (coinsRequired > 0 && canRedeem)) {
        workingProducts++;
      } else {
        issueProducts++;
      }
    });
    
    // Final report
    console.log('\n' + '='.repeat(60));
    console.log('🎯 LOYALTY DISPLAY TEST REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Test Results:`);
    console.log(`   System Enabled: ${systemSettings.is_system_enabled ? 'Yes' : 'No'}`);
    console.log(`   Products Tested: ${products.length}`);
    console.log(`   Working Products: ${workingProducts}`);
    console.log(`   Issue Products: ${issueProducts}`);
    
    if (systemSettings.is_system_enabled && workingProducts > 0) {
      console.log('\n🎉 LOYALTY DISPLAY TEST PASSED!');
      console.log('✅ DualCoinsDisplay should render properly');
      console.log('✅ Users will see coin earning/redemption options');
      console.log('✅ No more "System not enabled" errors');
    } else {
      console.log('\n⚠️  LOYALTY DISPLAY TEST ISSUES:');
      if (!systemSettings.is_system_enabled) {
        console.log('❌ System is not enabled globally');
      }
      if (workingProducts === 0) {
        console.log('❌ No products have working loyalty settings');
      }
    }
    
    console.log('\n🔄 Browser Console Should Show:');
    console.log('   ✅ No "System not enabled" messages');
    console.log('   ✅ No "Not rendering" messages');
    console.log('   ✅ Proper coin values displayed');
    console.log('   ✅ Clean console output');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testLoyaltyDisplay().catch(console.error);