# Admin Guide: How to Add Coupons and Create Affiliate Accounts

## 🚀 Quick Start Guide

### Step 1: Database Setup (One-time)
Before you can create affiliates and coupons, you need to set up the database:

1. **Go to your Supabase Dashboard**
   - Open your Supabase project dashboard
   - Navigate to **SQL Editor**

2. **Run the Database Migration**
   - Copy the content from `disable_profiles_rls.sql` file
   - Paste it in the SQL Editor and click **Run**
   - This fixes the login issues and creates the profiles table

3. **Create Affiliate Tables**
   - Copy the content from `supabase/migrations/affiliate_system.sql` file
   - Paste it in the SQL Editor and click **Run**
   - This creates all affiliate-related tables

### Step 2: Access Admin Dashboard
1. **Login as Admin**
   - Go to `/admin/login`
   - Enter your admin email and password
   - You'll be redirected to the admin dashboard

2. **Navigate to Affiliate Management**
   - In the admin dashboard, click on **"Affiliate Management"**
   - You'll see the affiliate management interface

---

## 👥 How to Create Affiliate Accounts

### Method 1: Using Admin Interface (Recommended)

1. **Go to Affiliate Management**
   - Login to admin dashboard
   - Click "Affiliate Management" in the sidebar

2. **Click "Create Affiliate"**
   - Fill in the affiliate details:
     - **Email**: Affiliate's email address
     - **Full Name**: Affiliate's full name
     - **Phone**: Contact number (optional)
     - **Commission Type**: Choose "Percentage" or "Fixed Amount"
     - **Commission Value**: Set the commission rate/amount

3. **Set Commission Structure**
   - **Percentage**: e.g., 10% means affiliate gets 10% of each sale
   - **Fixed**: e.g., ₹50 means affiliate gets ₹50 per sale

4. **Save and Send Invitation**
   - Click "Create Affiliate"
   - System will create the account and send login instructions

### Method 2: Direct Database Insert

If the interface isn't working, you can create affiliates directly:

```sql
-- 1. First create the user profile
INSERT INTO public.profiles (id, email, role, full_name, status)
VALUES (
    gen_random_uuid(),  -- This will be replaced with actual user ID
    'affiliate@example.com',
    'affiliate',
    'John Doe',
    'active'
);

-- 2. Then create the affiliate record
INSERT INTO public.affiliates (user_id, commission_type, commission_value, status)
SELECT id, 'percentage', 10.00, 'active'
FROM public.profiles 
WHERE email = 'affiliate@example.com';
```

---

## 🎫 How to Add Coupons

### Method 1: Using Admin Interface

1. **Go to Coupon Management**
   - In Affiliate Management, click "Coupons" tab
   - Click "Add New Coupon"

2. **Fill Coupon Details**
   - **Affiliate**: Select which affiliate owns this coupon
   - **Coupon Code**: Enter unique code (e.g., "SAVE20", "JOHN10")
   - **Discount Type**: Choose "Percentage" or "Fixed Amount"
   - **Discount Value**: Set the discount amount
   - **Minimum Order**: Set minimum order amount (optional)
   - **Usage Limit**: How many times it can be used (optional)
   - **Expiry Date**: When the coupon expires (optional)

3. **Example Coupon Settings**
   ```
   Coupon Code: SAVE20
   Discount Type: Percentage
   Discount Value: 20
   Minimum Order: ₹500
   Usage Limit: 100
   Expiry Date: 2024-12-31
   ```

### Method 2: Direct Database Insert

```sql
-- Create a coupon for an affiliate
INSERT INTO public.affiliate_coupons (
    affiliate_id,
    coupon_code,
    discount_type,
    discount_value,
    min_order_amount,
    usage_limit,
    expiry_date,
    is_active
) VALUES (
    (SELECT id FROM public.affiliates WHERE user_id = 
        (SELECT id FROM public.profiles WHERE email = 'affiliate@example.com')
    ),
    'SAVE20',
    'percentage',
    20.00,
    500.00,
    100,
    '2024-12-31',
    true
);
```

---

## 🎯 How to Set Monthly Targets

