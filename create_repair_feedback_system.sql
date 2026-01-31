-- ============================================
-- 📱 MOBILE REPAIR FEEDBACK SYSTEM
-- ============================================

-- 1. Customer Feedback Table
CREATE TABLE IF NOT EXISTS public.repair_feedback (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    repair_request_id UUID NOT NULL,
    
    -- Rating and Feedback
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    -- Feedback Categories
    service_quality_rating INTEGER CHECK (service_quality_rating >= 1 AND service_quality_rating <= 5),
    technician_rating INTEGER CHECK (technician_rating >= 1 AND technician_rating <= 5),
    delivery_time_rating INTEGER CHECK (delivery_time_rating >= 1 AND delivery_time_rating <= 5),
    price_satisfaction_rating INTEGER CHECK (price_satisfaction_rating >= 1 AND price_satisfaction_rating <= 5),
    
    -- Additional Info
    would_recommend BOOLEAN DEFAULT true,
    improvement_suggestions TEXT,
    
    -- Customer Info
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    CONSTRAINT fk_repair_feedback_request 
        FOREIGN KEY (repair_request_id) REFERENCES public.repair_requests(id) ON DELETE CASCADE
);

-- 2. Repair Analytics Table
CREATE TABLE IF NOT EXISTS public.repair_analytics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Date and Metrics
    date DATE NOT NULL,
    total_requests INTEGER DEFAULT 0,
    completed_requests INTEGER DEFAULT 0,
    pending_requests INTEGER DEFAULT 0,
    cancelled_requests INTEGER DEFAULT 0,
    
    -- Performance Metrics
    avg_completion_time_hours DECIMAL(10,2) DEFAULT 0,
    avg_customer_rating DECIMAL(3,2) DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    
    -- Issue Type Analytics
    screen_issues INTEGER DEFAULT 0,
    battery_issues INTEGER DEFAULT 0,
    charging_issues INTEGER DEFAULT 0,
    water_damage_issues INTEGER DEFAULT 0,
    software_issues INTEGER DEFAULT 0,
    other_issues INTEGER DEFAULT 0,
    
    -- Service Type Analytics
    doorstep_services INTEGER DEFAULT 0,
    service_center_visits INTEGER DEFAULT 0,
    
    -- Device Type Analytics
    android_repairs INTEGER DEFAULT 0,
    iphone_repairs INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    UNIQUE(date)
);

