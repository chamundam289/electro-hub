// TEST ORIGINAL ADMIN LOGIN
// Run this in browser console to test the original admin credentials

const testOriginalAdminLogin = async () => {
  console.log('🧪 Testing Original Admin Login...');
  
  const originalEmail = 'chamundam289@gmail.com';
  const originalPassword = '2y?2c/yH6npaK2U';
  
  try {
    console.log('📧 Email:', originalEmail);
    console.log('🔑 Password:', originalPassword);
    console.log('');
    console.log('🔄 Attempting login...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: originalEmail,
      password: originalPassword
    });
    
    if (error) {
      console.error('❌ Login failed:', error.message);
      console.log('');
      console.log('🔍 Possible issues:');
      console.log('1. User might not exist in database');
      console.log('2. Password might have been changed');
      console.log('3. Email might not be confirmed');
      console.log('4. Account might be disabled');
      console.log('');
      console.log('💡 Solutions:');
      console.log('1. Go to /admin/setup and click "Create/Update Admin User"');
      console.log('2. Check Supabase Dashboard > Authentication > Users');
      console.log('3. Try Google login first if available');
    } else {
      console.log('✅ Login successful!');
      console.log('👤 User ID:', data.user?.id);
      console.log('📧 Email:', data.user?.email);
      console.log('✅ Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');
      console.log('🚀 You should now be able to access /admin');
      
      // Check admin status
      const isAdmin = data.user?.email === 'chamundam289@gmail.com';
      console.log('🔐 Admin status:', isAdmin ? 'YES' : 'NO');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
};

// Check current auth state
const checkCurrentAuthState = async () => {
  console.log('🔍 Checking Current Auth State...');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Error getting user:', error);
      return;
    }
    
    if (user) {
      console.log('✅ Currently logged in as:', user.email);
      console.log('🔐 Is admin:', user.email === 'chamundam289@gmail.com');
      console.log('📅 Last sign in:', user.last_sign_in_at);
    } else {
      console.log('❌ Not currently logged in');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Auto-run checks
console.log('🚀 Original Admin Login Tester Loaded!');
console.log('');
console.log('Available commands:');
console.log('- testOriginalAdminLogin() : Test login with original credentials');
console.log('- checkCurrentAuthState()  : Check current login status');
console.log('');

// Check current state first
checkCurrentAuthState();

console.log('');
console.log('📋 Original Admin Credentials:');
console.log('Email: chamundam289@gmail.com');
console.log('Password: 2y?2c/yH6npaK2U');
console.log('');
console.log('🧪 Run testOriginalAdminLogin() to test these credentials');