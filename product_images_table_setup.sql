-- ============================================
-- 🖼️ PRODUCT MULTIPLE IMAGES SYSTEM SETUP
-- ============================================

-- Create product_images table for multiple images per product
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_alt TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_display_order ON public.product_images(product_id, display_order);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON public.product_images(product_id, is_primary);

-- Enable RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view product images" ON public.product_images
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert product images" ON public.product_images
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update product images" ON public.product_images
    FOR UPDATE USING (true);

CREATE POLICY "Admins can delete product images" ON public.product_images
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@electrostore.com', 'chamundam289@gmail.com')
        )
    );

-- Grant permissions
GRANT ALL ON public.product_images TO anon, authenticated;

-- Function to ensure only one primary image per product
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this image as primary, unset all other primary images for this product
    IF NEW.is_primary = true THEN
        UPDATE public.product_images 
        SET is_primary = false 
        WHERE product_id = NEW.product_id 
          AND id != NEW.id;
    END IF;
    
    -- If no primary image exists for this product, make this one primary
    IF NOT EXISTS (
        SELECT 1 FROM public.product_images 
        WHERE product_id = NEW.product_id 
          AND is_primary = true 
          AND id != NEW.id
    ) THEN
        NEW.is_primary = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_ensure_single_primary_image ON public.product_images;
CREATE TRIGGER trigger_ensure_single_primary_image
    BEFORE INSERT OR UPDATE ON public.product_images
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_image();

-- Migrate existing product images to new table
INSERT INTO public.product_images (product_id, image_url, is_primary, display_order)
SELECT 
    id as product_id,
    image_url,
    true as is_primary,
    0 as display_order
FROM public.products 
WHERE image_url IS NOT NULL 
  AND image_url != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images 
    WHERE product_id = products.id
  );

-- Show migration results
SELECT 
    'Migration Complete' as status,
    COUNT(*) as images_migrated
FROM public.product_images;

COMMENT ON TABLE public.product_images IS 'Stores multiple images for each product with ordering and primary image support';