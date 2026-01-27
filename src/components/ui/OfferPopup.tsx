import { useState, useEffect } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import { Button } from '@/components/ui/button';

export function OfferPopup() {
  const { settings, getOfferPopupLink } = useWebsiteSettings();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Temporary debug logging
    console.log('🎯 OfferPopup Debug:', {
      popup_enabled: settings?.popup_enabled,
      popup_image_url: settings?.popup_image_url,
      whatsapp_number: settings?.whatsapp_number,
      settings_loaded: !!settings
    });

    // Check if popup is enabled
    if (!settings?.popup_enabled) {
      console.log('❌ Popup blocked: popup not enabled');
      return;
    }

    // Show popup after 3 seconds - EVERY TIME on page refresh/reload
    console.log('⏰ Setting popup timer for 3 seconds...');
    const timer = setTimeout(() => {
      console.log('🚀 Timer fired - showing popup!');
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [settings?.popup_enabled, settings]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleWhatsAppClick = () => {
    const link = getOfferPopupLink();
    if (link !== '#') {
      window.open(link, '_blank');
    }
    handleClose();
  };

  // Don't render if popup is disabled, not visible, no image, or no WhatsApp number
  if (!settings?.popup_enabled || !isVisible || !settings?.popup_image_url || !settings?.whatsapp_number) {
    console.log('🚫 Popup render blocked:', {
      popup_enabled: settings?.popup_enabled,
      isVisible,
      has_image: !!settings?.popup_image_url,
      has_whatsapp: !!settings?.whatsapp_number
    });
    return null;
  }

  console.log('✅ Rendering popup now!');

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={handleClose}
      />
      
      {/* Popup - Bottom Center */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
        <div className="bg-white rounded-2xl shadow-2xl w-80 max-w-[90vw] mx-4 overflow-hidden">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
            aria-label="Close popup"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Offer Image */}
          <div className="relative">
            <img
              src={settings.popup_image_url}
              alt="Special Offer"
              className="w-full h-48 object-cover"
              onError={(e) => {
                handleClose();
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="p-4">
            <div className="flex gap-3">
              <Button
                onClick={handleWhatsAppClick}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2 font-semibold py-3 rounded-lg"
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp
              </Button>
              <Button
                onClick={handleClose}
                variant="outline"
                className="px-6 font-medium py-3 rounded-lg border-2"
              >
                Later
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}