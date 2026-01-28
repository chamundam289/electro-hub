import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CouponValidationResult } from '@/integrations/supabase/affiliate-types';
import { toast } from 'sonner';

export const useCouponValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<CouponValidationResult | null>(null);

  const validateCoupon = async (couponCode: string, orderAmount: number): Promise<CouponValidationResult> => {
    setIsValidating(true);
    
    try {
      // Call the Supabase function to validate coupon
      const { data, error } = await supabase.rpc('validate_and_apply_coupon', {
        coupon_code_param: couponCode.toUpperCase(),
        order_amount: orderAmount
      });

      if (error) {
        console.error('Error validating coupon:', error);
        const result: CouponValidationResult = {
          is_valid: false,
          discount_amount: 0,
          discount_type: '',
          error_message: 'Failed to validate coupon'
        };
        setValidationResult(result);
        return result;
      }

      const result = data[0] as CouponValidationResult;
      setValidationResult(result);

      if (!result.is_valid) {
        toast.error(result.error_message || 'Invalid coupon code');
      } else {
        toast.success(`Coupon applied! You saved ₹${result.discount_amount}`);
        
        // Track coupon click for analytics
        if (result.affiliate_id) {
          await trackCouponClick(result.affiliate_id, couponCode);
        }
      }

      return result;
    } catch (error) {
      console.error('Error in validateCoupon:', error);
      const result: CouponValidationResult = {
        is_valid: false,
        discount_amount: 0,
        discount_type: '',
        error_message: 'Failed to validate coupon'
      };
      setValidationResult(result);
      return result;
    } finally {
      setIsValidating(false);
    }
  };

  const trackCouponClick = async (affiliateId: string, couponCode: string) => {
    try {
      await supabase.from('affiliate_clicks').insert({
        affiliate_id: affiliateId,
        coupon_code: couponCode,
        customer_ip: await getClientIP(),
        user_agent: navigator.userAgent,
        referrer_url: document.referrer || window.location.href,
        converted: false // Will be updated when order is placed
      });
    } catch (error) {
      console.error('Error tracking coupon click:', error);
    }
  };

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  };

  const clearValidation = () => {
    setValidationResult(null);
  };

  return {
    validateCoupon,
    clearValidation,
    isValidating,
    validationResult
  };
};