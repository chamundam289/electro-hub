// FIX ADMIN LOGIN SCRIPT
// Run this in browser console on your app's page

const fixAdminLogin = async () => {
  console.log('🔧 Fixing Admin Login...');
  
  try {
    // Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Error getting current user:', userError);
      return;
    }
    
    console.log('👤 Current user:', user?.email || 'Not logged in');
    
    // Check if current user is admin
    const isAdmin = user?.email === 'chamundam289@gmail.com';
    console.log('🔐 Is current user admin?', isAdmin);
    
    if (user?.email === 'chamundam289@gmail.com') {
      console.log('✅ You are already logged in as admin!');
      console.log('🚀 Try going to /admin to access admin dashboard');
      return;
    }
    
    // If not logged in as admin, show instructions
    console.log('');
    console.log('📋 TO FIX ADMIN LOGIN:');
    console.log('');
    console.log('1. 🌐 Go to Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard');
    console.log('');
    console.log('2. 🔍 Navigate to: Authentication > Users');
    console.log('');
    console.log('3. 👤 Find user: chamundam289@gmail.com');
    console.log('');
    console.log('4. ✏️ Click on user and set password to: chamunda@321');
    console.log('');
    console.log('5. 🧪 Test login at: /admin/login');
    console.log('   Email: chamundam289@gmail.com');
    console.log('   Password: chamunda@321');
    console.log('');
    console.log('🔄 Alternative: Go to /admin/setup and click "Create/Update Admin User"');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Test admin login function
const testAdminLogin = async () => {
  console.log('🧪 Testing Admin Login...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'chamundam289@gmail.com',
      password: 'chamunda@321'
    });
    
    if (error) {
      console.error('❌ Login failed:', error.message);
      console.log('');
      console.log('💡 Possible solutions:');
      console.log('1. Password might be different - check Supabase Dashboard');
      console.log('2. User might not exist - go to /admin/setup');
      console.log('3. Email might not be confirmed');
    } else {
      console.log('✅ Login successful!');
      console.log('👤 User:', data.user?.email);
      console.log('🚀 You can now access /admin');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Check admin setup
const checkAdminSetup = async () => {
  console.log('🔍 Checking Admin Setup...');
  
  try {
    // Check if user exists in auth.users
    const { data: users, error } = await supabase
      .from('auth.users')
      .select('*')
      .eq('email', 'chamundam289@gmail.com');
      
    console.log('👥 Users found:', users?.length || 0);
    
    if (users && users.length > 0) {
      console.log('✅ Admin user exists in database');
      console.log('📧 Email confirmed:', users[0].email_confirmed_at ? 'Yes' : 'No');
    } else {
      console.log('❌ Admin user not found in database');
      console.log('💡 Go to /admin/setup to create admin user');
    }
    
  } catch (error) {
    console.log('ℹ️ Cannot check auth.users table from client (this is normal)');
    console.log('🔧 Use Supabase Dashboard to check user existence');
  }
};

// Run the fix
console.log('🚀 Admin Login Fixer Loaded!');
console.log('');
console.log('Available commands:');
console.log('- fixAdminLogin()     : Show fix instructions');
console.log('- testAdminLogin()    : Test login with new credentials');
console.log('- checkAdminSetup()   : Check if admin user exists');
console.log('');

// Auto-run the fix
fixAdminLogin();