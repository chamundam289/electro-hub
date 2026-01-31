// Run coupon relationship fixes and add sample data
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://xeufezbuuccohiardtrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runCouponFixes() {
  console.log('🔧 Running Coupon System Fixes...\n');
  
  try {
    // Add sample product coupon settings
    console.log('📝 Adding sample product coupon settings...');
    
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price')
      .limit(5);
    
    if (products && products.length > 0) {
      for (const product of products) {
        const couponSettings = {
          product_id: product.id,
          is_coupon_eligible: true,
          max_coupon_discount: product.price > 20000 ? 30 : product.price > 10000 ? 50 : 70,
          coupon_categories: product.price > 20000 ? 'premium,electronics,luxury' : 
                           product.price > 10000 ? 'electronics,gadgets,popular' : 
                           'budget,electronics,general',
          allow_coupon_stacking: true
        };
        
        const { error } = await supabase
          .from('product_coupon_settings')
          .upsert(couponSettings, { onConflict: 'product_id' });
        
        if (error) {
          console.log(`⚠️  Error adding settings for ${product.name}:`, error.message);
        } else {
          console.log(`✅ Added coupon settings for ${product.name}`);
        }
      }
    }
    
    console.log('\n🎉 Coupon system fixes completed successfully!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

runCouponFixes().catch(console.error);