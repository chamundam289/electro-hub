import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Tag, X, Check } from 'lucide-react';
import { useCouponValidation } from '@/hooks/useCouponValidation';
import { CouponValidationResult } from '@/integrations/supabase/affiliate-types';

interface CouponInputProps {
  orderAmount: number;
  onCouponApplied: (result: CouponValidationResult) => void;
  onCouponRemoved: () => void;
  appliedCoupon?: CouponValidationResult | null;
}

export const CouponInput: React.FC<CouponInputProps> = ({
  orderAmount,
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon
}) => {
  const [couponCode, setCouponCode] = useState('');
  const { validateCoupon, isValidating } = useCouponValidation();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    const result = await validateCoupon(couponCode, orderAmount);
    if (result.is_valid) {
      onCouponApplied(result);
      setCouponCode('');
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
    setCouponCode('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyCoupon();
    }
  };

  return (
    <div className="space-y-4">
      {!appliedCoupon ? (
        <div className="space-y-2">
          <Label htmlFor="coupon">Have a coupon code?</Label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="coupon"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                className="pl-10"
                disabled={isValidating}
              />
            </div>
            <Button 
              onClick={handleApplyCoupon}
              disabled={!couponCode.trim() || isValidating}
              variant="outline"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                'Apply'
              )}
            </Button>
          </div>
        </div>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Coupon Applied
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveCoupon}
                className="text-green-600 hover:text-green-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {couponCode}
                </Badge>
                <p className="text-xs text-green-600 mt-1">
                  {appliedCoupon.discount_type === 'percentage' 
                    ? `${appliedCoupon.discount_amount}% discount` 
                    : `₹${appliedCoupon.discount_amount} off`
                  }
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-green-800">
                  -₹{appliedCoupon.discount_amount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};