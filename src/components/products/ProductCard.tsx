import { Link } from 'react-router-dom';
import { MessageCircle, Tag, Heart, ShoppingCart, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/hooks/useProducts';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLoyaltyCoins } from '@/hooks/useLoyaltyCoins';
import { DualCoinsDisplay } from '@/components/loyalty/DualCoinsDisplay';
import { ProductImageGallery } from '@/components/ui/ProductImageGallery';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { data: settings } = useStoreSettings();
  const { addItem: addToWishlist, isInWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();
  const { user } = useAuth();
  const { isSystemEnabled } = useLoyaltyCoins();
  
  const hasDiscount = product.offer_price && product.offer_price < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.offer_price!) / product.price) * 100)
    : 0;
  
  const finalPrice = product.offer_price || product.price;

  const whatsappNumber = settings?.whatsapp_number?.replace(/\D/g, '') || '';
  const productUrl = `${window.location.origin}/products/${product.slug}`;
  const whatsappMessage = encodeURIComponent(
    `Hi! I'm interested in ordering:\n\n*${product.name}*\nPrice: ₹${(product.offer_price || product.price).toFixed(2)}\n\nProduct Link: ${productUrl}`
  );
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  const handleAddToWishlist = () => {
    if (!user) {
      toast.error('Please login to add items to wishlist', {
        action: {
          label: 'Login',
          onClick: () => window.location.href = '/login'
        }
      });
      return;
    }

    addToWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      offer_price: product.offer_price,
      image_url: product.image_url,
      slug: product.slug,
      stock_quantity: product.stock_quantity
    });
  };

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add items to cart', {
        action: {
          label: 'Login',
          onClick: () => window.location.href = '/login'
        }
      });
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      offer_price: product.offer_price,
      image_url: product.image_url,
      stock_quantity: product.stock_quantity,
      slug: product.slug
    });
  };

  const isWishlisted = user ? isInWishlist(product.id) : false;

  return (
    <div className="product-card group bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Image Gallery */}
      <Link to={`/products/${product.slug}`} className="block relative aspect-square overflow-hidden">
        <ProductImageGallery
          productId={product.id}
          productName={product.name}
          fallbackImage={product.image_url}
          showThumbnails={false}
          maxHeight="h-full"
          className="w-full h-full"
        />
        
        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold z-10">
            {discountPercent}% OFF
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            handleAddToWishlist();
          }}
          className={`absolute bottom-2 right-2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm transition-colors z-10 ${
            isWishlisted ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </Link>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Category */}
        {product.categories && (
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {product.categories.name}
          </span>
        )}

        {/* Name */}
        <Link to={`/products/${product.slug}`}>
          <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-primary transition-colors text-sm">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center gap-2">
          {hasDiscount ? (
            <>
              <span className="text-lg font-bold text-gray-900">₹{product.offer_price!.toFixed(2)}</span>
              <span className="text-sm text-gray-500 line-through">₹{product.price.toFixed(2)}</span>
            </>
          ) : (
            <span className="text-lg font-bold text-gray-900">₹{product.price.toFixed(2)}</span>
          )}
        </div>

        {/* Rating (placeholder) */}
        <div className="flex items-center gap-1">
          <div className="flex text-yellow-400">
            {'★'.repeat(4)}{'☆'.repeat(1)}
          </div>
          <span className="text-xs text-gray-500">(4.0)</span>
        </div>

        {/* Loyalty Coins Info */}
        <DualCoinsDisplay
          productId={product.id}
          productName={product.name}
          productPrice={product.price}
          offerPrice={product.offer_price}
          mode="card"
        />

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="w-3 h-3 mr-1" />
            Add to Cart
          </Button>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button size="sm" className="w-full h-8 text-xs bg-green-600 hover:bg-green-700">
              <MessageCircle className="w-3 h-3 mr-1" />
              WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}