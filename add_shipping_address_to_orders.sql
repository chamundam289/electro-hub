-- Add shipping address fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_name TEXT,
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS shipping_city TEXT,
ADD COLUMN IF NOT EXISTS shipping_zipcode TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery DATE;

-- Add order number field for user-friendly order tracking
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;

-- Create index for faster order lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);