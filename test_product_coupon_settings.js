// Test script to check and create product_coupon_settings table
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xeufezbuuccohiardtrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testProductCouponSettings() {
  console.log('🧪 Testing Product Coupon Settings Table...\n');
  
  try {
    console.log('🔍 Checking if product_coupon_settings table exists...');
    
    const { data, error } = await supabase
      .from('product_coupon_settings')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01' || error.message?.includes('relation')) {
        console.log('❌ Table product_coupon_settings does not exist');
        console.log('📝 Creating table manually...');
        
        // Create the table using individual operations
        await createTableManually();
      } else {
        console.log('⚠️  Table exists but there might be permission issues:', error.message);
      }
    } else {
      console.log('✅ Table product_coupon_settings exists and accessible');
      console.log(`📊 Found ${data?.length || 0} existing records`);
    }
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

async function createTableManually() {
  console.log('🔨 Creating product_coupon_settings table manually...');
  
  // Since we can't execute DDL directly, let's create some sample data
  // and let the application handle the table creation
  console.log('⚠️  Cannot create table directly with anon key.');
  console.log('📋 Please run this SQL in Supabase Dashboard → SQL Editor:');
  console.log(`
-- Create product_coupon_settings table
CREATE TABLE IF NOT EXISTS public.product_coupon_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL UNIQUE,
    is_coupon_eligible BOOLEAN DEFAULT true,
    max_coupon_discount DECIMAL(5,2) DEFAULT 0,
    coupon_categories TEXT,
    allow_coupon_stacking BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT fk_product_coupon_settings_product 
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_coupon_settings_product ON public.product_coupon_settings(product_id);
CREATE INDEX IF NOT EXISTS idx_product_coupon_settings_eligible ON public.product_coupon_settings(is_coupon_eligible);

-- Enable RLS
ALTER TABLE public.product_coupon_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view product coupon settings" ON public.product_coupon_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage product coupon settings" ON public.product_coupon_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@electrostore.com', 'chamundam289@gmail.com')
        )
    );

-- Grant permissions
GRANT SELECT ON public.product_coupon_settings TO authenticated, anon;
GRANT ALL ON public.product_coupon_settings TO service_role;
  `);
}

// Run the test
testProductCouponSettings().catch(console.error);