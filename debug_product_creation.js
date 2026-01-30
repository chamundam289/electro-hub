// Debug script for Product Management errors
// Run this in browser console to identify the exact error

console.log('🔍 Debugging Product Management Issues...');

// Check if the error is related to categories table
console.log('Testing categories table...');
fetch('/rest/v1/categories?select=*&eq=is_active.true&order=name', {
  headers: {
    'apikey': window.supabase?.supabaseKey || 'your-anon-key',
    'Authorization': `Bearer ${window.supabase?.supabaseKey || 'your-anon-key'}`
  }
})
.then(response => {
  if (response.ok) {
    console.log('✅ Categories table: WORKING');
    return response.json();
  } else {
    console.log('❌ Categories table: FAILED', response.status);
    throw new Error(`Categories error: ${response.status}`);
  }
})
.then(data => {
  console.log('📊 Categories data:', data);
})
.catch(err => console.log('❌ Categories error:', err));

// Check if the error is related to products with categories relationship
console.log('Testing products with categories relationship...');
fetch('/rest/v1/products?select=*,categories(name)&order=created_at.desc&limit=5', {
  headers: {
    'apikey': window.supabase?.supabaseKey || 'your-anon-key',
    'Authorization': `Bearer ${window.supabase?.supabaseKey || 'your-anon-key'}`
  }
})
.then(response => {
  if (response.ok) {
    console.log('✅ Products with categories relationship: WORKING');
    return response.json();
  } else {
    console.log('❌ Products with categories relationship: FAILED', response.status);
    throw new Error(`Products relationship error: ${response.status}`);
  }
})
.then(data => {
  console.log('📊 Products data:', data);
})
.catch(err => console.log('❌ Products relationship error:', err));

// Check if the error is related to loyalty_product_settings table
console.log('Testing loyalty_product_settings table...');
fetch('/rest/v1/loyalty_product_settings?select=*&limit=1', {
  headers: {
    'apikey': window.supabase?.supabaseKey || 'your-anon-key',
    'Authorization': `Bearer ${window.supabase?.supabaseKey || 'your-anon-key'}`
  }
})
.then(response => {
  if (response.ok) {
    console.log('✅ Loyalty product settings table: WORKING');
    return response.json();
  } else {
    console.log('❌ Loyalty product settings table: FAILED', response.status);
    throw new Error(`Loyalty settings error: ${response.status}`);
  }
})
.then(data => {
  console.log('📊 Loyalty settings data:', data);
})
.catch(err => console.log('❌ Loyalty settings error:', err));

// Check if the error is related to product_affiliate_settings table
console.log('Testing product_affiliate_settings table...');
fetch('/rest/v1/product_affiliate_settings?select=*&limit=1', {
  headers: {
    'apikey': window.supabase?.supabaseKey || 'your-anon-key',
    'Authorization': `Bearer ${window.supabase?.supabaseKey || 'your-anon-key'}`
  }
})
.then(response => {
  if (response.ok) {
    console.log('✅ Product affiliate settings table: WORKING');
    return response.json();
  } else {
    console.log('❌ Product affiliate settings table: FAILED', response.status);
    throw new Error(`Affiliate settings error: ${response.status}`);
  }
})
.then(data => {
  console.log('📊 Affiliate settings data:', data);
})
.catch(err => console.log('❌ Affiliate settings error:', err));

console.log('📝 Debug completed. Check results above to identify the issue.');

// Also check for any unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
  console.log('🚨 UNHANDLED PROMISE REJECTION:', event.reason);
});

// Check for any JavaScript errors
window.addEventListener('error', function(event) {
  console.log('🚨 JAVASCRIPT ERROR:', event.error);
});