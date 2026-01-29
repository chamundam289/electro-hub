-- Add order_source column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_source TEXT DEFAULT 'ecommerce';

-- Update existing orders to have 'ecommerce' as default source
UPDATE public.orders 
SET order_source = 'ecommerce' 
WHERE order_source IS NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.orders.order_source IS 'Source of the order: pos (Point of Sale), ecommerce (Online Store), manual (Manual Entry)';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_order_source ON public.orders(order_source);