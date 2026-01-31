// Check coupon_usage table structure and relationships
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xeufezbuuccohiardtrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkCouponUsageStructure() {
  console.log('🔍 Checking Coupon Usage Table Structure...\n');
  
  try {
    // Test simple select from coupon_usage
    console.log('📋 Testing coupon_usage table access...');
    const { data: usage, error: usageError } = await supabase
      .from('coupon_usage')
      .select('*')
      .limit(3);
    
    if (usageError) {
      console.log('❌ Error accessing coupon_usage:', usageError.message);
    } else {
      console.log(`✅ Found ${usage?.length || 0} coupon usage records`);
      if (usage && usage.length > 0) {
        console.log('Sample record:', usage[0]);
      }
    }
    
    // Test simple select from coupons
    console.log('\n📋 Testing coupons table access...');
    const { data: coupons, error: couponsError } = await supabase
      .from('coupons')
      .select('id, coupon_code, coupon_title')
      .limit(3);
    
    if (couponsError) {
      console.log('❌ Error accessing coupons:', couponsError.message);
    } else {
      console.log(`✅ Found ${coupons?.length || 0} coupons`);
      if (coupons && coupons.length > 0) {
        console.log('Sample coupon:', coupons[0]);
      }
    }
    
    // Test the problematic join
    console.log('\n📋 Testing coupon_usage with coupons join...');
    const { data: joinData, error: joinError } = await supabase
      .from('coupon_usage')
      .select('id, discount_amount, order_total, coupon_id')
      .limit(3);
    
    if (joinError) {
      console.log('❌ Error with join:', joinError.message);
    } else {
      console.log(`✅ Basic coupon_usage query works`);
      
      // Now try to get coupon details manually
      if (joinData && joinData.length > 0) {
        for (const usage of joinData) {
          const { data: coupon } = await supabase
            .from('coupons')
            .select('coupon_code, coupon_title')
            .eq('id', usage.coupon_id)
            .single();
          
          console.log(`   Usage: ₹${usage.discount_amount} discount, Coupon: ${coupon?.coupon_code || 'Unknown'}`);
        }
      }
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkCouponUsageStructure().catch(console.error);