-- Simple popup setup - Run this in Supabase SQL Editor
-- This will create website settings with popup enabled

-- First, ensure the table exists with all required columns
CREATE TABLE IF NOT EXISTS public.website_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID,
    shop_name TEXT,
    shop_logo_url TEXT,
    shop_description TEXT,
    shop_address TEXT,
    shop_phone TEXT,
    shop_email TEXT,
    social_links_json JSONB DEFAULT '{}'::jsonb,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    google_map_iframe_url TEXT,
    popup_enabled BOOLEAN DEFAULT false,
    popup_image_url TEXT,
    whatsapp_number TEXT,
    product_inquiry_template TEXT,
    floating_button_template TEXT,
    offer_popup_template TEXT,
    navbar_json JSONB DEFAULT '[]'::jsonb,
    hero_json JSONB DEFAULT '{}'::jsonb,
    footer_text TEXT,
    primary_color TEXT DEFAULT '#000000',
    secondary_color TEXT DEFAULT '#ffffff',
    maintenance_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Delete any existing settings to start fresh
DELETE FROM public.website_settings;

-- Insert default settings with popup enabled
INSERT INTO public.website_settings (
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
    popup_image_url,
    primary_color,
    secondary_color,
    maintenance_mode
) VALUES (
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
    'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&h=300&fit=crop',
    '#000000',
    '#ffffff',
    false
);

-- Verify the data
SELECT 
    shop_name,
    popup_enabled,
    popup_image_url,
    whatsapp_number,
    offer_popup_template
FROM public.website_settings 
LIMIT 1;