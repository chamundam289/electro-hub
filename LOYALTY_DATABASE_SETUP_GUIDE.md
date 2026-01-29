# 🪙 Loyalty Coins Database Setup Guide

## 🚨 **Current Issue - IDENTIFIED & SOLVED**
✅ **Database tables exist** - All loyalty tables are created and system is enabled
❌ **403 Errors** - RLS (Row Level Security) policies need to be fixed

The loyalty system is showing 403 errors because the RLS policies are preventing users from accessing their own wallet and transaction data. Here's the fix:

## 🔧 **Quick Fix - RLS Policy Update (REQUIRED)**

### **Step 1: Open Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New Query"**

### **Step 2: Execute RLS Fix**
1. Copy the entire contents of `fix_loyalty_rls_policies.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** to execute

### **Step 3: Verify Policies Fixed**
1. Refresh your application
2. Go to Profile → Loyalty Coins tab
3. Should show wallet interface without 403 errors

## 🔧 **Alternative: Manual Setup (If Tables Don't Exist)**

### **Step 1: Open Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New Query"**

### **Step 2: Execute Setup SQL**
1. Copy the entire contents of `loyalty_coins_system_setup.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** to execute

### **Step 3: Verify Tables Created**
Check that these tables were created in **Database → Tables**:
- ✅ `loyalty_coins_wallet`
- ✅ `loyalty_transactions` 
- ✅ `loyalty_product_settings`
- ✅ `loyalty_system_settings`

### **Step 4: Check RLS Policies**
In **Authentication → Policies**, verify these policies exist:
- ✅ Users can view own wallet
- ✅ Users can view own transactions
- ✅ Anyone can view product loyalty settings
- ✅ Anyone can view system settings

## 🛠️ **Alternative: Automated Setup**

### **Option A: Using Node.js Script**
```bash
# Update credentials in setup_loyalty_database.js
node setup_loyalty_database.js --run
```

### **Option B: Using Supabase CLI**
```bash
# If you have Supabase CLI installed
supabase db reset
supabase db push
```

## 🔍 **Troubleshooting**

### **If Tables Already Exist**
The SQL uses `CREATE TABLE IF NOT EXISTS` so it's safe to run multiple times.

### **If RLS Policies Fail**
Some policies might fail if admin users don't exist yet. This is normal - the basic user policies will work.

### **If Functions Fail**
The utility functions require existing `orders` and `products` tables. If these don't exist, you can skip the function creation for now.

## 🎯 **Expected Result After Setup**

### **Database Tables**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'loyalty_%';
```

Should return:
- loyalty_coins_wallet
- loyalty_transactions
- loyalty_product_settings
- loyalty_system_settings

### **Default System Settings**
The system will be enabled with these defaults:
- **Earning Rate**: 1 coin per ₹10 spent
- **Minimum Redemption**: 10 coins
- **Coin Value**: 1 coin = ₹0.10 discount
- **System Status**: Enabled

## 🚀 **After Setup Complete**

### **1. Restart Your Application**
```bash
npm run dev
```

### **2. Test Profile Page**
- Navigate to `/profile`
- Click on "Loyalty Coins" tab
- Should show wallet interface (even with 0 coins)

### **3. Verify No More 403 Errors**
The console should be clean without loyalty-related errors.

## 📊 **System Status Check**

### **Frontend Verification**
1. Profile page loads without errors
2. Loyalty Coins tab shows wallet interface
3. No 403 errors in browser console
4. Product cards show coin earning info

### **Database Verification**
```sql
-- Check system settings
SELECT * FROM loyalty_system_settings;

-- Check if wallet can be created
INSERT INTO loyalty_coins_wallet (user_id, total_coins_earned, total_coins_used, available_coins)
VALUES ('00000000-0000-0000-0000-000000000000', 0, 0, 0);
```

## 🎉 **Success Indicators**

When setup is complete, you should see:
- ✅ Profile page loads normally
- ✅ Loyalty Coins tab shows beautiful wallet interface
- ✅ No 403 errors in console
- ✅ System shows "Loyalty coins system is currently enabled"
- ✅ Product cards display coin earning information

## 🔮 **Next Steps After Setup**

1. **Test Coin Earning**: Complete a test order to see coins awarded
2. **Test Coin Redemption**: Try using coins during checkout
3. **Admin Panel**: Access loyalty management in admin dashboard
4. **Customize Settings**: Adjust earning rates and redemption limits

---

## 🆘 **Need Help?**

If you encounter issues:

1. **Check Supabase Logs**: Look for detailed error messages
2. **Verify Permissions**: Ensure your user has proper database access
3. **Manual Table Creation**: Create tables one by one if batch execution fails
4. **Skip Advanced Features**: Start with basic tables, add functions later

The loyalty system will work with just the basic tables - advanced features like automatic coin awarding can be added later!