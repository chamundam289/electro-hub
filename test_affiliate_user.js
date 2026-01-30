// Test script to check affiliate user in database
// Run this in browser console to debug the login issue

console.log('🔍 Testing affiliate user in database...');

// Test the affiliate user query
fetch('/rest/v1/affiliate_users?select=*&eq=mobile_number.9999999999', {
  headers: {
    'apikey': 'your-anon-key',
    'Authorization': 'Bearer your-anon-key'
  }
})
.then(response => response.json())
.then(data => {
  console.log('📊 Affiliate user data:', data);
  
  if (data && data.length > 0) {
    const user = data[0];
    console.log('✅ User found:', {
      name: user.name,
      mobile: user.mobile_number,
      code: user.affiliate_code,
      active: user.is_active,
      passwordHash: user.password_hash
    });
    
    // Test password decoding
    try {
      const decoded = atob(user.password_hash);
      console.log('🔓 Base64 decoded password:', decoded);
    } catch (error) {
      console.log('❌ Base64 decode failed, hash might be SHA256:', user.password_hash);
    }
  } else {
    console.log('❌ No affiliate user found with mobile 9999999999');
    console.log('💡 You need to run the database setup script');
  }
})
.catch(error => {
  console.log('❌ Database query failed:', error);
  console.log('💡 Check if affiliate_users table exists');
});