// Verify Data Tracking Setup - Run this after executing setup_data_operation_tracking.sql
// This script tests if the database tables and views were created successfully

console.log('🔍 Verifying Data Tracking Setup...');

async function verifyDatabaseSetup() {
  try {
    console.log('📋 Checking database tables and views...');
    
    // Test 1: Check if data_operation_tracking table exists and is accessible
    console.log('\n1️⃣ Testing data_operation_tracking table...');
    const { data: trackingTest, error: trackingError } = await supabase
      .from('data_operation_tracking')
      .select('*')
      .limit(1);
    
    if (trackingError) {
      console.error('❌ data_operation_tracking table error:', trackingError.message);
      return false;
    } else {
      console.log('✅ data_operation_tracking table is accessible');
      console.log('📊 Sample records found:', trackingTest?.length || 0);
    }
    
    // Test 2: Check overall_storage_usage view
    console.log('\n2️⃣ Testing overall_storage_usage view...');
    const { data: storageUsage, error: storageError } = await supabase
      .from('overall_storage_usage')
      .select('*')
      .single();
    
    if (storageError) {
      console.error('❌ overall_storage_usage view error:', storageError.message);
      return false;
    } else {
      console.log('✅ overall_storage_usage view is working');
      console.log('📈 Current usage:', {
        total_files: storageUsage.total_files,
        total_database_operations: storageUsage.total_database_operations,
        total_size_mb: storageUsage.total_size_mb,
        usage_percentage: storageUsage.usage_percentage
      });
    }
    
    // Test 3: Check data_operation_summary view
    console.log('\n3️⃣ Testing data_operation_summary view...');
    const { data: operationSummary, error: summaryError } = await supabase
      .from('data_operation_summary')
      .select('*')
      .limit(5);
    
    if (summaryError) {
      console.error('❌ data_operation_summary view error:', summaryError.message);
      return false;
    } else {
      console.log('✅ data_operation_summary view is working');
      console.log('📊 Operation sources found:', operationSummary?.length || 0);
      if (operationSummary && operationSummary.length > 0) {
        console.log('🔍 Sample operations:', operationSummary.map(op => ({
          source: op.operation_source,
          table: op.table_name,
          operations: op.total_operations
        })));
      }
    }
    
    // Test 4: Check combined_usage_summary view
    console.log('\n4️⃣ Testing combined_usage_summary view...');
    const { data: combinedUsage, error: combinedError } = await supabase
      .from('combined_usage_summary')
      .select('*')
      .limit(5);
    
    if (combinedError) {
      console.error('❌ combined_usage_summary view error:', combinedError.message);
      return false;
    } else {
      console.log('✅ combined_usage_summary view is working');
      console.log('📊 Usage sources found:', combinedUsage?.length || 0);
      if (combinedUsage && combinedUsage.length > 0) {
        console.log('🔍 Sample usage:', combinedUsage.map(usage => ({
          type: usage.usage_type,
          source: usage.source_name,
          items: usage.total_items,
          size_mb: usage.total_size_mb
        })));
      }
    }
    
    console.log('\n🎉 All database setup verification tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Database setup verification failed:', error);
    return false;
  }
}

async function testDataOperationTracking() {
  try {
    console.log('\n🧪 Testing data operation tracking functionality...');
    
    // Test inserting a sample data operation
    const testOperation = {
      operation_type: 'create',
      table_name: 'test_orders',
      record_id: 'test-order-' + Date.now(),
      data_size_bytes: 1024,
      operation_source: 'test_admin_pos_order_create',
      metadata: {
        test: true,
        customer_name: 'Test Customer',
        total_amount: 99.99,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('📝 Inserting test operation...');
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
    
    // Test querying the operation back
    console.log('🔍 Querying test operation...');
    const { data: queryResult, error: queryError } = await supabase
      .from('data_operation_tracking')
      .select('*')
      .eq('id', insertResult.id)
      .single();
    
    if (queryError) {
      console.error('❌ Failed to query test operation:', queryError.message);
      return false;
    }
    
    console.log('✅ Test operation queried successfully');
    console.log('📊 Operation details:', {
      operation_type: queryResult.operation_type,
      table_name: queryResult.table_name,
      data_size_bytes: queryResult.data_size_bytes,
      operation_source: queryResult.operation_source
    });
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('data_operation_tracking')
      .delete()
      .eq('id', insertResult.id);
    
    if (deleteError) {
      console.warn('⚠️ Failed to clean up test data:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up successfully');
    }
    
    console.log('\n🎉 Data operation tracking functionality test passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Data operation tracking test failed:', error);
    return false;
  }
}

async function runCompleteVerification() {
  console.log('🚀 Starting complete data tracking setup verification...\n');
  
  const setupValid = await verifyDatabaseSetup();
  const trackingValid = await testDataOperationTracking();
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 VERIFICATION RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log('Database Setup:', setupValid ? '✅ PASSED' : '❌ FAILED');
  console.log('Tracking Functionality:', trackingValid ? '✅ PASSED' : '❌ FAILED');
  
  if (setupValid && trackingValid) {
    console.log('\n🎊 SUCCESS! Data tracking system is fully operational!');
    console.log('\n📝 Next Steps:');
    console.log('  1. Go to Admin Dashboard → POS System');
    console.log('  2. Create a test order with some products');
    console.log('  3. Visit Admin Dashboard → Database Management');
    console.log('  4. Check the "Data Operations" tab to see tracked operations');
    console.log('  5. Monitor storage usage including database operations');
    
    console.log('\n🔍 What to expect:');
    console.log('  • Order creation will be tracked automatically');
    console.log('  • Order items will be tracked separately');
    console.log('  • Inventory transactions will be recorded');
    console.log('  • Customer creation will be tracked');
    console.log('  • Mobile services will be tracked');
    console.log('  • All operations appear in Database Management dashboard');
    
  } else {
    console.log('\n❌ SETUP INCOMPLETE - Please check the errors above');
    console.log('\n🔧 Troubleshooting:');
    console.log('  1. Make sure you ran setup_data_operation_tracking.sql successfully');
    console.log('  2. Check Supabase dashboard for any table creation errors');
    console.log('  3. Verify RLS policies are disabled for development');
    console.log('  4. Ensure proper permissions are granted');
  }
  
  return setupValid && trackingValid;
}

// Export for manual testing
window.verifyDataTrackingSetup = runCompleteVerification;
window.testDatabaseSetup = verifyDatabaseSetup;
window.testDataOperationTracking = testDataOperationTracking;

console.log('🧪 Verification functions loaded!');
console.log('📞 Run: verifyDataTrackingSetup() to start complete verification');
console.log('📋 Or run individual tests:');
console.log('  - testDatabaseSetup() for database structure verification');
console.log('  - testDataOperationTracking() for functionality testing');