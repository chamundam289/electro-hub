-- ============================================
-- FIX COUPON FOREIGN KEY RELATIONSHIPS
-- ============================================

-- Add foreign key constraints that were missing
ALTER TABLE public.coupon_usage 
ADD CONSTRAINT fk_coupon_usage_coupon 
FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE;

ALTER TABLE public.coupon_usage 
ADD CONSTRAINT fk_coupon_usage_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.coupon_usage 
ADD CONSTRAINT fk_coupon_usage_order 
FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;

ALTER TABLE public.coupon_usage 
ADD CONSTRAINT fk_coupon_usage_affiliate 
FOREIGN KEY (affiliate_id) REFERENCES public.affiliate_users(id) ON DELETE SET NULL;

-- Add foreign key constraints for other coupon tables
ALTER TABLE public.coupon_products 
ADD CONSTRAINT fk_coupon_products_coupon 
FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE;

ALTER TABLE public.coupon_products 
ADD CONSTRAINT fk_coupon_products_product 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.user_coupons 
ADD CONSTRAINT fk_user_coupons_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_coupons 
ADD CONSTRAINT fk_user_coupons_coupon 
FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE;

ALTER TABLE public.user_coupons 
ADD CONSTRAINT fk_user_coupons_assigned_by 
FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.coupon_analytics 
ADD CONSTRAINT fk_coupon_analytics_coupon 
FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE;

-- Add foreign key for coupons to affiliate_users
ALTER TABLE public.coupons 
ADD CONSTRAINT fk_coupons_affiliate 
FOREIGN KEY (affiliate_id) REFERENCES public.affiliate_users(id) ON DELETE SET NULL;

ALTER TABLE public.coupons 
ADD CONSTRAINT fk_coupons_created_by 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add foreign key for orders coupon relationship
ALTER TABLE public.orders 
ADD CONSTRAINT fk_orders_coupon 
FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE SET NULL;

-- Refresh the schema cache in Supabase
NOTIFY pgrst, 'reload schema';