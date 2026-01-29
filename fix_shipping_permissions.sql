-- Fix shipping table permissions for authenticated users

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.shipping_providers;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.shipping_zones;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.shipments;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.shipping_tracking;

DROP POLICY IF EXISTS "Allow full access for service role" ON public.shipping_providers;
DROP POLICY IF EXISTS "Allow full access for service role" ON public.shipping_zones;
DROP POLICY IF EXISTS "Allow full access for service role" ON public.shipments;
DROP POLICY IF EXISTS "Allow full access for service role" ON public.shipping_tracking;

-- Create new policies that allow authenticated users full access
CREATE POLICY "Allow full access for authenticated users" ON public.shipping_providers 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access for authenticated users" ON public.shipping_zones 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access for authenticated users" ON public.shipments 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access for authenticated users" ON public.shipping_tracking 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Also allow service role full access
CREATE POLICY "Allow full access for service role" ON public.shipping_providers 
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access for service role" ON public.shipping_zones 
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access for service role" ON public.shipments 
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access for service role" ON public.shipping_tracking 
FOR ALL TO service_role USING (true) WITH CHECK (true);