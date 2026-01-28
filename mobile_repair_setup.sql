-- Mobile Repair Service Management System Setup
-- This script creates the necessary table and policies for mobile repair services

-- Create mobile_repairs table
CREATE TABLE IF NOT EXISTS mobile_repairs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    device_brand VARCHAR(100) NOT NULL,
    device_model VARCHAR(100) NOT NULL,
    issue_description TEXT NOT NULL,
    repair_type VARCHAR(100) NOT NULL,
    estimated_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    actual_cost DECIMAL(10,2),
    advance_payment DECIMAL(10,2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'partial')),
    repair_status VARCHAR(20) DEFAULT 'received' CHECK (repair_status IN ('received', 'in_progress', 'completed', 'delivered', 'cancelled')),
    technician_name VARCHAR(255),
    received_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expected_delivery_date TIMESTAMP WITH TIME ZONE,
    actual_delivery_date TIMESTAMP WITH TIME ZONE,
    warranty_period INTEGER DEFAULT 30, -- warranty period in days
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mobile_repairs_customer_phone ON mobile_repairs(customer_phone);
CREATE INDEX IF NOT EXISTS idx_mobile_repairs_device_brand ON mobile_repairs(device_brand);
CREATE INDEX IF NOT EXISTS idx_mobile_repairs_repair_status ON mobile_repairs(repair_status);
CREATE INDEX IF NOT EXISTS idx_mobile_repairs_payment_status ON mobile_repairs(payment_status);
CREATE INDEX IF NOT EXISTS idx_mobile_repairs_created_at ON mobile_repairs(created_at);
CREATE INDEX IF NOT EXISTS idx_mobile_repairs_received_date ON mobile_repairs(received_date);

-- Enable Row Level Security
ALTER TABLE mobile_repairs ENABLE ROW LEVEL SECURITY;

-- Create policies for mobile_repairs table
-- Allow authenticated users to read all repair records
CREATE POLICY "Allow authenticated users to read mobile repairs" ON mobile_repairs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert repair records
CREATE POLICY "Allow authenticated users to insert mobile repairs" ON mobile_repairs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update repair records
CREATE POLICY "Allow authenticated users to update mobile repairs" ON mobile_repairs
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete repair records
CREATE POLICY "Allow authenticated users to delete mobile repairs" ON mobile_repairs
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mobile_repairs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_mobile_repairs_updated_at_trigger ON mobile_repairs;
CREATE TRIGGER update_mobile_repairs_updated_at_trigger
    BEFORE UPDATE ON mobile_repairs
    FOR EACH ROW
    EXECUTE FUNCTION update_mobile_repairs_updated_at();

-- Insert sample data for testing
INSERT INTO mobile_repairs (
    customer_name,
    customer_phone,
    device_brand,
    device_model,
    issue_description,
    repair_type,
    estimated_cost,
    advance_payment,
    payment_status,
    repair_status,
    technician_name,
    expected_delivery_date,
    warranty_period,
    notes
) VALUES 
(
    'John Doe',
    '9876543210',
    'Apple',
    'iPhone 13',
    'Screen cracked after dropping. Touch is not working properly in some areas.',
    'Screen Replacement',
    8500.00,
    3000.00,
    'partial',
    'in_progress',
    'Raj Kumar',
    NOW() + INTERVAL '2 days',
    30,
    'Customer wants original Apple screen only'
),
(
    'Jane Smith',
    '9876543211',
    'Samsung',
    'Galaxy S21',
    'Battery drains very quickly, phone gets hot during charging.',
    'Battery Replacement',
    3500.00,
    1500.00,
    'partial',
    'received',
    'Amit Singh',
    NOW() + INTERVAL '1 day',
    30,
    'Check for any water damage as well'
),
(
    'Mike Johnson',
    '9876543212',
    'OnePlus',
    '9 Pro',
    'Charging port is loose, cable keeps disconnecting.',
    'Charging Port Repair',
    2500.00,
    2500.00,
    'paid',
    'completed',
    'Raj Kumar',
    NOW() - INTERVAL '1 day',
    15,
    'Repair completed successfully'
),
(
    'Sarah Wilson',
    '9876543213',
    'Xiaomi',
    'Mi 11',
    'Phone fell in water, not turning on at all.',
    'Water Damage Repair',
    4500.00,
    0.00,
    'pending',
    'received',
    NULL,
    NOW() + INTERVAL '3 days',
    30,
    'Need to check motherboard condition first'
),
(
    'David Brown',
    '9876543214',
    'Oppo',
    'Reno 6',
    'Rear camera not focusing properly, images are blurry.',
    'Camera Repair',
    3000.00,
    3000.00,
    'paid',
    'delivered',
    'Amit Singh',
    NOW() - INTERVAL '2 days',
    30,
    'Camera module replaced, tested successfully'
);

