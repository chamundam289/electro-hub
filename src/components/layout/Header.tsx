import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Zap, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/offers', label: 'Offers' },
  { href: '/services', label: 'Services' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { settings, getFloatingButtonLink } = useWebsiteSettings();

  const handleWhatsAppClick = () => {
    const link = getFloatingButtonLink();
    if (link !== '#') {
      window.open(link, '_blank');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-fluid">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            {settings?.shop_logo_url ? (
              <img 
                src={settings.shop_logo_url} 
                alt={settings.shop_name || 'Logo'} 
                className="h-10 w-10 object-contain rounded-lg"
                onError={(e) => {
                  // Fallback to default icon if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-primary ${settings?.shop_logo_url ? 'hidden' : ''}`}>
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors">
              {settings?.shop_name || 'ElectroStore'}
            </span>
          </Link>

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

          {/* WhatsApp & Mobile Menu */}
          <div className="flex items-center gap-3">
            {settings?.whatsapp_number && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleWhatsAppClick}
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-green-600 hover:bg-green-50 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp</span>
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-1">
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