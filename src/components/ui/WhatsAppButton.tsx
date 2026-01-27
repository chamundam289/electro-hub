import { MessageCircle } from 'lucide-react';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';

export function WhatsAppButton() {
  const { settings, getFloatingButtonLink } = useWebsiteSettings();

  if (!settings?.whatsapp_number) {
    return null;
  }

  const handleClick = () => {
    const link = getFloatingButtonLink();
    if (link !== '#') {
      window.open(link, '_blank');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all hover:bg-green-600 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
}