### Using Admin Interface

1. **Go to Targets Section**
   - In Affiliate Management, click "Targets" tab
   - Click "Set New Target"

2. **Configure Target**
   - **Affiliate**: Select affiliate
   - **Month/Year**: e.g., "2024-02"
   - **Sales Target**: e.g., ₹50,000
   - **Orders Target**: e.g., 20 orders
   - **Reward Type**: Cash, Gift, Bonus, or Coupon
   - **Reward Value**: e.g., ₹5,000 bonus
   - **Description**: "February 2024 Sales Target"

### Example Target Setup
```
Affiliate: John Doe
Month: 2024-02
Sales Target: ₹50,000
Orders Target: 20
Reward Type: Cash
Reward Value: ₹5,000
Description: Achieve ₹50K sales in February for ₹5K bonus
```

---

## 📊 Managing Commissions

### Approve Commissions

1. **View Pending Commissions**
   - Go to "Commissions" tab
   - See all pending commission payments

2. **Approve Individual Commissions**
   - Click "Approve" next to each commission
   - Add notes if needed

3. **Bulk Approve**
   - Select multiple commissions
   - Click "Approve Selected"

### Process Payouts

1. **Create Payout**
   - Select approved commissions
   - Click "Create Payout"
   - Enter payment details (bank transfer, UPI, etc.)

2. **Mark as Paid**
   - After transferring money, mark payout as "Completed"
   - Add transaction ID for reference

---

## 🔧 Troubleshooting

### Common Issues

1. **"Table doesn't exist" Error**
   - Run the database migration SQL files
   - Check Supabase logs for specific errors

2. **"Permission denied" Error**
   - Run `disable_profiles_rls.sql` to fix RLS issues
   - Grant proper permissions to authenticated users

3. **Affiliate Can't Login**
   - Ensure affiliate profile exists with role = 'affiliate'
   - Check if email is correct in profiles table
   - Affiliate should use `/affiliate/login` (OTP login)

4. **Coupon Not Working**
   - Check if coupon is active (`is_active = true`)
   - Verify expiry date hasn't passed
   - Check usage limit hasn't been exceeded
   - Ensure minimum order amount is met

### Database Queries for Debugging

```sql
-- Check if affiliate exists
SELECT * FROM public.profiles WHERE role = 'affiliate';

-- Check affiliate details
SELECT p.email, a.* 
FROM public.affiliates a 
JOIN public.profiles p ON a.user_id = p.id;

-- Check coupons
SELECT ac.*, p.email as affiliate_email
FROM public.affiliate_coupons ac
JOIN public.affiliates a ON ac.affiliate_id = a.id
JOIN public.profiles p ON a.user_id = p.id;

-- Check commissions
SELECT * FROM public.affiliate_commissions 
ORDER BY created_at DESC;
```

---

## 📋 Admin Checklist

### Initial Setup
- [ ] Run database migration files
- [ ] Fix RLS policies (run disable_profiles_rls.sql)
- [ ] Test admin login works
- [ ] Access affiliate management interface

### Creating First Affiliate
- [ ] Create affiliate account with email and commission rate
- [ ] Create at least one coupon for the affiliate
- [ ] Set monthly target (optional)
- [ ] Test affiliate login at `/affiliate/login`
- [ ] Verify affiliate can see their dashboard

### Testing the System
- [ ] Create a test order using affiliate coupon
- [ ] Check if commission is calculated correctly
- [ ] Approve the commission
- [ ] Test payout process

### Regular Management
- [ ] Review and approve commissions weekly
- [ ] Process payouts monthly
- [ ] Set new monthly targets
- [ ] Monitor affiliate performance
- [ ] Create new coupons as needed

---

## 🎉 Success Indicators

You'll know everything is working when:
1. ✅ Admin can login and access affiliate management
2. ✅ Affiliates can login with OTP and see their dashboard
3. ✅ Coupons work on the website and calculate discounts
4. ✅ Commissions are automatically created when orders are placed
5. ✅ Affiliate dashboard shows correct metrics and earnings

Need help? Check the error logs in browser console and Supabase dashboard for specific error messages.