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
      activeColor: 'text-primary'
    },
    {
      icon: Search,
      label: 'Products',
      href: '/products',
      activeColor: 'text-primary'
    },
    {
      icon: Package,
      label: 'Orders',
      href: '/orders',
      activeColor: 'text-primary'
    },
    {
      icon: ShoppingCart,
      label: 'Cart',
      href: '/cart',
      activeColor: 'text-primary',
      badge: cartCount
    },
    {
      icon: User,
      label: 'Profile',
      href: '/profile',
      activeColor: 'text-primary'
    }
  ];

  // Don't show on admin pages
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border md:hidden">
      <nav className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          // For profile, redirect to login if not authenticated
          const href = item.href === '/profile' && !user ? '/login' : item.href;
          
          return (
            <Link
              key={item.href}
              to={href}
              className="flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 relative"
            >
              <div className="relative">
                <Icon 
                  className={`h-6 w-6 ${
                    isActive 
                      ? item.activeColor 
                      : 'text-muted-foreground'
                  }`} 
                />
                {item.badge && item.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span 
                className={`text-xs mt-1 font-medium ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}