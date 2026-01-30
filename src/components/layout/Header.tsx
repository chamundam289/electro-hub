import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Zap, MessageCircle, User, LogIn, Search, ShoppingCart, Heart, Package, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAffiliateStatus } from '@/hooks/useAffiliateStatus';
import UserProfile from '@/components/auth/UserProfile';
import UserMenuMobile from '@/components/auth/UserMenuMobile';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/orders', label: 'Orders' },
  { href: '/offers', label: 'Offers' },
  { href: '/services', label: 'Services' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { settings, getFloatingButtonLink } = useWebsiteSettings();
  const { user, loading } = useAuth();
  const { getTotalItems: getCartCount } = useCart();
  const { getTotalItems: getWishlistCount } = useWishlist();
  const { isAffiliate, affiliateData } = useAffiliateStatus();

  const cartCount = getCartCount();
  const wishlistCount = getWishlistCount();

  const handleWhatsAppClick = () => {
    const link = getFloatingButtonLink();
    if (link !== '#') {
      window.open(link, '_blank');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white backdrop-blur supports-[backdrop-filter]:bg-white/95">
      <div className="container-fluid">
        <div className="flex h-16 items-center justify-between">
          {/* Left Side - Logo and Affiliate Profile */}
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              {settings?.shop_logo_url ? (
                <img 
                  src={settings.shop_logo_url} 
                  alt={settings.shop_name || 'Logo'} 
                  className="h-10 w-10 object-contain rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-primary ${settings?.shop_logo_url ? 'hidden' : ''}`}>
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors hidden sm:block">
                {settings?.shop_name || 'ElectroStore'}
              </span>
            </Link>

            {/* Affiliate Profile Icon - Only show if user is affiliate */}
            {isAffiliate && user && (
              <Link 
                to="/affiliate/profile" 
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 transition-colors group"
                title="Affiliate Profile"
              >
                <div className="relative">
                  {affiliateData?.profile_image_url ? (
                    <img 
                      src={affiliateData.profile_image_url} 
                      alt="Affiliate Profile" 
                      className="h-8 w-8 rounded-full object-cover border-2 border-blue-200 group-hover:border-blue-400 transition-colors"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-blue-100 border-2 border-blue-200 group-hover:border-blue-400 flex items-center justify-center transition-colors">
                      <UserCircle className="h-5 w-5 text-blue-600" />
                    </div>
                  )}
                  {/* Online indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-blue-700 group-hover:text-blue-800 hidden lg:block">
                  {affiliateData?.full_name || 'Affiliate'}
                </span>
              </Link>
            )}
          </div>

          {/* Mobile Header Actions */}
          <div className="flex items-center gap-2 md:hidden">
            <Link to="/products" className="p-2">
              <Search className="h-5 w-5 text-gray-600" />
            </Link>
            <Link to="/cart" className="p-2 relative">
              <ShoppingCart className="h-5 w-5 text-gray-600" />
              {cartCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {cartCount > 99 ? '99+' : cartCount}
                </Badge>
              )}
            </Link>
            <Link to="/wishlist" className="p-2 relative">
              <Heart className="h-5 w-5 text-gray-600" />
              {wishlistCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </Badge>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === link.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {settings?.whatsapp_number && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleWhatsAppClick}
                className="items-center gap-2 text-sm font-medium text-muted-foreground hover:text-green-600 hover:bg-green-50 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp</span>
              </Button>
            )}

            <Link to="/orders" className="relative">
              <Button variant="ghost" size="icon" title="Orders">
                <Package className="h-5 w-5" />
              </Button>
            </Link>

            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon" title="Cart">
                <ShoppingCart className="h-5 w-5" />
              </Button>
              {cartCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {cartCount > 99 ? '99+' : cartCount}
                </Badge>
              )}
            </Link>

            <Link to="/wishlist" className="relative">
              <Button variant="ghost" size="icon" title="Wishlist">
                <Heart className="h-5 w-5" />
              </Button>
              {wishlistCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </Badge>
              )}
            </Link>

            {loading ? (
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user ? (
              <UserProfile />
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Button>
              </Link>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-1">
              {/* Affiliate Profile Link - Mobile */}
              {isAffiliate && user && (
                <Link
                  to="/affiliate/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border-b border-border mb-2"
                >
                  <div className="relative">
                    {affiliateData?.profile_image_url ? (
                      <img 
                        src={affiliateData.profile_image_url} 
                        alt="Affiliate Profile" 
                        className="h-8 w-8 rounded-full object-cover border-2 border-blue-200"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center">
                        <UserCircle className="h-5 w-5 text-blue-600" />
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div>
                    <div className="font-medium">Affiliate Profile</div>
                    <div className="text-xs text-gray-500">{affiliateData?.full_name || 'Manage your profile'}</div>
                  </div>
                </Link>
              )}

              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === link.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Mobile User Auth */}
              <div className="px-4 py-2 border-t border-border mt-2 pt-4">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : user ? (
                  <UserMenuMobile onClose={() => setIsMenuOpen(false)} />
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Login</span>
                  </Link>
                )}
              </div>

              {settings?.whatsapp_number && (
                <button
                  onClick={() => {
                    handleWhatsAppClick();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp</span>
                </button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}