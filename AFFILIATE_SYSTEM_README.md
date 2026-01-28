# 🚀 Advanced Affiliate Marketing System

A complete affiliate marketing system built with **React JS + Supabase** featuring passwordless authentication, role-based dashboards, automatic commission calculation, and secure coupon management.

## 🎯 System Overview

This system enables businesses to:
- **Hire affiliate marketers** with custom commission structures
- **Assign unique coupon codes** with flexible discount rules
- **Set monthly targets** with automatic reward systems
- **Track sales and commissions** in real-time
- **Process secure payouts** with detailed reporting

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React JS (Vite) + TypeScript
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Email OTP (Passwordless)
- **Security**: Row Level Security (RLS) + Role-based access
- **UI**: Tailwind CSS + shadcn/ui components

### Database Schema
```sql
-- Core Tables
├── profiles (user roles & basic info)
├── affiliates (affiliate-specific data)
├── affiliate_coupons (coupon codes & rules)
├── affiliate_commissions (earnings tracking)
├── affiliate_targets (monthly goals)
├── affiliate_rewards (achievement rewards)
├── affiliate_payouts (payment processing)
└── affiliate_clicks (analytics & tracking)
```

## 👥 User Roles & Access

### 🔑 Admin
- **Full system access**
- Create & manage affiliate accounts
- Assign coupons, commissions, targets
- Approve payouts & rewards
- View comprehensive analytics

### 🤝 Affiliate Marketer
- **Passwordless login** via email OTP
- **Separate dashboard** with personal metrics
- View assigned coupons & performance
- Track commissions & target progress
- **No access** to other affiliates' data

### 🛒 Customer
- Apply affiliate coupons during checkout
- **No login required** for coupon usage
- Automatic affiliate tracking & attribution

## 🔐 Authentication Flow

### Passwordless Login System
```typescript
// Admin creates affiliate account
1. Admin → Create User (email + profile)
2. System → Send invitation email
3. Affiliate → Click magic link
4. System → Auto-login to dashboard
```

### Security Features
- **Email OTP** authentication only
- **Role-based redirects** (admin/affiliate dashboards)
- **RLS policies** prevent data leakage
- **Coupon validation** on server-side only

## 💰 Business Logic

### Commission Calculation
```typescript
// Automatic calculation on order completion
if (order.status === 'completed' && order.affiliate_id) {
  const commission = calculateCommission(affiliate_id, order_amount);
  // Create pending commission record
  // Update affiliate totals
  // Check target progress
}
```

### Coupon Validation
```sql
-- Server-side validation function
validate_and_apply_coupon(coupon_code, order_amount)
├── Check coupon exists & active
├── Verify affiliate status
├── Validate expiry date
├── Check usage limits
├── Calculate discount amount
└── Return validation result
```

### Target & Reward System
```typescript
// Monthly target tracking
1. Admin sets target (sales amount + order count)
2. System tracks progress automatically
3. Target achieved → Reward unlocked
4. Admin approves → Reward paid
```

## 📊 Dashboard Features

### Affiliate Dashboard
- **Real-time metrics**: Total sales, commissions, orders
- **Coupon management**: View codes, copy to clipboard
- **Target progress**: Visual progress bars & status
- **Commission history**: Detailed earnings breakdown
- **Reward tracking**: Unlocked & claimed rewards

### Admin Panel
- **Affiliate management**: Create, edit, suspend accounts
- **Coupon creation**: Flexible discount rules & limits
- **Target setting**: Monthly goals with custom rewards
- **Commission approval**: Review & approve earnings
- **Payout processing**: Bulk payment management
- **Analytics**: Comprehensive reporting & insights

## 🛡️ Security Implementation

### Row Level Security (RLS)
```sql
-- Affiliates can only see their own data
CREATE POLICY "affiliates_own_data" ON affiliate_commissions
FOR SELECT USING (
  affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  )
);

-- Admins can see everything
CREATE POLICY "admin_full_access" ON affiliate_commissions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### Data Protection
- **Encrypted connections** (HTTPS/WSS)
- **Server-side validation** for all calculations
- **Input sanitization** & SQL injection prevention
- **Rate limiting** on authentication endpoints

## 🚀 Getting Started

### 1. Database Setup
```bash
# Run the affiliate system migration
psql -h your-db-host -d your-db -f supabase/migrations/affiliate_system.sql
```

### 2. Environment Configuration
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### 3. Deploy Edge Functions
```bash
# Deploy order processing function
supabase functions deploy process-order
```

### 4. Create Admin Account
```sql
-- Insert admin profile
INSERT INTO profiles (id, email, role, status)
VALUES ('admin-uuid', 'admin@yourstore.com', 'admin', 'active');
```

## 📱 Usage Examples

### Creating an Affiliate
```typescript
// Admin creates new affiliate
const newAffiliate = {
  email: 'marketer@example.com',
  full_name: 'John Marketer',
  commission_type: 'percentage',
  commission_value: 10.00 // 10%
};

