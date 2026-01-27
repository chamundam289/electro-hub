# How to Enable Offer Popup Dialog - Shows on Every Refresh

## ✅ Current Behavior:
- Popup shows **EVERY TIME** website is refreshed/reloaded
- Appears after 3 seconds
- No session storage restrictions
- Shows at bottom center with Image + WhatsApp + Later buttons

## Step 1: Database Setup
Run this SQL script in your Supabase SQL Editor:

```sql
-- Simple popup setup
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

-- Insert default settings with popup enabled
INSERT INTO public.website_settings (
    shop_name,
    whatsapp_number,
    offer_popup_template,
    popup_enabled,
    popup_image_url
) VALUES (
    'Electro Hub',
    '+1234567890',
    'Hi! I saw your special offer and I''m interested. Can you tell me more?',
    true,
    'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&h=300&fit=crop'
) ON CONFLICT (id) DO UPDATE SET
    popup_enabled = true,
    popup_image_url = 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&h=300&fit=crop',
    whatsapp_number = '+1234567890';
```

## Step 2: Test Every Refresh
1. Open website
2. Wait 3 seconds - popup should appear
3. Close popup (click X or Later)
4. **Refresh page (F5 or Ctrl+R)**
5. Wait 3 seconds - popup should appear again
6. **Repeat refresh test** - popup shows every time

## Step 3: Check Browser Console
1. Press F12 to open Developer Tools
2. Go to Console tab
3. Look for these messages on every refresh:
   - "🔄 Fetching website settings..."
   - "✅ Settings loaded from database:"
   - "🎯 OfferPopup Debug:"
   - "⏰ Setting popup timer for 3 seconds..."
   - "🚀 Timer fired - showing popup!"

## Step 4: Admin Configuration (Alternative)
1. Go to `/admin` and login
2. Navigate to Website Settings
3. Go to Popup tab
4. Turn ON "Enable Popup Banner"
5. Add image URL
6. Go to WhatsApp tab
7. Set WhatsApp number
8. Save settings

## Expected Behavior:
- ✅ Popup appears after 3 seconds on EVERY page load/refresh
- ✅ Shows at bottom center
- ✅ Contains: Image + WhatsApp Button + Later Button
- ✅ No session storage restrictions
- ✅ Works on every browser refresh/reload

## Troubleshooting:
If popup doesn't show on refresh, check console for:
- "❌ Popup blocked: popup not enabled" - Enable in admin settings
- "🚫 Popup render blocked:" - Missing image URL or WhatsApp number
- Database connection errors - Run the SQL script above