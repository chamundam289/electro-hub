import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  Truck, 
  CheckCircle,
  Banknote,
  Lock,
  Coins,
  Gift
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/contexts/OrderContext';
import { useLoyaltyCoins } from '@/hooks/useLoyaltyCoins';
import { CoinRedemptionModal } from '@/components/loyalty/CoinRedemptionModal';
import { toast } from 'sonner';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: cartItems, getTotalPrice } = useCart();
  const { createOrder } = useOrders();
  const { 
    wallet, 
    calculateCoinsEarned, 
    canRedeemCoins, 
    redeemCoins,
    isSystemEnabled 
  } = useLoyaltyCoins();
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [useCoins, setUseCoins] = useState(false);
  const [coinsToUse, setCoinsToUse] = useState(0);
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    notes: ''
  });

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-6">
              Please login to proceed with checkout and place your order.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/cart">Back to Cart</Link>
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const subtotal = getTotalPrice();
  const shipping = 0; // Free shipping
  const coinsDiscount = useCoins ? Math.min(coinsToUse * 0.1, subtotal) : 0; // 1 coin = ₹0.10
  const total = subtotal + shipping - coinsDiscount;
  const coinsEarned = calculateCoinsEarned(total);

  const handleCoinRedemption = (coins: number) => {
    setCoinsToUse(coins);
    setUseCoins(coins > 0);
  };

  const handlePlaceOrder = async () => {
    if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
      toast.error('Please fill in all required shipping information');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      // Handle coin redemption if selected
      let finalTotal = total;
      let coinsUsed = 0;
      
      if (useCoins && coinsToUse > 0) {
        const redemptionSuccess = await redeemCoins(
          coinsToUse, 
          'temp-order-id', // Will be updated with actual order ID
          `Coins redeemed for order - ${coinsToUse} coins used`
        );
        
        if (!redemptionSuccess) {
          toast.error('Failed to redeem coins. Please try again.');
          return;
        }
        
        coinsUsed = coinsToUse;
        finalTotal = total;
      }

      // Create order with cart items
      const orderItems = cartItems.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.offer_price || item.price
      }));

      const newOrder = await createOrder({
        customer_name: shippingInfo.name,
        customer_phone: shippingInfo.phone,
        shipping_name: shippingInfo.name,
        shipping_address: shippingInfo.address,
        shipping_city: shippingInfo.city,
        shipping_zipcode: shippingInfo.zipCode,
        total_amount: finalTotal,
        payment_method: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment',
        notes: shippingInfo.notes,
        coins_used: coinsUsed,
        coins_discount_amount: coinsDiscount,
        coins_earned: useCoins ? 0 : coinsEarned, // No coins earned if coins were used for discount
        items: orderItems
      });

      // Store order ID in sessionStorage to pass to confirmation page
      sessionStorage.setItem('lastOrderId', newOrder.id);

      toast.success('Order placed successfully!');
      navigate('/order-confirmation');
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    }
  };

  // Redirect to cart if no items
  if (cartItems.length === 0) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-6">Add some items to your cart before checkout</p>
            <Button onClick={() => navigate('/products')}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b sticky top-16 z-40">
          <div className="container-fluid py-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-10 w-10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">Checkout</h1>
            </div>
          </div>
        </div>

        <div className="container-fluid py-6 space-y-6">
          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={shippingInfo.name}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={shippingInfo.phone}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={shippingInfo.address}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                  placeholder="Enter your full address"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={shippingInfo.city}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                    placeholder="Enter your city"
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={shippingInfo.zipCode}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, zipCode: e.target.value })}
                    placeholder="Enter ZIP code"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Order Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={shippingInfo.notes}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, notes: e.target.value })}
                  placeholder="Any special instructions for delivery"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <RadioGroupItem value="cod" id="cod" />
                  <div className="flex items-center gap-3 flex-1">
                    <Banknote className="h-5 w-5 text-green-600" />
                    <div>
                      <Label htmlFor="cod" className="font-medium cursor-pointer">
                        Cash on Delivery
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Pay when your order is delivered
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Recommended</Badge>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items */}
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                    </div>
                    <span className="font-medium">₹{((item.offer_price || item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                
                {/* Loyalty Coins Section */}
                {isSystemEnabled && wallet && wallet.available_coins > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coins className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium">Loyalty Coins</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Available: {wallet.available_coins} coins
                        </span>
                      </div>
                      
                      {!useCoins ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCoinModal(true)}
                          className="w-full text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                        >
                          <Gift className="h-4 w-4 mr-2" />
                          Use Coins for Discount
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-green-600">Coins Applied:</span>
                            <span className="font-medium">{coinsToUse} coins</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowCoinModal(true)}
                              className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                            >
                              Modify
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUseCoins(false);
                                setCoinsToUse(0);
                              }}
                              className="text-red-600 hover:bg-red-50"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {!useCoins && coinsEarned > 0 && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Gift className="h-4 w-4" />
                          <span>You'll earn {coinsEarned} coins from this order!</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                {coinsDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coins Discount</span>
                    <span>-₹{coinsDiscount.toFixed(2)}</span>
                  </div>
                )}
                
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">Free Delivery</h4>
                  <p className="text-sm text-blue-700">
                    Estimated delivery: 2-3 business days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Place Order Button */}
          <Button 
            size="lg" 
            className="w-full"
            onClick={handlePlaceOrder}
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Place Order - ₹{total.toFixed(2)}
          </Button>

          {/* Coin Redemption Modal */}
          <CoinRedemptionModal
            isOpen={showCoinModal}
            onClose={() => setShowCoinModal(false)}
            orderTotal={subtotal}
            onRedeem={handleCoinRedemption}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default Checkout;