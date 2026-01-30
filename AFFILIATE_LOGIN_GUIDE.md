# 🎯 How to Login to Affiliate Dashboard

## Step 1: Access the Affiliate Login Page

**URL:** `http://localhost:8080/affiliate/login`

Or navigate to your application and go to: **Your Domain + `/affiliate/login`**

## Step 2: Use Test Affiliate Credentials

After running the `SIMPLE_FINAL_FIX.sql` script, a test affiliate user was created:

### 📱 Login Credentials:
- **Mobile Number:** `9999999999`
- **Password:** `password123`

## Step 3: Login Process

1. **Open the affiliate login page**
2. **Enter mobile number:** `9999999999`
3. **Enter password:** `password123`
4. **Click "Sign In"**
5. **You'll be redirected to:** `/affiliate/dashboard`

## Step 4: What You'll See in Dashboard

The affiliate dashboard includes:
- ✅ **Personal Stats** - Total clicks, orders, earnings
- ✅ **Commission Tracking** - Pending and paid commissions
- ✅ **Affiliate Links** - Generate links for products
- ✅ **Click Analytics** - Track your referral performance
- ✅ **Payout Requests** - Request commission payments

## 🔧 Create New Affiliate Users (Admin Only)

To create new affiliate users, go to:
1. **Admin Dashboard** → **Affiliate Management**
2. **Click "Add Affiliate"**
3. **Fill in details:**
   - Name
   - Mobile Number (10 digits)
   - Password
   - Affiliate Code (auto-generated)
4. **Click "Create"**

## 🚀 How Affiliate System Works

### For Affiliates:
1. **Login to dashboard**
2. **Generate affiliate links** for products
3. **Share links** with customers
4. **Earn commissions** when customers purchase
5. **Request payouts** when ready

### For Customers:
1. **Click affiliate link** (e.g., `yoursite.com/product/mobile?ref=AFF000001`)
2. **Purchase product**
3. **Affiliate earns commission** automatically

### For Admin:
1. **Manage affiliates** in admin panel
2. **Set commission rates** per product
3. **Approve/reject** payout requests
4. **Track overall** affiliate performance

## 🔍 Troubleshooting

### "Invalid mobile number or account not found"
- Make sure you ran the `SIMPLE_FINAL_FIX.sql` script
- Check that affiliate_users table has the test user
- Verify mobile number is exactly `9999999999`

### "Invalid password"
- Make sure password is exactly `password123`
- Password is case-sensitive

### "Page not found"
- Ensure you're using the correct URL: `/affiliate/login`
- Check that the affiliate routes are properly set up in App.tsx

### Database Issues
- Run the `SIMPLE_FINAL_FIX.sql` script to create all affiliate tables
- Check browser console for any API errors

## 📊 Test the Complete Flow

1. **Login as affiliate** with test credentials
2. **Go to a product page** (e.g., `/product/mobile`)
3. **Add `?ref=AFF000001`** to the URL
4. **Click the product** (this tracks the click)
5. **Make a test purchase** (this creates commission)
6. **Check affiliate dashboard** for updated stats

## 🎉 Success Indicators

After successful login, you should see:
- ✅ Welcome message with affiliate name
- ✅ Dashboard with stats (may be 0 initially)
- ✅ Navigation menu with affiliate options
- ✅ Affiliate code displayed (AFF000001)
- ✅ No console errors

---

**Need help?** Check the browser console (F12) for any error messages and ensure all database tables are properly set up.