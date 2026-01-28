# Affiliate Database Setup Instructions

## 🎯 Quick Setup Guide

The affiliate management system is showing "Database Setup Required" because the affiliate tables haven't been created yet. Here's how to fix it:

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Copy and Run the SQL Script
1. Open the file `new_affiliate_system_v2.sql` in your project
2. Copy ALL the content from that file
3. Paste it into the Supabase SQL Editor
4. Click "Run" to execute the script

### Step 3: Verify Setup
1. Go back to the Affiliate Management page
2. Click "Check Database Setup" button
3. You should see "✅ Database Setup Complete!"
4. The Management tab will become available

## 🔍 What the SQL Script Does

The `new_affiliate_system_v2.sql` script creates:

- **affiliate_users** table - Stores affiliate account details
- **affiliate_earnings** table - Tracks commission earnings
- **affiliate_discount_codes** table - Manages affiliate coupons
- **Updates products table** - Adds commission settings
- **RLS Policies** - Security permissions
- **Helper Functions** - For authentication and calculations

## ✅ Expected Result

After running the script successfully:
- ✅ Database status shows green "Ready"
- ✅ Management tab becomes enabled
- ✅ You can create affiliate accounts
- ✅ You can set product commissions
- ✅ You can create affiliate coupons

## 🚨 If You Get Errors

**Common issues:**
- **"already exists"** - Some tables might already exist, that's OK
- **Permission denied** - Make sure you're logged in as the project owner
- **Syntax error** - Make sure you copied the entire SQL file content

**Solution:** The script is designed to handle existing tables safely with `IF NOT EXISTS` clauses.

## 📞 Need Help?

If you're still seeing "Database Not Ready" after running the script:
1. Check the Supabase SQL Editor for any error messages
2. Make sure the script ran completely without errors
3. Try clicking "Check Database Setup" again
4. Refresh the page and try again

Once setup is complete, you'll have a fully functional affiliate marketing system!