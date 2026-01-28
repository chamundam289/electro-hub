# 🚀 Affiliate System Setup Guide

## Quick Setup Steps

### 1. Database Migration
Run the affiliate system database migration:

```bash
# If using Supabase CLI
supabase db reset
# Then apply the migration
psql -h your-db-host -d your-db -f supabase/migrations/affiliate_system.sql
```

Or copy and paste the contents of `supabase/migrations/affiliate_system.sql` into your Supabase SQL editor.

### 2. Verify Installation
1. Go to Admin Dashboard → Affiliate Test
2. Click "Run Database Tests"
3. Ensure all tests pass ✅

### 3. Create Your First Affiliate
1. Go to Admin Dashboard → Affiliate Marketing
2. Click "Add Affiliate"
3. Fill in the form:
   - Email: affiliate@example.com
   - Full Name: Test Affiliate
   - Commission Type: Percentage
   - Commission Value: 10

### 4. Create a Coupon
1. In Affiliate Management → Coupons tab
2. Click "Add Coupon"
3. Fill in:
   - Affiliate: Select the affiliate you created
   - Coupon Code: SAVE20
   - Discount Type: Percentage
   - Discount Value: 20

### 5. Test the System
1. Go to `/affiliate/login`
2. Enter the affiliate email
3. Check email for magic link
4. Login to affiliate dashboard
5. View your coupon codes

### 6. Test Coupon Validation
1. Go to Admin → Affiliate Test → Coupon Validation
2. Enter "SAVE20" and amount "1000"
3. Click "Test Coupon Validation"
4. Should show success with ₹200 discount

## Routes Available

- `/admin` - Admin dashboard (requires admin role)
- `/affiliate/login` - Affiliate login page
- `/affiliate/dashboard` - Affiliate dashboard (requires affiliate role)

## Key Features Working

✅ **Passwordless Authentication** - Email OTP login
✅ **Role-based Access** - Admin/Affiliate/Customer roles
✅ **Coupon Management** - Create, validate, track usage
✅ **Commission Calculation** - Automatic on order completion
✅ **Target Tracking** - Monthly goals and rewards
✅ **Secure Database** - RLS policies protect data
✅ **Real-time Dashboard** - Live metrics and analytics

## Next Steps

1. **Integrate with Checkout** - Add CouponInput component to your checkout flow
2. **Set Up Email Templates** - Customize OTP and invitation emails
3. **Configure Payouts** - Set up payment processing for affiliates
4. **Add Analytics** - Implement detailed reporting and insights
5. **Mobile Optimization** - Ensure responsive design on all devices

## Troubleshooting

**Can't login as affiliate?**
- Ensure the user has `role = 'affiliate'` in profiles table
- Check that affiliate record exists in affiliates table

**Coupon validation failing?**
- Verify coupon exists and `is_active = true`
- Check expiry date and usage limits
- Ensure affiliate status is 'active'

**Commission not calculating?**
- Order must have `status = 'completed'`
- Order must have valid `affiliate_id`
- Check affiliate commission settings

## Support

The system is now ready for production use! 🎉

For advanced configuration and customization, refer to the main `AFFILIATE_SYSTEM_README.md` file.