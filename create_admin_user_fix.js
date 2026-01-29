// ADMIN USER CREATION FIX
// Run this in browser console to create admin user properly

const createAdminUserFix = async () => {
  console.log('🔧 Creating Admin User...');
  
  const adminEmail = 'chamundam289@gmail.com';
  const adminPassword = '2y?2c/yH6npaK2U';
  
  try {
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('');
    
    // First, try to sign up the user (this will create the user if it doesn't exist)
    console.log('🔄 Attempting to create user...');
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
    });
    
    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('✅ User already exists, trying to sign in...');
        
        // User exists, try to sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword
        });
        
        if (signInError) {
          console.error('❌ Sign in failed:', signInError.message);
          console.log('');
          console.log('💡 This means the password is incorrect.');
          console.log('🔧 Solutions:');
          console.log('1. Go to Supabase Dashboard > Authentication > Users');
          console.log('2. Find user: chamundam289@gmail.com');
          console.log('3. Reset password to: 2y?2c/yH6npaK2U');
          console.log('4. Or delete user and run this script again');
          return;
        } else {
          console.log('✅ Sign in successful!');
          console.log('👤 User:', signInData.user?.email);
          console.log('🚀 Admin login should now work at /admin/login');
          return;
        }
      } else {
        console.error('❌ Sign up failed:', signUpError.message);
        return;
      }
    }
    
    if (signUpData.user) {
      console.log('✅ User created successfully!');
      console.log('👤 User ID:', signUpData.user.id);
      console.log('📧 Email:', signUpData.user.email);
      console.log('✅ Email confirmed:', signUpData.user.email_confirmed_at ? 'Yes' : 'No');
      console.log('');
      console.log('🚀 Admin login should now work at /admin/login');
      console.log('📧 Email: chamundam289@gmail.com');
      console.log('🔑 Password: 2y?2c/yH6npaK2U');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
};

// Test admin login after creation
const testAdminLoginAfterCreation = async () => {
  console.log('🧪 Testing Admin Login...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'chamundam289@gmail.com',
      password: '2y?2c/yH6npaK2U'
    });
    
    if (error) {
      console.error('❌ Login test failed:', error.message);
    } else {
      console.log('✅ Login test successful!');
      console.log('👤 User:', data.user?.email);
      console.log('🔐 Is admin:', data.user?.email === 'chamundam289@gmail.com');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Auto-run the fix
console.log('🚀 Admin User Creation Fix Loaded!');
console.log('');
console.log('Available commands:');
console.log('- createAdminUserFix()        : Create admin user');
console.log('- testAdminLoginAfterCreation() : Test login after creation');
console.log('');

// Run the fix automatically
createAdminUserFix();