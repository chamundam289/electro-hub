import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: cartItems, updateQuantity, removeItem, getTotalPrice } = useCart();

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-6">
              Please login to view your cart and manage your items.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/products">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const subtotal = getTotalPrice();
  const shipping = 0; // Free shipping
  const total = subtotal + shipping;

  const handleCheckout = () => {
    navigate('/checkout');
  };

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
              <div>
                <h1 className="text-xl font-bold">My Cart</h1>
                <p className="text-sm text-muted-foreground">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container-fluid py-6">
          {cartItems.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">Add some products to get started</p>
              <Button asChild>
                <Link to="/products">Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cart Items */}
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-bold text-foreground">
                              ₹{(item.offer_price || item.price).toFixed(2)}
                            </span>
                            {item.offer_price && (
                              <span className="text-sm text-muted-foreground line-through">
                                ₹{item.price.toFixed(2)}
                              </span>
                            )}
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.stock_quantity}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Order Summary */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium text-green-600">Free</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-6" 
                    size="lg"
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>

              {/* Promo Section */}
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">ESJUMPS Discount 20%</h4>
                      <p className="text-sm text-muted-foreground">Save on your order</p>
                    </div>
                    <Badge variant="secondary">20% OFF</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Cart;