-- Grant necessary permissions
GRANT ALL ON mobile_repairs TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create view for repair statistics
CREATE OR REPLACE VIEW mobile_repair_stats AS
SELECT 
    COUNT(*) as total_repairs,
    COUNT(*) FILTER (WHERE repair_status = 'received') as received_count,
    COUNT(*) FILTER (WHERE repair_status = 'in_progress') as in_progress_count,
    COUNT(*) FILTER (WHERE repair_status = 'completed') as completed_count,
    COUNT(*) FILTER (WHERE repair_status = 'delivered') as delivered_count,
    COUNT(*) FILTER (WHERE repair_status = 'cancelled') as cancelled_count,
    COUNT(*) FILTER (WHERE payment_status = 'paid') as paid_count,
    COUNT(*) FILTER (WHERE payment_status = 'partial') as partial_count,
    COUNT(*) FILTER (WHERE payment_status = 'pending') as pending_count,
    SUM(estimated_cost) as total_estimated_revenue,
    SUM(actual_cost) as total_actual_revenue,
    SUM(advance_payment) as total_advance_collected,
    AVG(estimated_cost) as avg_repair_cost
FROM mobile_repairs;

-- Grant access to the view
GRANT SELECT ON mobile_repair_stats TO authenticated;

COMMENT ON TABLE mobile_repairs IS 'Mobile device repair service management';
COMMENT ON COLUMN mobile_repairs.customer_name IS 'Name of the customer';
COMMENT ON COLUMN mobile_repairs.customer_phone IS 'Customer contact phone number';
COMMENT ON COLUMN mobile_repairs.device_brand IS 'Brand of the mobile device';
COMMENT ON COLUMN mobile_repairs.device_model IS 'Model of the mobile device';
COMMENT ON COLUMN mobile_repairs.issue_description IS 'Detailed description of the issue';
COMMENT ON COLUMN mobile_repairs.repair_type IS 'Type of repair service required';
COMMENT ON COLUMN mobile_repairs.estimated_cost IS 'Estimated cost for the repair';
COMMENT ON COLUMN mobile_repairs.actual_cost IS 'Actual cost charged for the repair';
COMMENT ON COLUMN mobile_repairs.advance_payment IS 'Advance payment received from customer';
COMMENT ON COLUMN mobile_repairs.payment_status IS 'Payment status: paid, pending, or partial';
COMMENT ON COLUMN mobile_repairs.repair_status IS 'Current status of the repair';
COMMENT ON COLUMN mobile_repairs.technician_name IS 'Name of the assigned technician';
COMMENT ON COLUMN mobile_repairs.received_date IS 'Date when device was received';
COMMENT ON COLUMN mobile_repairs.expected_delivery_date IS 'Expected completion/delivery date';
COMMENT ON COLUMN mobile_repairs.actual_delivery_date IS 'Actual delivery date';
COMMENT ON COLUMN mobile_repairs.warranty_period IS 'Warranty period in days';
COMMENT ON COLUMN mobile_repairs.notes IS 'Additional notes or special instructions';