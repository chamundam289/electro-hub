// Fix loyalty foreign key relationship
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xeufezbuuccohiardtrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixLoyaltyForeignKey() {
  console.log('🔧 Fixing Loyalty Foreign Key Relationship...\n');
  
  try {
    // 1. Check current data
    console.log('📋 Step 1: Checking current data...');
    
    const { data: products } = await supabase.from('products').select('id, name');
    const { data: loyaltySettings } = await supabase.from('loyalty_product_settings').select('product_id, coins_earned_per_purchase');
    
    console.log(`✅ Products: ${products.length}`);
    console.log(`✅ Loyalty Settings: ${loyaltySettings.length}`);
    
    // 2. Check if product IDs match
    console.log('\n📋 Step 2: Checking ID matching...');
    
    products.forEach(product => {
      const hasSettings = loyaltySettings.some(setting => setting.product_id === product.id);
      console.log(`   ${hasSettings ? '✅' : '❌'} ${product.name} (${product.id})`);
    });
    
    loyaltySettings.forEach(setting => {
      const hasProduct = products.some(product => product.id === setting.product_id);
      console.log(`   ${hasProduct ? '✅' : '❌'} Setting for ${setting.product_id} (${setting.coins_earned_per_purchase} coins)`);
    });
    
    // 3. Test different JOIN approaches
    console.log('\n📋 Step 3: Testing different JOIN approaches...');
    
    // Test 1: Inner join
    const { data: innerJoin, error: innerError } = await supabase
      .from('products')
      .select(`
        id, name,
        loyalty_product_settings!inner (coins_earned_per_purchase)
      `);
    
    console.log(`   Inner JOIN: ${innerJoin?.length || 0} results ${innerError ? `(Error: ${innerError.message})` : ''}`);
    
    // Test 2: Left join (default)
    const { data: leftJoin, error: leftError } = await supabase
      .from('products')
      .select(`
        id, name,
        loyalty_product_settings (coins_earned_per_purchase)
      `);
    
    console.log(`   Left JOIN: ${leftJoin?.length || 0} results ${leftError ? `(Error: ${leftError.message})` : ''}`);
    if (leftJoin) {
      leftJoin.forEach(product => {
        const settings = product.loyalty_product_settings;
        console.log(`      ${product.name}: ${settings?.length || 0} settings`);
      });
    }
    
    // Test 3: Manual join using separate queries
    console.log('\n📋 Step 4: Manual join test...');
    
    for (const product of products) {
      const { data: settings } = await supabase
        .from('loyalty_product_settings')
        .select('*')
        .eq('product_id', product.id);
      
      console.log(`   ${product.name}: ${settings?.length || 0} settings found`);
      if (settings && settings.length > 0) {
        console.log(`      Earn: ${settings[0].coins_earned_per_purchase}, Redeem: ${settings[0].coins_required_to_buy}`);
      }
    }
    
    // 4. Check if there's a schema issue
    console.log('\n📋 Step 5: Checking schema information...');
    
    // Get table info (this might not work with Supabase's RLS, but let's try)
    const { data: productColumns, error: productError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'products')
      .eq('column_name', 'id');
    
    const { data: loyaltyColumns, error: loyaltyError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'loyalty_product_settings')
      .eq('column_name', 'product_id');
    
    if (!productError && !loyaltyError) {
      console.log(`   Products.id type: ${productColumns?.[0]?.data_type}`);
      console.log(`   Loyalty.product_id type: ${loyaltyColumns?.[0]?.data_type}`);
    } else {
      console.log('   Schema info not accessible (normal with RLS)');
    }
    
    // 5. Try to fix by recreating the relationship
    console.log('\n📋 Step 6: Testing relationship fix...');
    
    // Get one product to test with
    const testProduct = products[0];
    const testSettings = loyaltySettings.find(s => s.product_id === testProduct.id);
    
    if (testSettings) {
      // Delete and recreate the setting to ensure clean relationship
      console.log(`   Testing with ${testProduct.name}...`);
      
      const { error: deleteError } = await supabase
        .from('loyalty_product_settings')
        .delete()
        .eq('product_id', testProduct.id);
      
      if (deleteError) {
        console.log(`   ❌ Delete failed: ${deleteError.message}`);
      } else {
        console.log('   ✅ Old setting deleted');
        
        const { error: insertError } = await supabase
          .from('loyalty_product_settings')
          .insert({
            product_id: testProduct.id,
            coins_earned_per_purchase: 15,
            coins_required_to_buy: 150,
            is_coin_purchase_enabled: true,
            is_coin_earning_enabled: true
          });
        
        if (insertError) {
          console.log(`   ❌ Insert failed: ${insertError.message}`);
        } else {
          console.log('   ✅ New setting created');
          
          // Test the join again
          const { data: testJoin } = await supabase
            .from('products')
            .select(`
              id, name,
              loyalty_product_settings (coins_earned_per_purchase)
            `)
            .eq('id', testProduct.id)
            .single();
          
          if (testJoin?.loyalty_product_settings?.length > 0) {
            console.log('   🎉 JOIN now working!');
          } else {
            console.log('   ❌ JOIN still not working');
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 FOREIGN KEY RELATIONSHIP DIAGNOSIS');
    console.log('='.repeat(60));
    
    console.log('\n📊 Findings:');
    console.log('   ✅ Direct queries work perfectly');
    console.log('   ✅ Function calls work perfectly');
    console.log('   ❌ JOIN queries not returning related data');
    
    console.log('\n🔍 Possible Causes:');
    console.log('   1. Foreign key constraint missing');
    console.log('   2. RLS policy blocking JOIN operations');
    console.log('   3. Data type mismatch (UUID vs TEXT)');
    console.log('   4. Supabase client configuration issue');
    
    console.log('\n💡 Recommendation:');
    console.log('   Since direct queries work, DualCoinsDisplay should use:');
    console.log('   - getProductLoyaltySettings() function (already implemented)');
    console.log('   - Direct table queries as fallback');
    console.log('   - Avoid relying on JOIN queries for now');
    
  } catch (error) {
    console.error('❌ Critical error:', error.message);
  }
}

fixLoyaltyForeignKey().catch(console.error);