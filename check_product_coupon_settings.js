// Check and fix product coupon settings
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xeufezbuuccohiardtrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkProductCouponSettings() {
  console.log('🔍 Checking Product Coupon Settings...\n');
  
  try {
    // Check existing product coupon settings
    console.log('📋 Current Product Coupon Settings:');
    const { data: settings, error: settingsError } = await supabase
      .from('product_coupon_settings')
      .select('*');
    
    if (settingsError) {
      console.log('❌ Error fetching settings:', settingsError.message);
      return;
    }
    
    console.log(`✅ Found ${settings?.length || 0} product coupon settings:`);
    settings?.forEach(setting => {
      console.log(`   Product ID: ${setting.product_id}`);
      console.log(`   Coupon Eligible: ${setting.is_coupon_eligible}`);
      console.log(`   Max Discount: ${setting.max_coupon_discount}%`);
      console.log(`   Categories: ${setting.coupon_categories}`);
      console.log(`   Allow Stacking: ${setting.allow_coupon_stacking}`);
      console.log('   ---');
    });
    
    // Check products and their settings
    console.log('\n📋 Products with Settings:');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price');
    
    if (productsError) {
      console.log('❌ Error fetching products:', productsError.message);
      return;
    }
    
    for (const product of products || []) {
      const productSetting = settings?.find(s => s.product_id === product.id);
      console.log(`\n${product.name} (₹${product.price}):`);
      
      if (productSetting) {
        console.log(`   ✅ Has coupon settings`);
        console.log(`   Eligible: ${productSetting.is_coupon_eligible}`);
        console.log(`   Max Discount: ${productSetting.max_coupon_discount}%`);
        console.log(`   Categories: ${productSetting.coupon_categories}`);
        console.log(`   Stacking: ${productSetting.allow_coupon_stacking}`);
      } else {
        console.log(`   ❌ No coupon settings - creating default...`);
        
        // Create default settings
        const defaultSettings = {
          product_id: product.id,
          is_coupon_eligible: true,
          max_coupon_discount: product.price > 20000 ? 30 : product.price > 10000 ? 50 : 70,
          coupon_categories: product.price > 20000 ? 'premium,electronics,luxury' : 
                           product.price > 10000 ? 'electronics,gadgets,popular' : 
                           'budget,electronics,general',
          allow_coupon_stacking: true
        };
        
        const { error: insertError } = await supabase
          .from('product_coupon_settings')
          .insert(defaultSettings);
        
        if (insertError) {
          console.log(`   ❌ Error creating settings: ${insertError.message}`);
        } else {
          console.log(`   ✅ Created default coupon settings`);
        }
      }
    }
    
    // Test the join query that was failing
    console.log('\n📋 Testing Product-Settings Join Query:');
    const { data: joinData, error: joinError } = await supabase
      .from('products')
      .select(`
        id, name, price,
        product_coupon_settings!inner (
          is_coupon_eligible,
          max_coupon_discount,
          coupon_categories,
          allow_coupon_stacking
        )
      `)
      .limit(3);
    
    if (joinError) {
      console.log('❌ Join query error:', joinError.message);
    } else {
      console.log(`✅ Join query successful - ${joinData?.length || 0} products with settings`);
      joinData?.forEach(product => {
        console.log(`   ${product.name}: Eligible=${product.product_coupon_settings[0]?.is_coupon_eligible}`);
      });
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkProductCouponSettings().catch(console.error);