-- 3. Repair Technicians Table
CREATE TABLE IF NOT EXISTS public.repair_technicians (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Technician Info
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(15),
    employee_id VARCHAR(50) UNIQUE,
    
    -- Skills and Specialization
    specializations TEXT[], -- Array of specializations
    experience_years INTEGER DEFAULT 0,
    certification_level VARCHAR(50), -- 'junior', 'senior', 'expert'
    
    -- Performance Metrics
    total_repairs_completed INTEGER DEFAULT 0,
    avg_customer_rating DECIMAL(3,2) DEFAULT 0,
    avg_completion_time_hours DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    current_workload INTEGER DEFAULT 0,
    max_concurrent_repairs INTEGER DEFAULT 5,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Repair Assignments Table
CREATE TABLE IF NOT EXISTS public.repair_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    repair_request_id UUID NOT NULL,
    technician_id UUID NOT NULL,
    
    -- Assignment Details
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Assignment Status
    status VARCHAR(30) DEFAULT 'assigned' CHECK (status IN (
        'assigned', 'in_progress', 'completed', 'reassigned'
    )),
    
    -- Notes
    technician_notes TEXT,
    admin_notes TEXT,
    
    CONSTRAINT fk_repair_assignments_request 
        FOREIGN KEY (repair_request_id) REFERENCES public.repair_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_repair_assignments_technician 
        FOREIGN KEY (technician_id) REFERENCES public.repair_technicians(id) ON DELETE CASCADE
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_repair_feedback_request ON public.repair_feedback(repair_request_id);
CREATE INDEX IF NOT EXISTS idx_repair_feedback_rating ON public.repair_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_repair_feedback_created ON public.repair_feedback(created_at);

CREATE INDEX IF NOT EXISTS idx_repair_analytics_date ON public.repair_analytics(date);
CREATE INDEX IF NOT EXISTS idx_repair_analytics_created ON public.repair_analytics(created_at);

CREATE INDEX IF NOT EXISTS idx_repair_technicians_active ON public.repair_technicians(is_active);
CREATE INDEX IF NOT EXISTS idx_repair_technicians_workload ON public.repair_technicians(current_workload);

CREATE INDEX IF NOT EXISTS idx_repair_assignments_request ON public.repair_assignments(repair_request_id);
CREATE INDEX IF NOT EXISTS idx_repair_assignments_technician ON public.repair_assignments(technician_id);
CREATE INDEX IF NOT EXISTS idx_repair_assignments_status ON public.repair_assignments(status);

-- ============================================
-- FUNCTIONS FOR ANALYTICS
-- ============================================

-- Function to update daily analytics
CREATE OR REPLACE FUNCTION update_daily_repair_analytics()
RETURNS void AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    analytics_record RECORD;
BEGIN
    -- Calculate today's metrics
    SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status IN ('repair_completed', 'delivered') THEN 1 END) as completed_requests,
        COUNT(CASE WHEN status NOT IN ('repair_completed', 'delivered', 'cancelled') THEN 1 END) as pending_requests,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_requests,
        
        -- Issue type counts
        SUM(CASE WHEN 'screen_broken' = ANY(issue_types) THEN 1 ELSE 0 END) as screen_issues,
        SUM(CASE WHEN 'battery_issue' = ANY(issue_types) THEN 1 ELSE 0 END) as battery_issues,
        SUM(CASE WHEN 'charging_problem' = ANY(issue_types) THEN 1 ELSE 0 END) as charging_issues,
        SUM(CASE WHEN 'water_damage' = ANY(issue_types) THEN 1 ELSE 0 END) as water_damage_issues,
        SUM(CASE WHEN 'software_issue' = ANY(issue_types) THEN 1 ELSE 0 END) as software_issues,
        SUM(CASE WHEN 'other' = ANY(issue_types) THEN 1 ELSE 0 END) as other_issues,
        
        -- Service type counts
        COUNT(CASE WHEN service_type = 'doorstep' THEN 1 END) as doorstep_services,
        COUNT(CASE WHEN service_type = 'service_center' THEN 1 END) as service_center_visits,
        
        -- Device type counts
        COUNT(CASE WHEN device_type = 'android' THEN 1 END) as android_repairs,
        COUNT(CASE WHEN device_type = 'iphone' THEN 1 END) as iphone_repairs
        
    INTO analytics_record
    FROM repair_requests 
    WHERE DATE(created_at) = today_date;
    
    -- Insert or update analytics record
    INSERT INTO repair_analytics (
        date, total_requests, completed_requests, pending_requests, cancelled_requests,
        screen_issues, battery_issues, charging_issues, water_damage_issues, 
        software_issues, other_issues, doorstep_services, service_center_visits,
        android_repairs, iphone_repairs
    ) VALUES (
        today_date, analytics_record.total_requests, analytics_record.completed_requests,
        analytics_record.pending_requests, analytics_record.cancelled_requests,
        analytics_record.screen_issues, analytics_record.battery_issues,
        analytics_record.charging_issues, analytics_record.water_damage_issues,
        analytics_record.software_issues, analytics_record.other_issues,
        analytics_record.doorstep_services, analytics_record.service_center_visits,
        analytics_record.android_repairs, analytics_record.iphone_repairs
    )
    ON CONFLICT (date) 
    DO UPDATE SET
        total_requests = EXCLUDED.total_requests,
        completed_requests = EXCLUDED.completed_requests,
        pending_requests = EXCLUDED.pending_requests,
        cancelled_requests = EXCLUDED.cancelled_requests,
        screen_issues = EXCLUDED.screen_issues,
        battery_issues = EXCLUDED.battery_issues,
        charging_issues = EXCLUDED.charging_issues,
        water_damage_issues = EXCLUDED.water_damage_issues,
        software_issues = EXCLUDED.software_issues,
        other_issues = EXCLUDED.other_issues,
        doorstep_services = EXCLUDED.doorstep_services,
        service_center_visits = EXCLUDED.service_center_visits,
        android_repairs = EXCLUDED.android_repairs,
        iphone_repairs = EXCLUDED.iphone_repairs,
        updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DISABLE RLS FOR DEVELOPMENT
-- ============================================

ALTER TABLE public.repair_feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_technicians DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_assignments DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.repair_feedback TO authenticated, anon, service_role;
GRANT ALL ON public.repair_analytics TO authenticated, anon, service_role;
GRANT ALL ON public.repair_technicians TO authenticated, anon, service_role;
GRANT ALL ON public.repair_assignments TO authenticated, anon, service_role;

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert sample technicians
INSERT INTO public.repair_technicians (
    name, email, phone, employee_id, specializations, experience_years, certification_level
) VALUES 
(
    'Rajesh Kumar', 'rajesh@company.com', '9876543210', 'TECH001',
    ARRAY['screen_repair', 'battery_replacement', 'water_damage'], 5, 'senior'
),
(
    'Priya Sharma', 'priya@company.com', '9876543211', 'TECH002',
    ARRAY['software_repair', 'charging_issues', 'camera_repair'], 3, 'junior'
),
(
    'Amit Singh', 'amit@company.com', '9876543212', 'TECH003',
    ARRAY['motherboard_repair', 'water_damage', 'complex_issues'], 8, 'expert'
)
ON CONFLICT (employee_id) DO NOTHING;

-- Initialize today's analytics
SELECT update_daily_repair_analytics();

COMMENT ON TABLE public.repair_feedback IS 'Customer feedback and ratings for completed repairs';
COMMENT ON TABLE public.repair_analytics IS 'Daily analytics and metrics for repair service performance';
COMMENT ON TABLE public.repair_technicians IS 'Technician profiles and performance metrics';
COMMENT ON TABLE public.repair_assignments IS 'Assignment of repair requests to technicians';