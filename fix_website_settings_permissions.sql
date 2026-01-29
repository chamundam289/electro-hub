-- Fix website_settings table permissions

-- Enable RLS if not already enabled
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.website_settings;
DROP POLICY IF EXISTS "Allow full access for service role" ON public.website_settings;

-- Create new policies
CREATE POLICY "Allow full access for authenticated users" ON public.website_settings 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access for service role" ON public.website_settings 
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Also allow anonymous read access for website settings (needed for public pages)
CREATE POLICY "Allow read access for anonymous users" ON public.website_settings 
FOR SELECT TO anon USING (true);