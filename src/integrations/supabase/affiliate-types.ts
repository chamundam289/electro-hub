// Affiliate Marketing System Types
export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'affiliate' | 'customer';
  status: 'active' | 'inactive' | 'suspended';
  full_name?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Affiliate {
  id: string;
  user_id: string;
  commission_type: 'fixed' | 'percentage';
  commission_value: number;
  status: 'active' | 'inactive' | 'suspended';
  total_sales: number;
  total_commission: number;
  total_orders: number;
  joined_date: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface AffiliateCoupon {
  id: string;
  affiliate_id: string;
  coupon_code: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  used_count: number;
  expiry_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  affiliate?: Affiliate;
}

export interface AffiliateCommission {
  id: string;
  affiliate_id: string;
  order_id: string;
  commission_amount: number;
  commission_rate: number;
  order_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  approved_at?: string;
  paid_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  affiliate?: Affiliate;
  order?: any; // Reference to orders table
}

export interface AffiliateTarget {
  id: string;
  affiliate_id: string;
  month_year: string; // Format: 'YYYY-MM'
  target_sales_amount: number;
  target_orders: number;
  achieved_sales_amount: number;
  achieved_orders: number;
  reward_type?: 'cash' | 'gift' | 'bonus' | 'coupon';
  reward_value?: number;
  reward_description?: string;
  status: 'active' | 'achieved' | 'expired';
  created_at: string;
  updated_at: string;
  affiliate?: Affiliate;
}

export interface AffiliateReward {
  id: string;
  affiliate_id: string;
  target_id: string;
  reward_type: 'cash' | 'gift' | 'bonus' | 'coupon';
  reward_value: number;
  reward_description?: string;
  reward_status: 'locked' | 'unlocked' | 'claimed' | 'paid';
  claimed_at?: string;
  paid_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  affiliate?: Affiliate;
  target?: AffiliateTarget;
}

export interface AffiliatePayout {
  id: string;
  affiliate_id: string;
  payout_amount: number;
  commission_ids: string[];
  reward_ids?: string[];
  payout_method: string;
  payout_details?: any; // JSONB
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processed_at?: string;
  transaction_id?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  affiliate?: Affiliate;
}

export interface AffiliateClick {
  id: string;
  affiliate_id: string;
  coupon_code: string;
  customer_ip?: string;
  user_agent?: string;
  referrer_url?: string;
  clicked_at: string;
  converted: boolean;
  order_id?: string;
  affiliate?: Affiliate;
}

// Extended Order type with affiliate fields
export interface OrderWithAffiliate {
  id: string;
  invoice_number?: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  notes?: string;
  // Affiliate fields
  coupon_code?: string;
  affiliate_id?: string;
  discount_type?: string;
  coupon_discount?: number;
  created_at: string;
  updated_at: string;
  affiliate?: Affiliate;
}

// Coupon validation response
export interface CouponValidationResult {
  is_valid: boolean;
  discount_amount: number;
  discount_type: string;
  affiliate_id?: string;
  error_message?: string;
}

// Dashboard stats interfaces
export interface AffiliateDashboardStats {
  total_sales: number;
  total_commission: number;
  pending_commission: number;
  paid_commission: number;
  total_orders: number;
  active_coupons: number;
  current_month_sales: number;
  current_month_orders: number;
  target_progress: number;
  rewards_unlocked: number;
}

export interface AdminDashboardStats {
  total_affiliates: number;
  active_affiliates: number;
  total_affiliate_sales: number;
  total_commissions_paid: number;
  pending_commissions: number;
  total_coupons: number;
  active_coupons: number;
  monthly_affiliate_sales: number;
}

// Form interfaces
export interface CreateAffiliateForm {
  email: string;
  full_name: string;
  phone?: string;
  commission_type: 'fixed' | 'percentage';
  commission_value: number;
}

export interface CreateCouponForm {
  affiliate_id: string;
  coupon_code: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  expiry_date?: string;
}

export interface CreateTargetForm {
  affiliate_id: string;
  month_year: string;
  target_sales_amount: number;
  target_orders: number;
  reward_type?: 'cash' | 'gift' | 'bonus' | 'coupon';
  reward_value?: number;
  reward_description?: string;
}

export interface ProcessPayoutForm {
  affiliate_id: string;
  commission_ids: string[];
  reward_ids?: string[];
  payout_method: string;
  payout_details?: any;
  notes?: string;
}

// API Response types
export interface AffiliateListResponse {
  data: Affiliate[];
  count: number;
}

export interface CommissionListResponse {
  data: AffiliateCommission[];
  count: number;
}

export interface CouponListResponse {
  data: AffiliateCoupon[];
  count: number;
}

export interface TargetListResponse {
  data: AffiliateTarget[];
  count: number;
}

export interface RewardListResponse {
  data: AffiliateReward[];
  count: number;
}

export interface PayoutListResponse {
  data: AffiliatePayout[];
  count: number;
}