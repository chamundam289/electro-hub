-- Mobile Recharge Management System
-- Create table for storing mobile recharge transactions

CREATE TABLE IF NOT EXISTS mobile_recharges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mobile_number VARCHAR(15) NOT NULL,
    operator VARCHAR(50) NOT NULL,
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('prepaid', 'postpaid')),
    recharge_amount DECIMAL(10,2) NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(15),
    payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'failed')),
    transaction_id VARCHAR(100),
    operator_transaction_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('success', 'pending', 'failed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mobile_recharges_mobile_number ON mobile_recharges(mobile_number);
CREATE INDEX IF NOT EXISTS idx_mobile_recharges_operator ON mobile_recharges(operator);
CREATE INDEX IF NOT EXISTS idx_mobile_recharges_status ON mobile_recharges(status);
CREATE INDEX IF NOT EXISTS idx_mobile_recharges_payment_status ON mobile_recharges(payment_status);
CREATE INDEX IF NOT EXISTS idx_mobile_recharges_created_at ON mobile_recharges(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mobile_recharges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mobile_recharges_updated_at
    BEFORE UPDATE ON mobile_recharges
    FOR EACH ROW
    EXECUTE FUNCTION update_mobile_recharges_updated_at();

-- Insert sample data for testing
INSERT INTO mobile_recharges (
    mobile_number, 
    operator, 
    plan_type, 
    recharge_amount, 
    customer_name, 
    customer_phone, 
    payment_method, 
    payment_status, 
    transaction_id, 
    operator_transaction_id, 
    status, 
    notes
) VALUES 
(
    '9876543210', 
    'Airtel', 
    'prepaid', 
    299.00, 
    'John Doe', 
    '9876543210', 
    'upi', 
    'paid', 
    'TXN' || EXTRACT(EPOCH FROM NOW())::BIGINT, 
    'OP' || EXTRACT(EPOCH FROM NOW())::BIGINT, 
    'success', 
    'Monthly recharge'
),
(
    '9876543211', 
    'Jio', 
    'prepaid', 
    199.00, 
    'Jane Smith', 
    '9876543211', 
    'cash', 
    'paid', 
    'TXN' || (EXTRACT(EPOCH FROM NOW())::BIGINT + 1), 
    'OP' || (EXTRACT(EPOCH FROM NOW())::BIGINT + 1), 
    'success', 
    'Quick recharge'
),
(
    '9876543212', 
    'Vi (Vodafone Idea)', 
    'postpaid', 
    499.00, 
    'Bob Johnson', 
    '9876543212', 
    'card', 
    'paid', 
    'TXN' || (EXTRACT(EPOCH FROM NOW())::BIGINT + 2), 
    'OP' || (EXTRACT(EPOCH FROM NOW())::BIGINT + 2), 
    'success', 
    'Postpaid bill payment'
);

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON mobile_recharges TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- Create view for recharge statistics
CREATE OR REPLACE VIEW mobile_recharge_stats AS
SELECT 
    COUNT(*) as total_recharges,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_recharges,
    COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_recharges,
    COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_payments,
    SUM(CASE WHEN status = 'success' THEN recharge_amount ELSE 0 END) as total_revenue,
    AVG(CASE WHEN status = 'success' THEN recharge_amount END) as avg_recharge_amount,
    operator,
    plan_type,
    DATE(created_at) as recharge_date
FROM mobile_recharges 
GROUP BY operator, plan_type, DATE(created_at)
ORDER BY recharge_date DESC, total_revenue DESC;

-- Create function to get daily recharge summary
CREATE OR REPLACE FUNCTION get_daily_recharge_summary(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_recharges BIGINT,
    successful_recharges BIGINT,
    failed_recharges BIGINT,
    pending_recharges BIGINT,
    total_amount DECIMAL(10,2),
    successful_amount DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_recharges,
        COUNT(CASE WHEN mr.status = 'success' THEN 1 END)::BIGINT as successful_recharges,
        COUNT(CASE WHEN mr.status = 'failed' THEN 1 END)::BIGINT as failed_recharges,
        COUNT(CASE WHEN mr.status = 'pending' THEN 1 END)::BIGINT as pending_recharges,
        COALESCE(SUM(mr.recharge_amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN mr.status = 'success' THEN mr.recharge_amount ELSE 0 END), 0) as successful_amount
    FROM mobile_recharges mr
    WHERE DATE(mr.created_at) = target_date;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT * FROM get_daily_recharge_summary();
-- SELECT * FROM get_daily_recharge_summary('2024-01-15');