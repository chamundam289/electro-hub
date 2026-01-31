-- ============================================
-- 📱 MOBILE REPAIR SERVICE MODULE - DATABASE SCHEMA
-- ============================================

-- 1. Main Repair Requests Table
CREATE TABLE IF NOT EXISTS public.repair_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id VARCHAR(20) UNIQUE NOT NULL, -- Human readable ID like REP001
    
    -- Customer Information
    customer_name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(15) NOT NULL,
    email VARCHAR(255),
    user_id UUID, -- Link to auth.users if logged in
    
    -- Device Information
    device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('android', 'iphone')),
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(255) NOT NULL,
    
    -- Issue Details
    issue_types TEXT[] NOT NULL, -- Array of issue types
    issue_description TEXT NOT NULL,
    other_issue TEXT, -- For "Other" issue type
    
    -- Service Details
    service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('doorstep', 'service_center')),
    address TEXT, -- Required if doorstep service
    preferred_time_slot VARCHAR(100),
    
    -- Status Tracking
    status VARCHAR(30) DEFAULT 'request_received' CHECK (status IN (
        'request_received',
        'inspection_pending', 
        'quotation_sent',
        'quotation_approved',
        'quotation_rejected',
        'repair_in_progress',
        'repair_completed',
        'ready_for_delivery',
        'delivered',
        'cancelled'
    )),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Admin Notes
    admin_notes TEXT,
    rejection_reason TEXT
);

-- 2. Repair Request Images Table
CREATE TABLE IF NOT EXISTS public.repair_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    repair_request_id UUID NOT NULL,
    image_url TEXT NOT NULL,
    image_alt TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    CONSTRAINT fk_repair_images_request 
        FOREIGN KEY (repair_request_id) REFERENCES public.repair_requests(id) ON DELETE CASCADE
);

-- 3. Repair Quotations Table
CREATE TABLE IF NOT EXISTS public.repair_quotations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    repair_request_id UUID NOT NULL UNIQUE,
    
    -- Cost Breakdown
    parts_cost DECIMAL(10,2) DEFAULT 0.00,
    labour_charges DECIMAL(10,2) DEFAULT 0.00,
    service_charges DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Service Details
    estimated_delivery_days INTEGER DEFAULT 1,
    warranty_period_days INTEGER DEFAULT 30,
    warranty_description TEXT,
    
    -- Admin Details
    admin_notes TEXT,
    created_by UUID, -- Admin who created quotation
    
    -- Status
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'approved', 'rejected')),
    customer_response_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    CONSTRAINT fk_repair_quotations_request 
        FOREIGN KEY (repair_request_id) REFERENCES public.repair_requests(id) ON DELETE CASCADE
);

-- 4. Repair Status Logs Table (for tracking status changes)
CREATE TABLE IF NOT EXISTS public.repair_status_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    repair_request_id UUID NOT NULL,
    
    -- Status Change Details
    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by UUID, -- Admin or system
    change_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    CONSTRAINT fk_repair_status_logs_request 
        FOREIGN KEY (repair_request_id) REFERENCES public.repair_requests(id) ON DELETE CASCADE
);

-- 5. Repair Payments Table (Optional - Phase 2)
CREATE TABLE IF NOT EXISTS public.repair_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    repair_request_id UUID NOT NULL,
    quotation_id UUID NOT NULL,
    
    -- Payment Details
    payment_type VARCHAR(20) CHECK (payment_type IN ('advance', 'full', 'remaining')),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) CHECK (payment_method IN ('upi', 'cash', 'online', 'card')),
    
    -- Payment Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_id VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    CONSTRAINT fk_repair_payments_request 
        FOREIGN KEY (repair_request_id) REFERENCES public.repair_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_repair_payments_quotation 
        FOREIGN KEY (quotation_id) REFERENCES public.repair_quotations(id) ON DELETE CASCADE
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_repair_requests_request_id ON public.repair_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_repair_requests_status ON public.repair_requests(status);
CREATE INDEX IF NOT EXISTS idx_repair_requests_user ON public.repair_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_repair_requests_mobile ON public.repair_requests(mobile_number);
CREATE INDEX IF NOT EXISTS idx_repair_requests_created ON public.repair_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_repair_images_request ON public.repair_images(repair_request_id);

CREATE INDEX IF NOT EXISTS idx_repair_quotations_request ON public.repair_quotations(repair_request_id);
CREATE INDEX IF NOT EXISTS idx_repair_quotations_status ON public.repair_quotations(status);

CREATE INDEX IF NOT EXISTS idx_repair_status_logs_request ON public.repair_status_logs(repair_request_id);
CREATE INDEX IF NOT EXISTS idx_repair_status_logs_created ON public.repair_status_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_repair_payments_request ON public.repair_payments(repair_request_id);
CREATE INDEX IF NOT EXISTS idx_repair_payments_status ON public.repair_payments(status);

-- ============================================
-- FUNCTIONS FOR AUTO-GENERATING REQUEST IDs
-- ============================================

-- Function to generate unique request ID
CREATE OR REPLACE FUNCTION generate_repair_request_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    counter INTEGER;
BEGIN
    -- Get the next sequence number
    SELECT COALESCE(MAX(CAST(SUBSTRING(request_id FROM 4) AS INTEGER)), 0) + 1 
    INTO counter 
    FROM repair_requests 
    WHERE request_id ~ '^REP[0-9]+$';
    
    -- Format as REP001, REP002, etc.
    new_id := 'REP' || LPAD(counter::TEXT, 3, '0');
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate request_id
CREATE OR REPLACE FUNCTION set_repair_request_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.request_id IS NULL OR NEW.request_id = '' THEN
        NEW.request_id := generate_repair_request_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_repair_request_id
    BEFORE INSERT ON repair_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_repair_request_id();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Disable RLS for development
ALTER TABLE public.repair_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_quotations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_status_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_payments DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.repair_requests TO authenticated, anon, service_role;
GRANT ALL ON public.repair_images TO authenticated, anon, service_role;
GRANT ALL ON public.repair_quotations TO authenticated, anon, service_role;
GRANT ALL ON public.repair_status_logs TO authenticated, anon, service_role;
GRANT ALL ON public.repair_payments TO authenticated, anon, service_role;

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Insert sample repair request
INSERT INTO public.repair_requests (
    customer_name, mobile_number, email, device_type, brand, model,
    issue_types, issue_description, service_type, address, preferred_time_slot
) VALUES (
    'John Doe', '9876543210', 'john@example.com', 'android', 'Samsung', 'Galaxy S21',
    ARRAY['screen_broken', 'battery_issue'], 'Screen is cracked and battery drains fast',
    'doorstep', '123 Main Street, City', 'Morning (9 AM - 12 PM)'
) ON CONFLICT DO NOTHING;

-- Insert sample quotation
INSERT INTO public.repair_quotations (
    repair_request_id, parts_cost, labour_charges, service_charges, total_amount,
    estimated_delivery_days, warranty_period_days, warranty_description, admin_notes
) 
SELECT 
    id, 1500.00, 500.00, 200.00, 2200.00,
    3, 90, '3 months warranty on replaced parts', 'Screen replacement required'
FROM public.repair_requests 
WHERE customer_name = 'John Doe'
LIMIT 1
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.repair_requests IS 'Main table for mobile repair service requests';
COMMENT ON TABLE public.repair_quotations IS 'Quotations sent by admin for repair requests';
COMMENT ON TABLE public.repair_status_logs IS 'Audit trail for status changes';
COMMENT ON TABLE public.repair_payments IS 'Payment tracking for repair services';