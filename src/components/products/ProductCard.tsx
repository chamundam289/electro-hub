import { Link } from 'react-router-dom';
import { MessageCircle, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/hooks/useProducts';
import { useStoreSettings } from '@/hooks/useStoreSettings';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { data: settings } = useStoreSettings();
  
  const hasDiscount = product.offer_price && product.offer_price < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.offer_price!) / product.price) * 100)
    : 0;

  const whatsappNumber = settings?.whatsapp_number?.replace(/\D/g, '') || '';
  const productUrl = `${window.location.origin}/products/${product.slug}`;
  const whatsappMessage = encodeURIComponent(
    `Hi! I'm interested in ordering:\n\n*${product.name}*\nPrice: $${(product.offer_price || product.price).toFixed(2)}\n\nProduct Link: ${productUrl}`
  );
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="product-card group">
      {/* Image */}
      <Link to={`/products/${product.slug}`} className="block relative aspect-square overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No image</span>
          </div>
        )}
        
        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 badge-sale">
            <Tag className="w-3 h-3 mr-1" />
            {discountPercent}% OFF
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Category */}
        {product.categories && (
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {product.categories.name}
          </span>
        )}

        {/* Name */}
        <Link to={`/products/${product.slug}`}>
          <h3 className="font-display font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Description */}
        {product.short_description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.short_description}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          {hasDiscount ? (
            <>
              <span className="price-offer">${product.offer_price!.toFixed(2)}</span>
              <span className="price-original">${product.price.toFixed(2)}</span>
            </>
          ) : (
            <span className="price-current">${product.price.toFixed(2)}</span>
          )}
        </div>

        {/* WhatsApp Button */}
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-btn w-full"
        >
          <MessageCircle className="w-4 h-4" />
          Order on WhatsApp
        </a>
      </div>
    </div>
  );
}