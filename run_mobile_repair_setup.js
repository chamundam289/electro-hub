// Run mobile repair database setup
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://xeufezbuuccohiardtrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runMobileRepairSetup() {
  console.log('🔧 Setting up Mobile Repair Service Database...\n');
  
  try {
    // Test if tables exist
    console.log('📋 Checking if mobile repair tables exist...');
    
    const tables = ['repair_requests', 'repair_images', 'repair_quotations', 'repair_status_logs'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error && (error.code === '42P01' || error.message?.includes('relation'))) {
          console.log(`❌ Table ${table} does not exist`);
        } else {
          console.log(`✅ Table ${table} exists`);
        }
      } catch (err) {
        console.log(`❌ Error checking ${table}: ${err.message}`);
      }
    }
    
    console.log('\n📝 To create the mobile repair tables:');
    console.log('1. Open Supabase Dashboard → SQL Editor');
    console.log('2. Copy and paste the contents of mobile_repair_service_database.sql');
    console.log('3. Execute the SQL script');
    console.log('\nAlternatively, you can run this simplified version:');
    
    // Create simplified table creation script
    const simplifiedSQL = `
-- Simplified Mobile Repair Tables
CREATE TABLE IF NOT EXISTS public.repair_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id VARCHAR(20) UNIQUE NOT NULL DEFAULT 'REP' || LPAD((EXTRACT(EPOCH FROM now())::INTEGER % 999999)::TEXT, 6, '0'),
    customer_name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(15) NOT NULL,
    email VARCHAR(255),
    user_id UUID,
    device_type VARCHAR(20) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(255) NOT NULL,
    issue_types TEXT[] NOT NULL,
    issue_description TEXT NOT NULL,
    other_issue TEXT,
    service_type VARCHAR(20) NOT NULL,
    address TEXT,
    preferred_time_slot VARCHAR(100),
    status VARCHAR(30) DEFAULT 'request_received',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    admin_notes TEXT,
    rejection_reason TEXT
);

CREATE TABLE IF NOT EXISTS public.repair_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    repair_request_id UUID NOT NULL,
    image_url TEXT NOT NULL,
    image_alt TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT fk_repair_images_request 
        FOREIGN KEY (repair_request_id) REFERENCES public.repair_requests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.repair_status_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    repair_request_id UUID NOT NULL,
    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by UUID,
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT fk_repair_status_logs_request 
        FOREIGN KEY (repair_request_id) REFERENCES public.repair_requests(id) ON DELETE CASCADE
);

-- Disable RLS for development
ALTER TABLE public.repair_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_status_logs DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.repair_requests TO authenticated, anon, service_role;
GRANT ALL ON public.repair_images TO authenticated, anon, service_role;
GRANT ALL ON public.repair_status_logs TO authenticated, anon, service_role;
`;
    
    console.log('\n' + simplifiedSQL);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

runMobileRepairSetup().catch(console.error);