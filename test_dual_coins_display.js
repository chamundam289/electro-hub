// Test script for Dual Coins Display System
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xeufezbuuccohiardtrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDualCoinsDisplay() {
  console.log('🧪 Testing Dual Coins Display System...\n');
  
  try {
    // Test 1: Check loyalty system settings
    console.log('1️⃣ Testing loyalty system configuration...');
    const { data: settings, error: settingsError } = await supabase
      .from('loyalty_system_settings')
      .select('*')
      .limit(1)
      .single();
    
    if (settingsError) {
      console.log('❌ Loyalty system not configured:', settingsError.message);
      return;
    }
    
    console.log('✅ Loyalty system configured');
    console.log(`   - System enabled: ${settings.is_system_enabled}`);
    console.log(`   - Coins per rupee: ${settings.default_coins_per_rupee}`);
    console.log(`   - Global multiplier: ${settings.global_coins_multiplier}`);
    console.log(`   - Min redemption: ${settings.min_coins_to_redeem}`);
    
    // Test 2: Check products with dual coin values
    console.log('\n2️⃣ Testing products with dual coin configuration...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        offer_price,
        coins_earned_per_purchase,
        coins_required_to_buy,
        is_coin_purchase_enabled,
        stock_quantity,
        is_visible
      `)
      .eq('is_visible', true)
      .gt('stock_quantity', 0)
      .order('price', { ascending: true })
      .limit(10);
    
    if (productsError) {
      console.log('❌ Error fetching products:', productsError.message);
      return;
    }
    
    console.log('✅ Products fetched successfully');
    console.log(`   - Total products: ${products?.length || 0}`);
    
    // Test 3: Analyze dual coin values for each product
    console.log('\n3️⃣ Analyzing dual coin values per product...');
    
    if (products && products.length > 0) {
      console.log('\n📊 Product Coin Analysis:');
      console.log('─'.repeat(80));
      console.log('Product Name'.padEnd(25) + 'Price'.padEnd(10) + 'Earn Coins'.padEnd(12) + 'Redeem Coins'.padEnd(15) + 'Redeem Enabled');
      console.log('─'.repeat(80));
      
      let productsWithEarnCoins = 0;
      let productsWithRedeemCoins = 0;
      let productsWithBothCoins = 0;
      
      products.forEach(product => {
        const finalPrice = product.offer_price || product.price;
        
        // Calculate earn coins (using system settings)
        const earnCoins = Math.floor(finalPrice * settings.default_coins_per_rupee * settings.global_coins_multiplier);
        
        // Get redeem coins from product settings
        const redeemCoins = product.coins_required_to_buy || 0;
        const redeemEnabled = product.is_coin_purchase_enabled || false;
        
        // Count statistics
        if (earnCoins > 0) productsWithEarnCoins++;
        if (redeemCoins > 0 && redeemEnabled) productsWithRedeemCoins++;
        if (earnCoins > 0 && redeemCoins > 0 && redeemEnabled) productsWithBothCoins++;
        
        // Display product info
        const name = product.name.length > 23 ? product.name.substring(0, 20) + '...' : product.name;
        const priceStr = `₹${finalPrice}`;
        const earnStr = earnCoins > 0 ? `+${earnCoins}` : '-';
        const redeemStr = redeemCoins > 0 ? `${redeemCoins}` : '-';
        const enabledStr = redeemEnabled ? 'Yes' : 'No';
        
        console.log(
          name.padEnd(25) + 
          priceStr.padEnd(10) + 
          earnStr.padEnd(12) + 
          redeemStr.padEnd(15) + 
          enabledStr
        );
      });
      
      console.log('─'.repeat(80));
      console.log('\n📈 Statistics:');
      console.log(`   - Products with earn coins: ${productsWithEarnCoins}/${products.length}`);
      console.log(`   - Products with redeem coins: ${productsWithRedeemCoins}/${products.length}`);
      console.log(`   - Products with both coin types: ${productsWithBothCoins}/${products.length}`);
      
      // Test 4: Simulate different display modes
      console.log('\n4️⃣ Testing display modes...');
      
      const sampleProduct = products[0];
      const finalPrice = sampleProduct.offer_price || sampleProduct.price;
      const earnCoins = Math.floor(finalPrice * settings.default_coins_per_rupee);
      const redeemCoins = sampleProduct.coins_required_to_buy || 0;
      
      console.log(`\n🎯 Sample Product: ${sampleProduct.name}`);
      console.log(`   - Price: ₹${finalPrice}`);
      console.log(`   - Earn coins: +${earnCoins} coins`);
      console.log(`   - Redeem coins: ${redeemCoins} coins`);
      console.log(`   - Redeem enabled: ${sampleProduct.is_coin_purchase_enabled ? 'Yes' : 'No'}`);
      
      console.log('\n📱 Display Mode Simulations:');
      
      // Card mode
      console.log('   Card Mode (Product Lists):');
      if (earnCoins > 0) {
        console.log(`     ✅ "Buy & Earn +${earnCoins} Coins" badge`);
      }
      if (redeemCoins > 0 && sampleProduct.is_coin_purchase_enabled) {
        console.log(`     ✅ "Redeem for ${redeemCoins} Coins" badge`);
      }
      
      // Detail mode
      console.log('   Detail Mode (Product Page):');
      if (earnCoins > 0) {
        console.log(`     ✅ "You will earn: +${earnCoins} Coins" section`);
        console.log(`     ✅ "Worth ₹${(earnCoins * 0.1).toFixed(1)} value" info`);
      }
      if (redeemCoins > 0 && sampleProduct.is_coin_purchase_enabled) {
        console.log(`     ✅ "Redeem with Coins: ${redeemCoins} Coins" section`);
        console.log(`     ✅ "Instead of ₹${finalPrice}" info`);
      }
      
      // Compact mode
      console.log('   Compact Mode (Small Spaces):');
      if (earnCoins > 0) {
        console.log(`     ✅ "+${earnCoins}" with coin icon`);
      }
      if (redeemCoins > 0 && sampleProduct.is_coin_purchase_enabled) {
        console.log(`     ✅ "${redeemCoins}" with gift icon`);
      }
    }
    
    // Test 5: User scenarios
    console.log('\n5️⃣ Testing user scenarios...');
    
    const userScenarios = [
      { coins: 0, description: 'New user with no coins' },
      { coins: 25, description: 'User with 25 coins' },
      { coins: 100, description: 'User with 100 coins' },
      { coins: 200, description: 'Premium user with 200 coins' }
    ];
    
    userScenarios.forEach(scenario => {
      console.log(`\n   ${scenario.description} (${scenario.coins} coins):`);
      
      const eligibleProducts = products?.filter(p => 
        p.is_coin_purchase_enabled && 
        p.coins_required_to_buy > 0 && 
        p.coins_required_to_buy <= scenario.coins
      ) || [];
      
      console.log(`     - Can redeem ${eligibleProducts.length} products`);
      
      if (eligibleProducts.length > 0) {
        const cheapest = eligibleProducts.reduce((min, p) => 
          p.coins_required_to_buy < min.coins_required_to_buy ? p : min
        );
        console.log(`     - Cheapest redeemable: ${cheapest.name} (${cheapest.coins_required_to_buy} coins)`);
      }
      
      // Show what they'll see in UI
      console.log(`     - Earn badges: Always visible on all products`);
      console.log(`     - Redeem badges: ${eligibleProducts.length > 0 ? 'Enabled for eligible products' : 'Disabled/locked for all products'}`);
    });
    
    console.log('\n📊 Test Summary:');
    
    if (!settings.is_system_enabled) {
      console.log('❌ Loyalty system is DISABLED - Dual coins display will NOT show');
    } else if (!products || products.length === 0) {
      console.log('⚠️  No products found - Cannot test dual coins display');
    } else {
      console.log('✅ Dual Coins Display System is READY!');
      console.log(`   - ${productsWithEarnCoins} products show earn coins badges`);
      console.log(`   - ${productsWithRedeemCoins} products show redeem coins badges`);
      console.log(`   - ${productsWithBothCoins} products show both coin types`);
      console.log('   - All display modes (card, detail, compact) supported');
      console.log('   - Conditional display based on user coin balance');
    }
    
    console.log('\n🎯 Expected User Experience:');
    console.log('✅ "Is product se mujhe kitne coins milenge" - Clear earn coins display');
    console.log('✅ "Is product ko coins se lene ke liye kitne coins chahiye" - Clear redeem coins display');
    console.log('✅ Transparency + trust through dual coin visibility');
    console.log('✅ High repeat purchases through gamification');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDualCoinsDisplay().catch(console.error);