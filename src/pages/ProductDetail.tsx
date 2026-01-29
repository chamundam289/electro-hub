import { useParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ProductCard } from '@/components/products/ProductCard';
import { DualCoinsDisplay } from '@/components/loyalty/DualCoinsDisplay';
import { ProductImageGallery } from '@/components/ui/ProductImageGallery';
import { 
  ArrowLeft, 
  MessageCircle, 
  Share2, 
  Heart, 
  ShoppingCart, 
  Tag, 
  Package, 
  Truck, 
  Shield, 
  Star,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: product, isLoading, error } = useProduct(slug!);
  const { data: relatedProducts } = useProducts({ 
    categoryId: product?.category_id || undefined, 
    limit: 4 
  });
  const { data: settings } = useStoreSettings();
  
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container-fluid py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="aspect-square bg-gray-200 rounded-xl"></div>
              <div className="space-y-6">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !product) {
    return (
      <MainLayout>
        <div className="container-fluid py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/products')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const hasDiscount = product.offer_price && product.offer_price < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.offer_price!) / product.price) * 100)
    : 0;
  
  const currentPrice = product.offer_price || product.price;
  const whatsappNumber = settings?.whatsapp_number?.replace(/\D/g, '') || '';
  const productUrl = window.location.href;
  
  const whatsappMessage = encodeURIComponent(
    `Hi! I'm interested in ordering:\n\n*${product.name}*\nQuantity: ${quantity}\nPrice: ₹${(currentPrice * quantity).toFixed(2)}\n\nProduct Link: ${productUrl}`
  );
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.short_description || product.name,
          url: productUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(productUrl);
      toast.success('Product link copied to clipboard!');
    }
  };

  const handleAddToWishlist = () => {
    if (!user) {
      toast.error('Please login to add items to wishlist', {
        action: {
          label: 'Login',
          onClick: () => navigate('/login')
        }
      });
      return;
    }
    // For now, just show a toast. In a real app, this would save to database
    toast.success('Added to wishlist!');
  };

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add items to cart', {
        action: {
          label: 'Login',
          onClick: () => navigate('/login')
        }
      });
      return;
    }
    toast.success('Added to cart!');
  };

  return (
    <MainLayout>
      <div className="container-fluid py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-foreground">Products</Link>
          {product.categories && (
            <>
              <span>/</span>
              <span className="hover:text-foreground">{product.categories.name}</span>
            </>
          )}
          <span>/</span>
          <span className="text-foreground font-medium">{product.name}</span>
        </nav>

        {/* Product Details */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Product Images Gallery */}
          <div className="space-y-4">
            <ProductImageGallery
              productId={product.id}
              productName={product.name}
              fallbackImage={product.image_url}
              showThumbnails={true}
              maxHeight="h-[400px] md:h-[500px] lg:h-[600px]"
              className="w-full"
            />
            
            {/* Wishlist Button Overlay */}
            <div className="relative -mt-16 z-10 flex justify-end pr-4">
              <button
                onClick={handleAddToWishlist}
                className="w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm transition-colors"
              >
                <Heart className="w-5 h-5 text-gray-600 hover:text-red-500" />
              </button>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category & Stock Status */}
            <div className="flex items-center justify-between">
              {product.categories && (
                <Badge variant="secondary" className="text-xs">
                  {product.categories.name}
                </Badge>
              )}
              <div className="flex items-center gap-2">
                {product.stock_quantity > 0 ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    In Stock ({product.stock_quantity})
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <X className="h-3 w-3 mr-1" />
                    Out of Stock
                  </Badge>
                )}
              </div>
            </div>

            {/* Product Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{product.name}</h1>

            {/* Rating (placeholder) */}
            <div className="flex items-center gap-2">
              <div className="flex text-yellow-400">
                {'★'.repeat(4)}{'☆'.repeat(1)}
              </div>
              <span className="text-sm text-muted-foreground">(4.0) • 120 reviews</span>
            </div>

            {/* Short Description */}
            {product.short_description && (
              <p className="text-muted-foreground">{product.short_description}</p>
            )}

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {hasDiscount ? (
                  <>
                    <span className="text-2xl md:text-3xl font-bold text-foreground">₹{product.offer_price!.toFixed(2)}</span>
                    <span className="text-lg text-muted-foreground line-through">₹{product.price.toFixed(2)}</span>
                    <Badge className="bg-red-100 text-red-800">
                      <Tag className="h-3 w-3 mr-1" />
                      {discountPercent}% OFF
                    </Badge>
                  </>
                ) : (
                  <span className="text-2xl md:text-3xl font-bold text-foreground">₹{product.price.toFixed(2)}</span>
                )}
              </div>
              {hasDiscount && (
                <p className="text-sm text-green-600 font-medium">
                  You save ₹{(product.price - product.offer_price!).toFixed(2)}
                </p>
              )}
            </div>

            {/* Loyalty Coins Display */}
            <DualCoinsDisplay
              productId={product.id}
              productName={product.name}
              productPrice={product.price}
              offerPrice={product.offer_price}
              mode="detail"
              onCoinRedeem={(coinsRequired) => {
                toast.info(`Coin redemption feature coming soon! Required: ${coinsRequired} coins`);
              }}
            />

            {/* Quantity Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quantity</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="h-10 w-10 p-0"
                >
                  -
                </Button>
                <span className="w-12 text-center font-medium text-lg">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  disabled={quantity >= product.stock_quantity}
                  className="h-10 w-10 p-0"
                >
                  +
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={product.stock_quantity === 0}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleShare}
                  className="px-4"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
              
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button 
                  size="lg" 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={product.stock_quantity === 0}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Order on WhatsApp
                </Button>
              </a>
              
              {product.stock_quantity === 0 && (
                <p className="text-sm text-red-600 text-center">
                  This product is currently out of stock. Contact us for availability.
                </p>
              )}
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <Truck className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-xs font-medium">Free Delivery</p>
                <p className="text-xs text-muted-foreground">On orders above ₹50</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-xs font-medium">Warranty</p>
                <p className="text-xs text-muted-foreground">Manufacturer warranty</p>
              </div>
              <div className="text-center">
                <MessageCircle className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-xs font-medium">Support</p>
                <p className="text-xs text-muted-foreground">24/7 customer care</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        {product.description && (
          <Card className="mb-16">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Product Description</h2>
              <div className="prose max-w-none">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Related Products</h2>
              <Link to="/products">
                <Button variant="outline">View All Products</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts
                .filter(p => p.id !== product.id)
                .slice(0, 4)
                .map((relatedProduct) => (
                  <ProductCard key={relatedProduct.id} product={relatedProduct} />
                ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ProductDetail;