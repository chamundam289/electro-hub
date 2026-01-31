-- Create repair_feedback table only
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

-- Create index
CREATE INDEX IF NOT EXISTS idx_repair_feedback_request ON public.repair_feedback(repair_request_id);

-- Disable RLS for development
ALTER TABLE public.repair_feedback DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.repair_feedback TO authenticated, anon, service_role;