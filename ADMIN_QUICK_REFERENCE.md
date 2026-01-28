# 🚀 Admin Quick Reference - Affiliate System

## 📋 Setup Checklist (One-time)

### 1. Fix Database Issues
```sql
-- Run this in Supabase SQL Editor first:
-- Copy content from: disable_profiles_rls.sql
```

### 2. Create Affiliate Tables
```sql
-- Run this in Supabase SQL Editor:
-- Copy content from: supabase/migrations/affiliate_system.sql
```

### 3. Test Admin Login
- Go to `/admin/login`
- Login with your admin credentials
- Should redirect to admin dashboard

---

## 👥 Create Affiliate Account

### Using Admin Interface:
1. **Login to Admin Dashboard**
2. **Go to "Affiliate Management"**
3. **Fill the form:**
   - Email: `affiliate@example.com`
   - Full Name: `John Doe`
   - Phone: `+91 9876543210` (optional)
   - Commission Type: `Percentage` or `Fixed`
   - Commission Value: `10` (for 10%) or `100` (for ₹100)
4. **Click "Create Affiliate"**

### Result:
- ✅ Affiliate account created
- ✅ Can login at `/affiliate/login` with OTP
- ✅ Has access to affiliate dashboard

---

## 🎫 Create Coupon Code

### Using Admin Interface:
1. **In Affiliate Management, use Coupon form**
2. **Fill details:**
   - Coupon Code: `SAVE20`
   - Discount Type: `Percentage` or `Fixed`
   - Discount Value: `20` (for 20%) or `500` (for ₹500)
   - Min Order: `1000` (optional - minimum ₹1000 order)
   - Usage Limit: `100` (optional - can be used 100 times)
   - Expiry Date: `2024-12-31` (optional)
3. **Click "Create Coupon"**

### Result:
- ✅ Coupon code created and active
- ✅ Can be used on website checkout
- ✅ Automatically calculates affiliate commission

---

## 🔧 Troubleshooting

### "Table doesn't exist" Error
```sql
-- Run affiliate migration:
-- Copy from: supabase/migrations/affiliate_system.sql
```

### "Infinite recursion" Error
```sql
-- Run RLS fix:
-- Copy from: disable_profiles_rls.sql
```

### Affiliate Can't Login
- Check email is correct in database
- Affiliate should use `/affiliate/login` (not admin login)
- Uses OTP (email verification), not password

### Coupon Not Working
- Check coupon is active (`is_active = true`)
- Check expiry date hasn't passed
- Check usage limit not exceeded
- Check minimum order amount is met

---

## 📊 Quick Database Queries

### Check Affiliates
```sql
SELECT p.email, a.commission_type, a.commission_value, a.status
FROM public.affiliates a 
JOIN public.profiles p ON a.user_id = p.id;
```

### Check Coupons
```sql
SELECT ac.coupon_code, ac.discount_type, ac.discount_value, 
       ac.is_active, p.email as affiliate_email
FROM public.affiliate_coupons ac
JOIN public.affiliates a ON ac.affiliate_id = a.id
JOIN public.profiles p ON a.user_id = p.id;
```

### Check Commissions
```sql
SELECT * FROM public.affiliate_commissions 
ORDER BY created_at DESC LIMIT 10;
```

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ Admin can create affiliates without errors
- ✅ Affiliate can login at `/affiliate/login` with OTP
- ✅ Affiliate sees dashboard with their info
- ✅ Coupons work on website checkout
- ✅ Orders with coupons create commissions automatically

---

## 🆘 Need Help?

1. **Check browser console** for JavaScript errors
2. **Check Supabase logs** for database errors
3. **Verify database tables exist** in Supabase dashboard
4. **Test step by step** - create affiliate, then coupon, then test order

## 📞 Common Admin Tasks

### Daily:
- Review new orders with affiliate coupons
- Check commission calculations

### Weekly:
- Approve pending commissions
- Create new coupon codes as needed

### Monthly:
- Process affiliate payouts
- Set new monthly targets
- Review affiliate performance

---

**Remember**: Always test with a small order first to verify the entire flow works correctly!