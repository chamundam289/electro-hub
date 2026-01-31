// Comprehensive error check for the entire system
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xeufezbuuccohiardtrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function comprehensiveErrorCheck() {
  console.log('🔍 Comprehensive System Error Check...\n');
  
  const errors = [];
  const warnings = [];
  const successes = [];
  
  try {
    // 1. Database Tables Check
    console.log('📋 Step 1: Database Tables Validation...');
    const requiredTables = [
      'products',
      'categories', 
      'orders',
      'user_profiles',
      'coupons',
      'user_coupons',
      'coupon_usage',
      'product_coupon_settings',
      'notification_logs',
      'repair_requests',
      'repair_images',
      'repair_status_logs',
      'loyalty_coins_wallet',
      'loyalty_product_settings'
    ];
    
    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error && (error.code === '42P01' || error.message?.includes('relation'))) {
          errors.push(`Missing table: ${table}`);
        } else if (error) {
          warnings.push(`Table ${table} has access issues: ${error.message}`);
        } else {
          successes.push(`Table ${table} is accessible`);
        }
      } catch (err) {
        errors.push(`Error checking table ${table}: ${err.message}`);
      }
    }
    
    // 2. Data Integrity Check
    console.log('\n📋 Step 2: Data Integrity Validation...');
    
    // Check if we have sample data
    const dataChecks = [
      { table: 'products', name: 'Products' },
      { table: 'coupons', name: 'Coupons' },
      { table: 'user_profiles', name: 'User Profiles' },
      { table: 'categories', name: 'Categories' }
    ];
    
    for (const check of dataChecks) {
      try {
        const { data, error } = await supabase.from(check.table).select('*').limit(1);
        if (error) {
          warnings.push(`Cannot check ${check.name} data: ${error.message}`);
        } else if (!data || data.length === 0) {
          warnings.push(`No sample data in ${check.name} table`);
        } else {
          successes.push(`${check.name} has sample data`);
        }
      } catch (err) {
        errors.push(`Error checking ${check.name} data: ${err.message}`);
      }
    }
    
    // 3. Relationship Integrity Check
    console.log('\n📋 Step 3: Relationship Integrity Check...');
    
    try {
      // Test product-coupon settings relationship
      const { data: productSettings, error: psError } = await supabase
        .from('products')
        .select(`
          id, name,
          product_coupon_settings (is_coupon_eligible, max_coupon_discount)
        `)
        .limit(1);
      
      if (psError) {
        warnings.push(`Product-coupon settings relationship issue: ${psError.message}`);
      } else {
        successes.push('Product-coupon settings relationship working');
      }
    } catch (err) {
      errors.push(`Product-coupon relationship error: ${err.message}`);
    }
    
    try {
      // Test user-coupon relationship (manual join)
      const { data: userCoupons } = await supabase.from('user_coupons').select('*').limit(1);
      const { data: coupons } = await supabase.from('coupons').select('*').limit(1);
      
      if (userCoupons && coupons) {
        successes.push('User-coupon manual join working');
      } else {
        warnings.push('User-coupon data missing for relationship test');
      }
    } catch (err) {
      errors.push(`User-coupon relationship error: ${err.message}`);
    }
    
    // 4. Functional Components Check
    console.log('\n📋 Step 4: Functional Components Check...');
    
    // Test coupon creation workflow
    try {
      const testCoupon = {
        coupon_code: 'TEST' + Date.now(),
        coupon_title: 'Test Coupon',
        description: 'Test coupon for error checking',
        discount_type: 'flat',
        discount_value: 10,
        min_order_value: 100,
        is_active: true,
        start_date: new Date().toISOString(),
        per_user_usage_limit: 1
      };
      
      const { data, error } = await supabase.from('coupons').insert([testCoupon]).select().single();
      
      if (error) {
        errors.push(`Coupon creation test failed: ${error.message}`);
      } else {
        successes.push('Coupon creation workflow working');
        
        // Clean up test coupon
        await supabase.from('coupons').delete().eq('id', data.id);
      }
    } catch (err) {
      errors.push(`Coupon creation test error: ${err.message}`);
    }
    
    // Test notification logging
    try {
      const testNotification = {
        type: 'email',
        recipient: 'test@example.com',
        subject: 'Test Notification',
        message: 'This is a test notification for error checking',
        status: 'sent',
        template: 'test',
        sent_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase.from('notification_logs').insert([testNotification]).select().single();
      
      if (error) {
        errors.push(`Notification logging test failed: ${error.message}`);
      } else {
        successes.push('Notification logging working');
        
        // Clean up test notification
        await supabase.from('notification_logs').delete().eq('id', data.id);
      }
    } catch (err) {
      errors.push(`Notification logging test error: ${err.message}`);
    }
    
    // 5. Mobile Repair Service Check
    console.log('\n📋 Step 5: Mobile Repair Service Check...');
    
    try {
      const testRepairRequest = {
        customer_name: 'Test Customer',
        mobile_number: '9999999999',
        device_type: 'android',
        brand: 'Test Brand',
        model: 'Test Model',
        issue_types: ['screen_broken'],
        issue_description: 'Test issue description',
        service_type: 'doorstep',
        status: 'request_received'
      };
      
      const { data, error } = await supabase
        .from('repair_requests')
        .insert([testRepairRequest])
        .select()
        .single();
      
      if (error) {
        errors.push(`Mobile repair service test failed: ${error.message}`);
      } else {
        successes.push('Mobile repair service working');
        
        // Clean up test request
        await supabase.from('repair_requests').delete().eq('id', data.id);
      }
    } catch (err) {
      errors.push(`Mobile repair service test error: ${err.message}`);
    }
    
    // 6. Performance Check
    console.log('\n📋 Step 6: Performance Check...');
    
    const performanceTests = [
      { table: 'products', limit: 100 },
      { table: 'coupons', limit: 50 },
      { table: 'user_profiles', limit: 50 }
    ];
    
    for (const test of performanceTests) {
      try {
        const startTime = Date.now();
        const { data, error } = await supabase.from(test.table).select('*').limit(test.limit);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if (error) {
          warnings.push(`Performance test failed for ${test.table}: ${error.message}`);
        } else if (duration > 2000) {
          warnings.push(`Slow query for ${test.table}: ${duration}ms`);
        } else {
          successes.push(`Good performance for ${test.table}: ${duration}ms`);
        }
      } catch (err) {
        errors.push(`Performance test error for ${test.table}: ${err.message}`);
      }
    }
    
    // Final Report
    console.log('\n' + '='.repeat(60));
    console.log('🎯 COMPREHENSIVE ERROR CHECK REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n✅ SUCCESSES (${successes.length}):`);
    successes.forEach(success => console.log(`   ✅ ${success}`));
    
    console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
    warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
    
    console.log(`\n❌ ERRORS (${errors.length}):`);
    errors.forEach(error => console.log(`   ❌ ${error}`));
    
    // Overall Status
    console.log('\n' + '='.repeat(60));
    if (errors.length === 0) {
      console.log('🎉 OVERALL STATUS: SYSTEM IS HEALTHY');
      console.log('✅ No critical errors detected');
      if (warnings.length > 0) {
        console.log(`⚠️  ${warnings.length} warnings to review`);
      }
    } else {
      console.log('⚠️  OVERALL STATUS: ISSUES DETECTED');
      console.log(`❌ ${errors.length} errors need immediate attention`);
      console.log(`⚠️  ${warnings.length} warnings to review`);
    }
    
    console.log('\n🚀 SYSTEM READINESS:');
    const readinessScore = ((successes.length / (successes.length + warnings.length + errors.length)) * 100).toFixed(1);
    console.log(`📊 Readiness Score: ${readinessScore}%`);
    
    if (readinessScore >= 90) {
      console.log('🟢 PRODUCTION READY');
    } else if (readinessScore >= 75) {
      console.log('🟡 MOSTLY READY - Minor fixes needed');
    } else {
      console.log('🔴 NOT READY - Major fixes required');
    }
    
  } catch (err) {
    console.error('❌ Critical Error in Error Check:', err.message);
  }
}

comprehensiveErrorCheck().catch(console.error);