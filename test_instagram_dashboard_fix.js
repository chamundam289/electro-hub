// Test Instagram Dashboard database queries
// This will help fix the column name issues

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xeufezbuuccohiardtrk.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testInstagramDashboardQueries() {
  console.log('🧪 Testing Instagram Dashboard Database Queries...\n');
  
  try {
    // Test 1: Check loyalty_product_settings table structure
    console.log('🔍 Checking loyalty_product_settings table structure...');
    const { data: settingsData, error: settingsError } = await supabase
      .from('loyalty_product_settings')
      .select('*')
      .limit(1);
    
    if (settingsError) {
      console.log('❌ Error accessing loyalty_product_settings:', settingsError.message);
    } else {
      console.log('✅ loyalty_product_settings table accessible');
      if (settingsData && settingsData.length > 0) {
        console.log('📋 Available columns:', Object.keys(settingsData[0]));
      }
    }
    
    // Test 2: Check products with loyalty settings query (the one causing issues)
    console.log('\n🔍 Testing product suggestions query...');
    const availableCoins = 100; // Test with 100 coins
    
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        id, 
        name, 
        price, 
        image_url,
        loyalty_product_settings!inner (
          coins_required_to_buy,
          is_coin_purchase_enabled
        )
      `)
      .eq('is_visible', true)
      .eq('loyalty_product_settings.is_coin_purchase_enabled', true)
      .lte('loyalty_product_settings.coins_required_to_buy', availableCoins)
      .limit(6);
    
    if (productsError) {
      console.log('❌ Error in product suggestions query:', productsError.message);
      console.log('   Code:', productsError.code);
      console.log('   Details:', productsError.details);
      
      // Try alternative query without the filter
      console.log('\n🔄 Trying alternative query...');
      const { data: altData, error: altError } = await supabase
        .from('products')
        .select(`
          id, 
          name, 
          price, 
          image_url,
          loyalty_product_settings (
            coins_required_to_buy,
            is_coin_purchase_enabled
          )
        `)
        .eq('is_visible', true)
        .limit(3);
      
      if (altError) {
        console.log('❌ Alternative query also failed:', altError.message);
      } else {
        console.log('✅ Alternative query successful');
        console.log('📊 Sample data:', JSON.stringify(altData, null, 2));
      }
      
    } else {
      console.log('✅ Product suggestions query successful');
      console.log(`📊 Found ${productsData.length} products within ${availableCoins} coins budget`);
      
      if (productsData.length > 0) {
        console.log('📋 Sample product:', {
          name: productsData[0].name,
          coins_required: productsData[0].loyalty_product_settings.coins_required_to_buy,
          coin_purchase_enabled: productsData[0].loyalty_product_settings.is_coin_purchase_enabled
        });
      }
    }
    
    // Test 3: Check if we need to add loyalty settings to products
    console.log('\n🔍 Checking products without loyalty settings...');
    const { data: allProducts, error: allProductsError } = await supabase
      .from('products')
      .select('id, name, price')
      .eq('is_visible', true)
      .gt('price', 0);
    
    if (allProductsError) {
      console.log('❌ Error fetching all products:', allProductsError.message);
    } else {
      console.log(`📊 Total visible products: ${allProducts.length}`);
      
      const { data: productsWithSettings, error: withSettingsError } = await supabase
        .from('products')
        .select('id, loyalty_product_settings(product_id)')
        .eq('is_visible', true);
      
      if (withSettingsError) {
        console.log('❌ Error checking products with settings:', withSettingsError.message);
      } else {
        const withSettingsCount = productsWithSettings.filter(p => 
          p.loyalty_product_settings && p.loyalty_product_settings.length > 0
        ).length;
        
        console.log(`📊 Products with loyalty settings: ${withSettingsCount}`);
        console.log(`📊 Products needing settings: ${allProducts.length - withSettingsCount}`);
        
        if (withSettingsCount < allProducts.length) {
          console.log('⚠️  Some products need loyalty settings. Run add_loyalty_settings_to_products.sql');
        }
      }
    }
    
    // Test 4: Check Instagram tables
    console.log('\n🔍 Checking Instagram marketing tables...');
    const instagramTables = [
      'instagram_users',
      'instagram_stories', 
      'instagram_campaigns',
      'instagram_coin_transactions'
    ];
    
    for (const table of instagramTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: accessible`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testInstagramDashboardQueries().catch(console.error);