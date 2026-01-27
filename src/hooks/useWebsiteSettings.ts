import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WebsiteSettings {
  id?: string;
  business_id?: string;
  shop_name?: string;
  shop_logo_url?: string;
  shop_address?: string;
  shop_phone?: string;
  shop_email?: string;
  social_links_json?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    linkedin?: string;
  };
  latitude?: number;
  longitude?: number;
  google_map_iframe_url?: string;
  popup_enabled?: boolean;
  popup_image_url?: string;
  whatsapp_number?: string;
  product_inquiry_template?: string;
  floating_button_template?: string;
  offer_popup_template?: string;
  navbar_json?: any;
  hero_json?: any;
  footer_text?: string;
  primary_color?: string;
  secondary_color?: string;
  maintenance_mode?: boolean;
}

export const useWebsiteSettings = () => {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('website_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      } else {
        // Set default settings if none exist
        setSettings({
          shop_name: 'Electro Hub',
          shop_address: 'Your Shop Address Here',
          shop_phone: '+1234567890',
          shop_email: 'info@electrohub.com',
          social_links_json: {},
          whatsapp_number: '+1234567890',
          product_inquiry_template: "Hi! I'm interested in this product: {{product_name}}. Can you provide more details?",
          floating_button_template: "Hi! I need help with your products and services.",
          offer_popup_template: "Hi! I saw your special offer and I'm interested. Can you tell me more?",
          footer_text: '© 2024 Electro Hub. All rights reserved.',
          primary_color: '#000000',
          secondary_color: '#ffffff',
          popup_enabled: false,
          maintenance_mode: false
        });
      }
    } catch (err: any) {
      console.error('Error fetching website settings:', err);
      setError(err.message);
      // Set default settings on error
      setSettings({
        shop_name: 'Electro Hub',
        shop_address: 'Your Shop Address Here',
        shop_phone: '+1234567890',
        shop_email: 'info@electrohub.com',
        social_links_json: {},
        whatsapp_number: '+1234567890',
        product_inquiry_template: "Hi! I'm interested in this product: {{product_name}}. Can you provide more details?",
        floating_button_template: "Hi! I need help with your products and services.",
        offer_popup_template: "Hi! I saw your special offer and I'm interested. Can you tell me more?",
        footer_text: '© 2024 Electro Hub. All rights reserved.',
        primary_color: '#000000',
        secondary_color: '#ffffff',
        popup_enabled: false,
        maintenance_mode: false
      });
    } finally {
      setLoading(false);
    }
  };

  const getWhatsAppLink = (message: string, productName?: string) => {
    if (!settings?.whatsapp_number) return '#';
    
    let finalMessage = message;
    if (productName && message.includes('{{product_name}}')) {
      finalMessage = message.replace('{{product_name}}', productName);
    }
    
    const encodedMessage = encodeURIComponent(finalMessage);
    const cleanNumber = settings.whatsapp_number.replace(/[^\d]/g, '');
    
    return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
  };

  const getProductInquiryLink = (productName: string) => {
    const template = settings?.product_inquiry_template || "Hi! I'm interested in this product: {{product_name}}. Can you provide more details?";
    return getWhatsAppLink(template, productName);
  };

  const getFloatingButtonLink = () => {
    const template = settings?.floating_button_template || "Hi! I need help with your products and services.";
    return getWhatsAppLink(template);
  };

  const getOfferPopupLink = () => {
    const template = settings?.offer_popup_template || "Hi! I saw your special offer and I'm interested. Can you tell me more?";
    return getWhatsAppLink(template);
  };

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
    getWhatsAppLink,
    getProductInquiryLink,
    getFloatingButtonLink,
    getOfferPopupLink
  };
};