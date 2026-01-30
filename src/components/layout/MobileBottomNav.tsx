import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, Heart, User, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';

export function MobileBottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { getTotalItems: getCartCount } = useCart();
  const { getTotalItems: getWishlistCount } = useWishlist();

  const cartCount = getCartCount();
  const wishlistCount = getWishlistCount();

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      href: '/',
      badge: null
    },
    {
      icon: Search,
      label: 'Search',
      href: '/products',
      badge: null
    },
    {
      icon: ShoppingCart,
      label: 'Cart',
      href: '/cart',
      badge: cartCount > 0 ? cartCount : null
    },
    {
      icon: Heart,
      label: 'Wishlist',
      href: '/wishlist',
      badge: wishlistCount > 0 ? wishlistCount : null
    },
    {
      icon: User,
      label: user ? 'Profile' : 'Login',
      href: user ? '/profile' : '/login',
      badge: null
    }
  ];

  // Don't show on admin or affiliate pages
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/affiliate')) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden safe-area-bottom backdrop-blur-md bg-white/95">
      <nav className="flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center justify-center p-2 min-w-0 flex-1 relative transition-all duration-200 rounded-lg mx-1 ${
                isActive 
                  ? 'text-primary bg-primary/5' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="relative">
                <Icon 
                  className={`h-6 w-6 transition-all duration-200 ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`} 
                />
                {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs min-w-5 animate-scale-in"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span 
                className={`text-xs mt-1 font-medium transition-all duration-200 ${
                  isActive ? 'text-primary scale-105' : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-scale-in" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}