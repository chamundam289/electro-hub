import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';

interface ProductInquiryButtonProps {
  productName: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ProductInquiryButton({ 
  productName, 
  variant = 'default', 
  size = 'default',
  className = '' 
}: ProductInquiryButtonProps) {
  const { settings, getProductInquiryLink } = useWebsiteSettings();

  if (!settings?.whatsapp_number) {
    return null;
  }

  const handleClick = () => {
    const link = getProductInquiryLink(productName);
    if (link !== '#') {
      window.open(link, '_blank');
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={`gap-2 ${className}`}
    >
      <MessageSquare className="h-4 w-4" />
      Inquire on WhatsApp
    </Button>
  );
}