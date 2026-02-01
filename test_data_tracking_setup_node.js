// Node.js compatible test for data tracking setup
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDataTrackingSetup() {
  console.log('🔍 Testing Data Tracking Setup...\n');
  
  try {
    // Test 1: Check if data_operation_tracking table exists
    console.log('1️⃣ Testing data_operation_tracking table...');
    const { data: trackingTest, error: trackingError } = await supabase
      .from('data_operation_tracking')
      .select('*')
      .limit(1);
    
    if (trackingError) {
      console.error('❌ data_operation_tracking table error:', trackingError.message);
      return false;
    }
    console.log('✅ data_operation_tracking table is accessible');
    console.log('📊 Sample records found:', trackingTest?.length || 0);
    
    // Test 2: Check overall_storage_usage view
    console.log('\n2️⃣ Testing overall_storage_usage view...');
    const { data: storageUsage, error: storageError } = await supabase
      .from('overall_storage_usage')
      .select('*')
      .single();
    
    if (storageError) {
      console.error('❌ overall_storage_usage view error:', storageError.message);
      return false;
    }
    console.log('✅ overall_storage_usage view is working');
    console.log('📈 Current usage:', {
      total_files: storageUsage.total_files,
      total_database_operations: storageUsage.total_database_operations,
      total_size_mb: storageUsage.total_size_mb,
      usage_percentage: storageUsage.usage_percentage
    });
    
    // Test 3: Insert a test operation
    console.log('\n3️⃣ Testing data operation insertion...');
    const testOperation = {
      operation_type: 'create',
      table_name: 'test_orders',
      record_id: 'test-order-' + Date.now(),
      data_size_bytes: 1024,
      operation_source: 'test_admin_pos_order_create',
      metadata: {
        test: true,
        customer_name: 'Test Customer',
        total_amount: 99.99
      }
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('data_operation_tracking')
      .insert([testOperation])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Failed to insert test operation:', insertError.message);
      return false;
    }
    console.log('✅ Test operation inserted successfully');
    console.log('🆔 Operation ID:', insertResult.id);
    
    // Clean up test data
    await supabase
      .from('data_operation_tracking')
      .delete()
      .eq('id', insertResult.id);
    
    console.log('\n🎉 All tests passed! Data tracking system is ready.');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testDataTrackingSetup().then(success => {
  if (success) {
    console.log('\n✅ Setup verification completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Test admin POS order creation');
    console.log('  2. Test user-side order creation');
    console.log('  3. Check Database Management page');
  } else {
    console.log('\n❌ Setup verification failed. Please check the errors above.');
  }
  process.exit(success ? 0 : 1);
});