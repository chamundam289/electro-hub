import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Tag, Clock, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { AffiliateCoupon } from '@/integrations/supabase/affiliate-types';

export const AffiliateLinks: React.FC = () => {
  const [coupons, setCoupons] = useState<AffiliateCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveCoupons();
  }, []);

  const fetchActiveCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliate_coupons')
        .select(`
          *,
          affiliate:affiliates(
            profile:profiles(full_name)
          )
        `)
        .eq('is_active', true)
        .or('expiry_date.is.null,expiry_date.gte.' + new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching coupons:', error);
        return;
      }

      setCoupons(data || []);
    } catch (error) {
      console.error('Error in fetchActiveCoupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Coupon code copied to clipboard!');
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Exclusive Discount Coupons
        </h2>
        <p className="text-gray-600">
          Save money on your purchases with these special offers from our partners
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map((coupon) => (
          <Card 
            key={coupon.id} 
            className={`relative overflow-hidden ${
              isExpired(coupon.expiry_date) 
                ? 'opacity-50 bg-gray-50' 
                : 'hover:shadow-lg transition-shadow'
            }`}
          >
            {isExpiringSoon(coupon.expiry_date) && (
              <div className="absolute top-2 right-2">
                <Badge variant="destructive" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Expiring Soon
                </Badge>
              </div>
            )}
            
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Tag className="h-5 w-5 text-blue-600" />
                <Badge variant="secondary">
                  {coupon.discount_type === 'percentage' 
                    ? `${coupon.discount_value}% OFF` 
                    : `₹${coupon.discount_value} OFF`
                  }
                </Badge>
              </div>
              <CardTitle className="text-lg">
                {coupon.discount_type === 'percentage' 
                  ? `Get ${coupon.discount_value}% Discount` 
                  : `Save ₹${coupon.discount_value}`
                }
              </CardTitle>
              <CardDescription>
                Shared by {(coupon as any).affiliate?.profile?.full_name || 'Partner'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg border-2 border-dashed border-gray-200">
                <div className="flex items-center justify-between">
                  <code className="text-lg font-mono font-bold text-blue-600">
                    {coupon.coupon_code}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(coupon.coupon_code)}
                    disabled={isExpired(coupon.expiry_date)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                {coupon.min_order_amount && coupon.min_order_amount > 0 && (
                  <div className="flex items-center">
                    <Gift className="h-4 w-4 mr-2" />
                    <span>Minimum order: ₹{coupon.min_order_amount.toLocaleString()}</span>
                  </div>
                )}
                
                {coupon.max_discount_amount && (
                  <div className="flex items-center">
                    <Gift className="h-4 w-4 mr-2" />
                    <span>Maximum discount: ₹{coupon.max_discount_amount.toLocaleString()}</span>
                  </div>
                )}

                {coupon.usage_limit && (
                  <div className="flex items-center">
                    <Tag className="h-4 w-4 mr-2" />
                    <span>
                      Used {coupon.used_count} / {coupon.usage_limit} times
                    </span>
                  </div>
                )}

                {coupon.expiry_date && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>
                      {isExpired(coupon.expiry_date) 
                        ? 'Expired on' 
                        : 'Valid until'
                      } {new Date(coupon.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <Button 
                className="w-full" 
                disabled={isExpired(coupon.expiry_date)}
                onClick={() => {
                  copyToClipboard(coupon.coupon_code);
                  // You can redirect to products page or open shopping cart
                  window.location.href = '/products';
                }}
              >
                {isExpired(coupon.expiry_date) ? 'Expired' : 'Shop Now'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {coupons.length === 0 && (
        <div className="text-center py-12">
          <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Active Coupons
          </h3>
          <p className="text-gray-600">
            Check back later for exclusive discount offers from our partners.
          </p>
        </div>
      )}
    </div>
  );
};