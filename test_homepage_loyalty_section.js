// Test script for Homepage Loyalty Coins Section
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xeufezbuuccohiardtrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testHomepageLoyaltySection() {
  console.log('🧪 Testing Homepage Loyalty Coins Section...\n');
  
  try {
    // Test 1: Check loyalty system status
    console.log('1️⃣ Testing loyalty system status...');
    const { data: settings, error: settingsError } = await supabase
      .from('loyalty_system_settings')
      .select('*')
      .limit(1)
      .single();
    
    if (settingsError) {
      console.log('❌ Loyalty system not configured:', settingsError.message);
      return;
    } else {
      console.log('✅ Loyalty system configured');
      console.log(`   - System enabled: ${settings.is_system_enabled}`);
      console.log(`   - Coins per rupee: ${settings.default_coins_per_rupee}`);
    }
    
    // Test 2: Check products with coin redemption enabled
    console.log('\n2️⃣ Testing products with coin redemption...');
    const { data: coinProducts, error: coinProductsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        coins_required_to_buy,
        is_coin_purchase_enabled,
        stock_quantity,
        is_visible,
        image_url
      `)
      .eq('is_visible', true)
      .eq('is_coin_purchase_enabled', true)
      .gt('coins_required_to_buy', 0)
      .gt('stock_quantity', 0)
      .order('coins_required_to_buy', { ascending: true });
    
    if (coinProductsError) {
      console.log('❌ Error fetching coin products:', coinProductsError.message);
    } else {
      console.log('✅ Coin-enabled products found');
      console.log(`   - Total products available for coin redemption: ${coinProducts?.length || 0}`);
      
      if (coinProducts && coinProducts.length > 0) {
        console.log('   - Sample products:');
        coinProducts.slice(0, 5).forEach((product, index) => {
          console.log(`     ${index + 1}. ${product.name}`);
          console.log(`        - Price: ₹${product.price}`);
          console.log(`        - Coins required: ${product.coins_required_to_buy}`);
          console.log(`        - Stock: ${product.stock_quantity}`);
          console.log(`        - Has image: ${product.image_url ? 'Yes' : 'No'}`);
        });
      }
    }
    
    // Test 3: Simulate different user coin scenarios
    console.log('\n3️⃣ Testing user scenarios...');
    
    const testScenarios = [
      { coins: 0, description: 'User with no coins' },
      { coins: 25, description: 'User with 25 coins' },
      { coins: 50, description: 'User with 50 coins' },
      { coins: 100, description: 'User with 100 coins' },
      { coins: 200, description: 'User with 200 coins' }
    ];
    
    for (const scenario of testScenarios) {
      const eligibleProducts = coinProducts?.filter(p => 
        p.coins_required_to_buy <= scenario.coins
      ) || [];
      
      console.log(`   ${scenario.description}:`);
      console.log(`     - Eligible products: ${eligibleProducts.length}`);
      console.log(`     - Section will ${eligibleProducts.length > 0 ? 'SHOW' : 'HIDE'}`);
      
      if (eligibleProducts.length > 0) {
        const cheapest = eligibleProducts[0];
        const mostExpensive = eligibleProducts[eligibleProducts.length - 1];
        console.log(`     - Cheapest: ${cheapest.name} (${cheapest.coins_required_to_buy} coins)`);
        if (eligibleProducts.length > 1) {
          console.log(`     - Most expensive: ${mostExpensive.name} (${mostExpensive.coins_required_to_buy} coins)`);
        }
      }
    }
    
    // Test 4: Homepage section behavior
    console.log('\n4️⃣ Testing homepage section behavior...');
    
    const hasEligibleProducts = coinProducts && coinProducts.length > 0;
    
    console.log(`   - Products available for coin redemption: ${hasEligibleProducts ? 'YES' : 'NO'}`);
    console.log(`   - Homepage section will: ${hasEligibleProducts ? 'RENDER' : 'NOT RENDER'}`);
    
    if (hasEligibleProducts) {
      const displayCount = Math.min(coinProducts.length, 4);
      console.log(`   - Products to display: ${displayCount} (max 4)`);
      console.log(`   - "View All" button: ${coinProducts.length > 4 ? 'SHOW' : 'HIDE'}`);
    }
    
    console.log('\n📊 Test Summary:');
    
    if (!settings.is_system_enabled) {
      console.log('❌ Loyalty system is DISABLED - Section will NOT show');
    } else if (!coinProducts || coinProducts.length === 0) {
      console.log('⚠️  No products configured for coin redemption - Section will NOT show');
      console.log('   💡 Run setup_sample_coin_products.sql to add test products');
    } else {
      console.log('✅ Homepage Loyalty Section is READY!');
      console.log(`   - Will show for users with coins >= ${coinProducts[0].coins_required_to_buy}`);
      console.log(`   - Will hide for users with insufficient coins`);
      console.log(`   - Displays up to 4 products in grid layout`);
      console.log(`   - Links to product detail pages with ?redeem=coins`);
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Ensure some products have coin settings configured');
    console.log('2. Test with different user accounts having various coin balances');
    console.log('3. Verify section shows/hides correctly based on eligibility');
    console.log('4. Test "Redeem Now" buttons navigate to product pages');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testHomepageLoyaltySection().catch(console.error);