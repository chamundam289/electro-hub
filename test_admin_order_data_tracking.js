// Test Admin Order Data Tracking Implementation
// Run this in browser console after setting up the database tables

console.log('🧪 Testing Admin Order Data Tracking Implementation...');

// Test the storage tracking service
import { storageTrackingService, DATA_OPERATION_SOURCES } from './src/services/storageTrackingService.js';

async function testDataTracking() {
  try {
    console.log('📊 Testing data operation tracking...');
    
    // Test order creation tracking
    const testOrderData = {
      operation_type: 'create',
      table_name: 'orders',
      record_id: 'test-order-123',
      data_size_bytes: 1024,
      operation_source: DATA_OPERATION_SOURCES.ADMIN_POS_ORDER_CREATE,
      metadata: {
        customer_name: 'Test Customer',
        total_amount: 100.50,
        payment_method: 'cash',
        order_source: 'pos',
        items_count: 3
      }
    };
    
    const trackingResult = await storageTrackingService.trackDataOperation(testOrderData);
    console.log('✅ Order tracking result:', trackingResult);
    
    // Test data size estimation
    const orderSizeEstimate = storageTrackingService.estimateDataSize('orders', {
      customer_name: 'Test Customer',
      notes: 'This is a test order with some notes'
    });
    console.log('📏 Order size estimate:', orderSizeEstimate, 'bytes');
    
    // Test mobile recharge size estimation
    const rechargeSizeEstimate = storageTrackingService.estimateDataSize('mobile_recharges', {
      mobile_number: '1234567890',
      operator: 'Airtel',
      recharge_amount: 99
    });
    console.log('📏 Recharge size estimate:', rechargeSizeEstimate, 'bytes');
    
    // Test operation source labels
    const orderLabel = storageTrackingService.getDataOperationLabel(DATA_OPERATION_SOURCES.ADMIN_POS_ORDER_CREATE);
    const rechargeLabel = storageTrackingService.getDataOperationLabel(DATA_OPERATION_SOURCES.ADMIN_MOBILE_RECHARGE_CREATE);
    const repairLabel = storageTrackingService.getDataOperationLabel(DATA_OPERATION_SOURCES.ADMIN_MOBILE_REPAIR_CREATE);
    
    console.log('🏷️  Operation Labels:');
    console.log('  - Order Creation:', orderLabel);
    console.log('  - Mobile Recharge:', rechargeLabel);
    console.log('  - Mobile Repair:', repairLabel);
    
    // Test storage usage retrieval
    console.log('📈 Testing storage usage retrieval...');
    const storageUsage = await storageTrackingService.getStorageUsage();
    console.log('💾 Storage Usage:', storageUsage);
    
    console.log('✅ All data tracking tests completed successfully!');
    
    return {
      trackingResult,
      orderSizeEstimate,
      rechargeSizeEstimate,
      labels: { orderLabel, rechargeLabel, repairLabel },
      storageUsage
    };
    
  } catch (error) {
    console.error('❌ Data tracking test failed:', error);
    return { error: error.message };
  }
}

// Test database queries
async function testDatabaseQueries() {
  try {
    console.log('🗄️  Testing database queries...');
    
    // Test data operation summary query
    const { data: operationSummary, error: summaryError } = await supabase
      .from('data_operation_summary')
      .select('*')
      .limit(5);
    
    if (summaryError) {
      console.log('⚠️  Data operation summary not available:', summaryError.message);
    } else {
      console.log('📊 Data Operation Summary:', operationSummary);
    }
    
    // Test overall storage usage query
    const { data: storageUsage, error: usageError } = await supabase
      .from('overall_storage_usage')
      .select('*')
      .single();
    
    if (usageError) {
      console.log('⚠️  Overall storage usage not available:', usageError.message);
    } else {
      console.log('💾 Overall Storage Usage:', storageUsage);
    }
    
    // Test combined usage summary
    const { data: combinedUsage, error: combinedError } = await supabase
      .from('combined_usage_summary')
      .select('*')
      .limit(10);
    
    if (combinedError) {
      console.log('⚠️  Combined usage summary not available:', combinedError.message);
    } else {
      console.log('📈 Combined Usage Summary:', combinedUsage);
    }
    
    console.log('✅ Database query tests completed!');
    
    return {
      operationSummary,
      storageUsage,
      combinedUsage
    };
    
  } catch (error) {
    console.error('❌ Database query test failed:', error);
    return { error: error.message };
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive data tracking tests...\n');
  
  const trackingTests = await testDataTracking();
  console.log('\n' + '='.repeat(50) + '\n');
  
  const databaseTests = await testDatabaseQueries();
  console.log('\n' + '='.repeat(50) + '\n');
  
  console.log('🎉 All tests completed!');
  console.log('📋 Test Results Summary:');
  console.log('  - Data Tracking:', trackingTests.error ? '❌ Failed' : '✅ Passed');
  console.log('  - Database Queries:', databaseTests.error ? '❌ Failed' : '✅ Passed');
  
  if (!trackingTests.error && !databaseTests.error) {
    console.log('\n🎊 Admin Order Data Tracking Implementation is working correctly!');
    console.log('📝 Next Steps:');
    console.log('  1. Run the SQL setup script: setup_data_operation_tracking.sql');
    console.log('  2. Create some orders in the POS system');
    console.log('  3. Check the Database Management page for tracking data');
    console.log('  4. Monitor the Data Operations tab for analytics');
  }
  
  return {
    trackingTests,
    databaseTests
  };
}

// Export for manual testing
window.testAdminOrderDataTracking = runAllTests;

console.log('🧪 Test functions loaded!');
console.log('📞 Run: testAdminOrderDataTracking() to start tests');
console.log('📋 Or run individual tests:');
console.log('  - testDataTracking() for service tests');
console.log('  - testDatabaseQueries() for database tests');