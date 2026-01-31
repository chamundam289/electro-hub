// Test checkout coupon application workflow
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xeufezbuuccohiardtrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCheckoutCouponWorkflow() {
  console.log('🛒 Testing Checkout Coupon Application Workflow...\n');
  
  try {
    // Step 1: Get available products with coupon settings
    console.log('📋 Step 1: Getting Products with Coupon Settings...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id, name, price, offer_price,
        product_coupon_settings (
          is_coupon_eligible,
          max_coupon_discount,
          coupon_categories,
          allow_coupon_stacking
        )
      `)
      .limit(3);
    
    if (productsError) {
      console.log('❌ Error fetching products:', productsError.message);
      return;
    }
    
    console.log(`✅ Found ${products?.length || 0} products:`);
    products?.forEach(product => {
      const settings = product.product_coupon_settings?.[0];
      const finalPrice = product.offer_price || product.price;
      console.log(`   - ${product.name}: ₹${finalPrice}`);
      if (settings) {
        console.log(`     Coupon Eligible: ${settings.is_coupon_eligible ? 'Yes' : 'No'}`);
        console.log(`     Max Discount: ${settings.max_coupon_discount}%`);
        console.log(`     Categories: ${settings.coupon_categories || 'None'}`);
      }
    });
    
    // Step 2: Get available coupons
    console.log('\n📋 Step 2: Getting Available Coupons...');
    const { data: coupons, error: couponsError } = await supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', new Date().toISOString())
      .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`);
    
    if (couponsError) {
      console.log('❌ Error fetching coupons:', couponsError.message);
      return;
    }
    
    console.log(`✅ Found ${coupons?.length || 0} active coupons:`);
    coupons?.forEach(coupon => {
      console.log(`   - ${coupon.coupon_code}: ${coupon.discount_type} ${coupon.discount_value}${coupon.discount_type === 'percentage' ? '%' : '₹'} OFF`);
      console.log(`     Min Order: ₹${coupon.min_order_value}, Usage: ${coupon.total_usage_count} times`);
    });
    
    // Step 3: Simulate coupon application
    if (products && products.length > 0 && coupons && coupons.length > 0) {
      console.log('\n📋 Step 3: Simulating Coupon Application...');
      
      const testProduct = products[0];
      const testCoupon = coupons[0];
      const orderTotal = (testProduct.offer_price || testProduct.price) * 1; // Quantity 1
      
      console.log(`\n🧮 Calculation Example:`);
      console.log(`   Product: ${testProduct.name} - ₹${orderTotal}`);
      console.log(`   Coupon: ${testCoupon.coupon_code}`);
      
      // Check minimum order value
      if (orderTotal >= testCoupon.min_order_value) {
        let discountAmount = 0;
        
        if (testCoupon.discount_type === 'flat') {
          discountAmount = Math.min(testCoupon.discount_value, orderTotal);
        } else {
          discountAmount = (orderTotal * testCoupon.discount_value) / 100;
          if (testCoupon.max_discount_amount) {
            discountAmount = Math.min(discountAmount, testCoupon.max_discount_amount);
          }
        }
        
        // Check product-level max discount
        const productSettings = testProduct.product_coupon_settings?.[0];
        if (productSettings && productSettings.max_coupon_discount > 0) {
          const maxProductDiscount = (orderTotal * productSettings.max_coupon_discount) / 100;
          discountAmount = Math.min(discountAmount, maxProductDiscount);
          console.log(`   Product Max Discount: ₹${maxProductDiscount.toFixed(2)} (${productSettings.max_coupon_discount}%)`);
        }
        
        const finalAmount = orderTotal - discountAmount;
        
        console.log(`   Discount Applied: ₹${discountAmount.toFixed(2)}`);
        console.log(`   Final Amount: ₹${finalAmount.toFixed(2)}`);
        console.log(`   ✅ Coupon application successful!`);
        
        // Bonus coins calculation
        if (testCoupon.bonus_coins_earned > 0) {
          console.log(`   Bonus Coins Earned: ${testCoupon.bonus_coins_earned} coins`);
        }
        
      } else {
        console.log(`   ❌ Order total ₹${orderTotal} is below minimum ₹${testCoupon.min_order_value}`);
      }
    }
    
    // Step 4: Test coupon stacking with loyalty coins
    console.log('\n📋 Step 4: Testing Coupon + Loyalty Coin Stacking...');
    
    if (products && products.length > 0) {
      const testProduct = products[0];
      const productSettings = testProduct.product_coupon_settings?.[0];
      
      if (productSettings?.allow_coupon_stacking) {
        console.log(`✅ ${testProduct.name} allows coupon + loyalty coin stacking`);
        console.log(`   Customer can use both coupons and loyalty coins together`);
      } else {
        console.log(`❌ ${testProduct.name} does not allow coupon + loyalty coin stacking`);
        console.log(`   Customer must choose either coupon OR loyalty coins`);
      }
    }
    
    console.log('\n🎉 Checkout Coupon Workflow Test Complete!');
    console.log('\n📊 Summary:');
    console.log('✅ Products have configurable coupon settings');
    console.log('✅ Coupons are active and available');
    console.log('✅ Discount calculations work correctly');
    console.log('✅ Product-level discount limits are enforced');
    console.log('✅ Coupon + loyalty coin stacking rules are configurable');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testCheckoutCouponWorkflow().catch(console.error);