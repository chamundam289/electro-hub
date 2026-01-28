# Affiliate Login Guide 🔐

## 🎯 How to Login as Affiliate

### Step 1: Go to Affiliate Login Page
Navigate to: **`/affiliate/login`**

Or use the full URL: `http://your-domain.com/affiliate/login`

### Step 2: Use Your Credentials
Enter the email and password provided by the admin:

**Test Credentials:**
- **Email:** `john.affiliate@example.com`
- **Password:** `affiliate123`

### Step 3: Access Dashboard
After successful login, you'll be redirected to: **`/affiliate/dashboard`**

## 🔧 How It Works

### Authentication Flow:
1. **Enter credentials** → Email + Password
2. **System validates** → Checks against `affiliate_users` table
3. **Password verification** → Uses bcrypt hashing
4. **Account status check** → Must be 'active'
5. **Login success** → Redirects to affiliate dashboard

### Security Features:
- ✅ Password hashing with bcrypt
- ✅ Account status validation
- ✅ Secure authentication function
- ✅ Session management

## 📱 What You'll See

### Login Page Features:
- Clean, professional login form
- Email and password fields
- Test credentials displayed for convenience
- Error handling and validation
- Loading states

### After Login:
- Personalized welcome message
- Affiliate dashboard with stats
- Commission tracking
- Coupon management
- Earnings overview

## 🚨 Troubleshooting

### "Invalid email or password"
- Check spelling of email and password
- Ensure caps lock is off
- Try the test credentials first

### "Account not active"
- Contact admin to activate your account
- Check account status in database

### "Login failed"
- Check internet connection
- Ensure database is set up correctly
- Try refreshing the page

## 🔄 Admin Setup Required

Before affiliates can login, admin must:

1. **Run database setup** → `new_affiliate_system_v2.sql`
2. **Create affiliate account** → Use admin panel or SQL insert
3. **Provide credentials** → Email + password to affiliate

## 📋 Test the System

### Quick Test:
1. Go to `/affiliate/login`
2. Use test credentials:
   - Email: `john.affiliate@example.com`
   - Password: `affiliate123`
3. Should redirect to affiliate dashboard
4. See welcome message with affiliate name

### Create New Affiliate:
Use the admin panel or run SQL:
```sql
INSERT INTO public.affiliate_users (
    email, mobile, password_hash, full_name, status
) VALUES (
    'new.affiliate@example.com',
    '+91 9876543210',
    crypt('newpassword123', gen_salt('bf')),
    'New Affiliate Name',
    'active'
);
```

## 🎉 Success!

Once logged in, affiliates can:
- View their dashboard
- Track commissions
- Manage coupons
- See earnings history
- Access affiliate tools

The login system is now fully functional with secure password authentication!