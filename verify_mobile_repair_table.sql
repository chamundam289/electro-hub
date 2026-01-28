-- Verify Mobile Repair Table Setup
-- Run this to check if the mobile_repairs table exists and has the correct structure

-- Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'mobile_repairs'
) as table_exists;

-- Show table structure using information_schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'mobile_repairs'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Count records in table
SELECT COUNT(*) as total_records FROM mobile_repairs;

-- Show recent records
SELECT 
    id,
    customer_name,
    device_brand,
    device_model,
    repair_type,
    estimated_cost,
    repair_status,
    payment_status,
    created_at
FROM mobile_repairs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check table permissions
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name='mobile_repairs';

-- Test insert (will be rolled back)
BEGIN;
INSERT INTO mobile_repairs (
    customer_name,
    customer_phone,
    device_brand,
    device_model,
    issue_description,
    repair_type,
    estimated_cost
) VALUES (
    'Test Customer',
    '1234567890',
    'Test Brand',
    'Test Model',
    'Test issue description',
    'Screen Replacement',
    1000.00
);
SELECT 'Insert test successful' as test_result;
ROLLBACK;