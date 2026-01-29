// ADMIN USER CREATION SCRIPT
// Run this in your browser console on your app's page (after logging in as a different user with admin privileges)

const createAdminUser = async () => {
  try {
    console.log('Creating admin user...');
    
    // This would need to be done via Supabase Admin API or Dashboard
    // You cannot create users directly from the client side for security reasons
    
    console.log('❌ Cannot create users from client side for security reasons.');
    console.log('✅ Please follow these steps instead:');
    console.log('');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to Authentication > Users');
    console.log('4. Click "Add User"');
    console.log('5. Email: chamundam289@gmail.com');
    console.log('6. Password: chamunda@321');
    console.log('7. Click "Add User"');
    console.log('');
    console.log('OR if user already exists:');
    console.log('1. Find user: chamundam289@gmail.com');
    console.log('2. Click on the user');
    console.log('3. Set password to: chamunda@321');
    
  } catch (error) {
    console.error('Error:', error);
  }
};

// Run the function
createAdminUser();

// Alternative: Check if current user is admin
const checkAdminStatus = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user?.email);
    console.log('Is admin:', user?.email === 'chamundam289@gmail.com');
  } catch (error) {
    console.error('Error checking admin status:', error);
  }
};

// Uncomment to check current admin status
// checkAdminStatus();