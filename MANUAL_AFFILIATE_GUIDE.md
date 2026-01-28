# Manual Affiliate System Guide

## 🎯 System Overview

**New System Features:**
- ✅ Admin manually creates affiliate accounts with email, mobile, password
- ✅ Affiliates login with email & password (no OTP)
- ✅ Commission is set at product level when adding products
- ✅ Flexible coupon system (product-specific or general)

---

## 📋 Admin Workflow

### Step 1: Database Setup
```sql
-- Run this in Supabase SQL Editor:
-- Copy content from: manual_affiliate_system.sql
```

### Step 2: Create Affiliate Account
**Admin fills form:**
- **Email**: `affiliate@example.com`
- **Mobile**: `+91 9876543210`
- **Password**: `affiliate123` (affiliate will use this to login)
- **Full Name**: `John Doe`

**Result**: Affiliate can login at `/affiliate/login` with email & password

### Step 3: Set Product Commission
**When adding/editing products:**
- **Product**: iPhone 15 (₹75,000)
- **Commission Type**: Percentage or Fixed
- **Commission Value**: `5%` or `₹2000`
- **Enable for Affiliates**: ✅ Checked

**Result**: All affiliates can earn commission on this product

### Step 4: Create Affiliate Coupons
**Admin creates coupons:**
- **Affiliate**: Select affiliate
- **Product**: Select specific product or "All Products"
- **Coupon Code**: `IPHONE10`
- **Discount**: `10%` or `₹5000`
- **Usage Limit**: `100` uses

---

## 🔄 How It Works

### Customer Purchase Flow:
1. **Customer** applies coupon `IPHONE10` on iPhone 15
2. **System** validates coupon and applies discount
3. **Order** is placed successfully
4. **Commission** is automatically calculated from product settings
5. **Affiliate** earns commission based on product's commission rate

### Commission Calculation:
- **Product**: iPhone 15 - ₹75,000
- **Commission Setting**: 5% (set in product)
- **Affiliate Earns**: ₹3,750 per sale

---

## 📊 Database Tables

### `affiliate_accounts`
```sql
- id, email, mobile, password_hash, full_name, status
- Admin creates these manually
```

### `products` (updated)
```sql
- affiliate_commission_type: 'percentage' | 'fixed'
- affiliate_commission_value: commission rate/amount
- affiliate_enabled: true/false
```

### `affiliate_sales`
```sql
- Tracks each sale with commission details
- Links affiliate → product → order → commission
```

### `affiliate_coupons`
```sql
- product_id: NULL = all products, specific ID = that product only
- Links to affiliate_accounts (not old system)
```

---

## 🎯 Key Differences from Old System

| Feature | Old System | New System |
|---------|------------|------------|
| **Account Creation** | OTP-based signup | Admin creates manually |
| **Login Method** | Email OTP | Email + Password |
| **Commission Setting** | Per affiliate | Per product |
| **Coupon Assignment** | Complex assignments | Simple affiliate + product |
| **Database** | Multiple complex tables | Simplified structure |

---

## 🔧 Admin Interface

### Create Affiliate Account Form:
```
Email: [affiliate@example.com]
Mobile: [+91 9876543210]
Password: [affiliate123]
Full Name: [John Doe]
[Create Affiliate Account]
```

### Product Commission Form:
```
Product: [iPhone 15 - ₹75,000] ▼
Commission Type: [Percentage ▼]
Commission Value: [5] %
☑ Enable for Affiliates
[Update Product Commission]
```

### Affiliate Coupon Form:
```
Affiliate: [John Doe] ▼
Product: [iPhone 15] ▼ (or "All Products")
Coupon Code: [IPHONE10]
Discount Type: [Percentage ▼]
Discount Value: [10] %
Usage Limit: [100]
[Create Coupon]
```

---

## ✅ Testing Checklist

### Setup:
- [ ] Run `manual_affiliate_system.sql`
- [ ] Create affiliate account via admin
- [ ] Set commission on a product
- [ ] Create coupon for affiliate

### Test Flow:
- [ ] Affiliate logs in with email/password
- [ ] Customer uses coupon on website
- [ ] Order is placed successfully
- [ ] Commission is calculated correctly
- [ ] Affiliate sees earnings in dashboard

---

## 🚨 Important Notes

1. **Password Security**: In production, properly hash passwords using bcrypt
2. **Product Commission**: Must be set for each product individually
3. **Coupon Flexibility**: Can be product-specific or work on all products
4. **Simple Structure**: Much simpler than the previous complex system
5. **Manual Control**: Admin has full control over affiliate creation

---

## 📞 Common Admin Tasks

### Daily:
- Create new affiliate accounts as needed
- Set commission rates for new products
- Create promotional coupons

### Weekly:
- Review affiliate sales and commissions
- Approve pending commissions

### Monthly:
- Process affiliate payments
- Analyze performance by product/affiliate

This system gives you complete control while keeping it simple and manageable!