-- Create shipping_providers table
CREATE TABLE IF NOT EXISTS public.shipping_providers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    api_endpoint TEXT,
    api_key TEXT,
    is_active BOOLEAN DEFAULT true,
    base_rate DECIMAL(10,2) DEFAULT 0.00,
    per_kg_rate DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shipping_zones table
CREATE TABLE IF NOT EXISTS public.shipping_zones (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    countries TEXT[] DEFAULT '{}',
    states TEXT[] DEFAULT '{}',
    cities TEXT[] DEFAULT '{}',
    zip_codes TEXT[] DEFAULT '{}',
    base_rate DECIMAL(10,2) DEFAULT 0.00,
    per_kg_rate DECIMAL(10,2) DEFAULT 0.00,
    estimated_days_min INTEGER DEFAULT 1,
    estimated_days_max INTEGER DEFAULT 7,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shipments table
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    shipping_provider_id UUID REFERENCES public.shipping_providers(id) ON DELETE SET NULL,
    shipping_zone_id UUID REFERENCES public.shipping_zones(id) ON DELETE SET NULL,
    tracking_number TEXT UNIQUE,
    shipping_label_url TEXT,
    status TEXT DEFAULT 'pending',
    weight_kg DECIMAL(8,2),
    dimensions_length DECIMAL(8,2),
    dimensions_width DECIMAL(8,2),
    dimensions_height DECIMAL(8,2),
    shipping_cost DECIMAL(10,2) DEFAULT 0.00,
    insurance_cost DECIMAL(10,2) DEFAULT 0.00,
    total_cost DECIMAL(10,2) DEFAULT 0.00,
    pickup_date DATE,
    estimated_delivery_date DATE,
    actual_delivery_date DATE,
    pickup_address TEXT,
    delivery_address TEXT,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shipping_tracking table
CREATE TABLE IF NOT EXISTS public.shipping_tracking (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    location TEXT,
    description TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default shipping providers
INSERT INTO public.shipping_providers (name, code, contact_email, contact_phone, base_rate, per_kg_rate) VALUES
('FedEx', 'FEDEX', 'support@fedex.com', '+1-800-463-3339', 15.00, 2.50),
('UPS', 'UPS', 'support@ups.com', '+1-800-742-5877', 12.00, 2.00),
('DHL', 'DHL', 'support@dhl.com', '+1-800-225-5345', 18.00, 3.00),
('USPS', 'USPS', 'support@usps.com', '+1-800-275-8777', 8.00, 1.50),
('Local Delivery', 'LOCAL', 'delivery@electrostore.com', '+1234567890', 5.00, 0.50)
ON CONFLICT (code) DO NOTHING;

-- Insert default shipping zones
INSERT INTO public.shipping_zones (name, code, countries, base_rate, per_kg_rate, estimated_days_min, estimated_days_max) VALUES
('Local', 'LOCAL', '{"USA"}', 5.00, 0.50, 1, 2),
('Domestic', 'DOMESTIC', '{"USA"}', 10.00, 1.50, 3, 7),
('International', 'INTL', '{"Canada", "Mexico", "UK", "Germany", "France", "Australia"}', 25.00, 5.00, 7, 21)
ON CONFLICT (code) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON public.shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipping_tracking_shipment_id ON public.shipping_tracking(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipping_tracking_timestamp ON public.shipping_tracking(timestamp);

-- Add RLS policies
ALTER TABLE public.shipping_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_tracking ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "Allow read access for authenticated users" ON public.shipping_providers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON public.shipping_zones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON public.shipments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON public.shipping_tracking FOR SELECT TO authenticated USING (true);

-- Allow full access for service role (admin operations)
CREATE POLICY "Allow full access for service role" ON public.shipping_providers FOR ALL TO service_role USING (true);
CREATE POLICY "Allow full access for service role" ON public.shipping_zones FOR ALL TO service_role USING (true);
CREATE POLICY "Allow full access for service role" ON public.shipments FOR ALL TO service_role USING (true);
CREATE POLICY "Allow full access for service role" ON public.shipping_tracking FOR ALL TO service_role USING (true);