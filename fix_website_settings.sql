-- Fix website settings table and add missing column
-- Run this in Supabase SQL Editor

-- Add shop_description column if it doesn't exist
ALTER TABLE public.website_settings 
ADD COLUMN IF NOT EXISTS shop_description TEXT;

-- Update existing records with default description
UPDATE public.website_settings 
SET shop_description = 'Your one-stop shop for the latest electronics and gadgets. Quality products, competitive prices, exceptional service.'
WHERE shop_description IS NULL OR shop_description = '';

-- Ensure default website settings exist
INSERT INTO public.website_settings (
    business_id, 
    shop_name, 
    shop_description,
    shop_address, 
    shop_phone, 
    shop_email,
    whatsapp_number,
    footer_text,
    product_inquiry_template,
    floating_button_template,
    offer_popup_template,
    social_links_json,
    popup_enabled,
    popup_image_url
) 
SELECT 
    b.id,
    'Electro Hub',
    'Your one-stop shop for the latest electronics and gadgets. Quality products, competitive prices, exceptional service.',
    'Your Shop Address Here',
    '+1234567890',
    'info@electrohub.com',
    '+1234567890',
    '© 2024 Electro Hub. All rights reserved.',
    'Hi! I''m interested in this product: {{product_name}}. Can you provide more details?',
    'Hi! I need help with your products and services.',
    'Hi! I saw your special offer and I''m interested. Can you tell me more?',
    '{}'::jsonb,
    true,
    'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&h=300&fit=crop'
FROM public.businesses b 
WHERE NOT EXISTS (SELECT 1 FROM public.website_settings WHERE business_id = b.id)
ON CONFLICT (business_id) DO NOTHING;

-- Verify the data
SELECT * FROM public.website_settings LIMIT 1;