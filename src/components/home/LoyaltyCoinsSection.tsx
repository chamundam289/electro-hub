import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Coins, 
  Package,
  Zap,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEligibleProducts } from '@/hooks/useEligibleProducts';
import { useLoyaltyCoins } from '@/hooks/useLoyaltyCoins';
import { DualCoinsDisplay } from '@/components/loyalty/DualCoinsDisplay';

export const LoyaltyCoinsSection = () => {
  const { user } = useAuth();
  const { eligibleProducts, loading, hasEligibleProducts } = useEligibleProducts();
  const { wallet, isSystemEnabled } = useLoyaltyCoins();
  const [displayProducts, setDisplayProducts] = useState<any[]>([]);

  // Show only first 4 products for homepage
  useEffect(() => {
    if (eligibleProducts && eligibleProducts.length > 0) {
      setDisplayProducts(eligibleProducts.slice(0, 4));
    } else {
      setDisplayProducts([]);
    }
  }, [eligibleProducts]);

  // Don't render anything if:
  // - User not logged in
  // - Loyalty system not enabled
  // - No eligible products
  // - Still loading
  if (!user || !isSystemEnabled || !hasEligibleProducts || loading) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50">
      <div className="container-fluid">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
              <Coins className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Redeem with Your Loyalty Coins
              </h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Sparkles className="h-4 w-4 text-yellow-600" />
                <p className="text-gray-600">
                  You have <strong className="text-yellow-700">{wallet?.available_coins || 0} coins</strong> ready to use!
                </p>
                <Sparkles className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Turn your loyalty coins into amazing products! These items are available for coin redemption right now.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {displayProducts.map((product) => (
            <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-yellow-300 bg-white">
              <CardContent className="p-0">
                {/* Product Image */}
                <div className="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`${product.image_url ? 'hidden' : ''} w-full h-full flex items-center justify-center bg-gray-100`}>
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                  
                  {/* Coin Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg">
                      <Coins className="h-3 w-3 mr-1" />
                      {product.coins_required_to_buy}
                    </Badge>
                  </div>

                  {/* Free Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-green-500 text-white shadow-lg">
                      <Zap className="h-3 w-3 mr-1" />
                      FREE
                    </Badge>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-yellow-700 transition-colors">
                    {product.name}
                  </h3>
                  
                  {product.categories?.name && (
                    <p className="text-xs text-gray-500 mb-3">{product.categories.name}</p>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm">
                      <span className="text-gray-400 line-through">₹{product.price}</span>
                      {product.offer_price && (
                        <span className="text-green-600 ml-2">₹{product.offer_price}</span>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Stock: {product.stock_quantity}
                    </Badge>
                  </div>

                  {/* Dual Coins Display */}
                  <div className="mb-4">
                    <DualCoinsDisplay
                      productId={product.id}
                      productName={product.name}
                      productPrice={product.price}
                      offerPrice={product.offer_price}
                      mode="card"
                      showEarnCoins={false}
                      showRedeemCoins={true}
                    />
                  </div>

                  {/* Redeem Button */}
                  <Link to={`/products/${product.slug}?redeem=coins`}>
                    <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white group-hover:shadow-lg transition-all duration-300">
                      <Coins className="h-4 w-4 mr-2" />
                      Redeem Now
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        {eligibleProducts.length > 4 && (
          <div className="text-center">
            <Link to="/profile?tab=loyalty">
              <Button 
                variant="outline" 
                size="lg"
                className="bg-white border-yellow-300 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-400"
              >
                View All {eligibleProducts.length} Redeemable Products
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full border border-yellow-200">
            <Coins className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              Earn more coins with every purchase • 1 coin = ₹0.10 value
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};