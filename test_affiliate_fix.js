// Test script to verify affiliate tables are working
// Run this in browser console after applying the SQL fix

console.log('🔍 Testing Affiliate Database Setup...');

// Test 1: Check if affiliate_users table exists and is accessible
fetch('/rest/v1/affiliate_users?select=*&limit=1', {
  headers: {
    'apikey': 'your-anon-key',
    'Authorization': 'Bearer your-anon-key'
  }
})
.then(response => {
  if (response.ok) {
    console.log('✅ affiliate_users table: WORKING');
  } else {
    console.log('❌ affiliate_users table: FAILED', response.status);
  }
})
.catch(err => console.log('❌ affiliate_users table: ERROR', err));

// Test 2: Check if product_affiliate_settings table exists with proper relationships
fetch('/rest/v1/product_affiliate_settings?select=*,products(name)&limit=1', {
  headers: {
    'apikey': 'your-anon-key',
    'Authorization': 'Bearer your-anon-key'
  }
})
.then(response => {
  if (response.ok) {
    console.log('✅ product_affiliate_settings with products relationship: WORKING');
  } else {
    console.log('❌ product_affiliate_settings relationship: FAILED', response.status);
  }
})
.catch(err => console.log('❌ product_affiliate_settings relationship: ERROR', err));

// Test 3: Check if affiliate_orders table exists with proper relationships (this was causing 400 error)
fetch('/rest/v1/affiliate_orders?select=*,products!inner(name)&limit=1', {
  headers: {
    'apikey': 'your-anon-key',
    'Authorization': 'Bearer your-anon-key'
  }
})
.then(response => {
  if (response.ok) {
    console.log('✅ affiliate_orders with products relationship: WORKING');
    console.log('🎉 The 400 Bad Request error should be FIXED!');
  } else {
    console.log('❌ affiliate_orders relationship: FAILED', response.status);
  }
})
.catch(err => console.log('❌ affiliate_orders relationship: ERROR', err));

// Test 4: Check if affiliate_clicks table exists with proper relationships
fetch('/rest/v1/affiliate_clicks?select=*,products(name,price)&limit=1', {
  headers: {
    'apikey': 'your-anon-key',
    'Authorization': 'Bearer your-anon-key'
  }
})
.then(response => {
  if (response.ok) {
    console.log('✅ affiliate_clicks with products relationship: WORKING');
  } else {
    console.log('❌ affiliate_clicks relationship: FAILED', response.status);
  }
})
.catch(err => console.log('❌ affiliate_clicks relationship: ERROR', err));

console.log('📝 Test completed. Check results above.');
console.log('💡 If all tests pass, refresh your application and the errors should be gone!');