await createAffiliate(newAffiliate);
// System sends invitation email automatically
```

### Applying Coupons
```typescript
// Customer applies coupon during checkout
const validation = await validateCoupon('SAVE20', 1000);
if (validation.is_valid) {
  // Apply ₹200 discount (20% of ₹1000)
  finalAmount = orderAmount - validation.discount_amount;
}
```

### Processing Payouts
```typescript
// Admin processes monthly payouts
const payout = {
  affiliate_id: 'affiliate-uuid',
  commission_ids: ['comm1', 'comm2', 'comm3'],
  payout_amount: 5000.00,
  payout_method: 'bank_transfer'
};

await processPayout(payout);
```

## 📈 Analytics & Reporting

### Key Metrics Tracked
- **Affiliate Performance**: Sales, orders, conversion rates
- **Coupon Usage**: Click-through rates, redemption rates
- **Commission Analytics**: Pending, approved, paid amounts
- **Target Achievement**: Progress tracking & success rates
- **Revenue Attribution**: Affiliate-driven sales analysis

### Export Capabilities
- **CSV Reports**: Commission statements, payout reports
- **Date Range Filtering**: Custom period analysis
- **Affiliate Comparison**: Performance benchmarking

## 🔧 Customization Options

### Commission Structures
- **Percentage-based**: 5%, 10%, 15% of order value
- **Fixed-amount**: ₹50, ₹100, ₹200 per order
- **Tiered commissions**: Different rates for different affiliates

### Coupon Types
- **Percentage discounts**: 10% OFF, 20% OFF
- **Fixed discounts**: ₹100 OFF, ₹500 OFF
- **Minimum order requirements**: Min ₹1000 for discount
- **Usage limits**: Single-use, 100 uses, unlimited
- **Expiry dates**: Time-limited offers

### Reward Systems
- **Cash rewards**: Direct monetary incentives
- **Gift rewards**: Physical or digital gifts
- **Bonus commissions**: Extra percentage on future sales
- **Coupon rewards**: Special discount codes for affiliates

## 🚨 Important Notes

### Security Considerations
- **Never expose** commission calculations to frontend
- **Always validate** coupons on server-side
- **Implement rate limiting** on OTP requests
- **Monitor for** coupon abuse patterns

### Performance Optimization
- **Index** frequently queried columns (affiliate_id, month_year)
- **Paginate** large result sets (commissions, orders)
- **Cache** frequently accessed data (active coupons)
- **Optimize** RLS policies for better query performance

### Compliance & Legal
- **Data privacy**: GDPR/CCPA compliance for user data
- **Financial regulations**: Proper commission reporting
- **Tax implications**: 1099 forms for affiliate earnings
- **Terms of service**: Clear affiliate agreement terms

## 🆘 Troubleshooting

### Common Issues

**Authentication Problems**
```typescript
// Check user role assignment
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();
```

**Commission Not Calculating**
```sql
-- Verify order status and affiliate assignment
SELECT o.*, a.commission_type, a.commission_value
FROM orders o
LEFT JOIN affiliates a ON o.affiliate_id = a.id
WHERE o.id = 'order-uuid';
```

**Coupon Validation Failing**
```sql
-- Check coupon status and limits
SELECT * FROM affiliate_coupons 
WHERE coupon_code = 'SAVE20'
AND is_active = true
AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE);
```

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- **Monthly**: Process affiliate payouts
- **Weekly**: Review pending commissions
- **Daily**: Monitor system performance
- **As needed**: Update coupon expiry dates

### Monitoring Alerts
- **Failed commission calculations**
- **Unusual coupon usage patterns**
- **Authentication failures**
- **Database performance issues**

---

## 🎉 Success Metrics

After implementing this system, expect to see:
- **Increased sales** through affiliate marketing
- **Reduced customer acquisition costs**
- **Improved partner relationships**
- **Automated commission processing**
- **Enhanced tracking & analytics**

The system is designed to scale with your business and can handle thousands of affiliates and millions of transactions with proper infrastructure.

---

**Built with ❤️ using React JS + Supabase**

*For technical support or customization requests, please refer to the documentation or contact the development team.*