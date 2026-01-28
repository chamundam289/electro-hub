-- Simple Mobile Repair Table Check
-- Run these queries one by one to verify the setup

-- 1. Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'mobile_repairs'
) as table_exists;

-- 2. Count total records
SELECT COUNT(*) as total_records FROM mobile_repairs;

-- 3. Show all records (if any)
SELECT * FROM mobile_repairs ORDER BY created_at DESC;

-- 4. Test a simple insert
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
    '9999999999',
    'Apple',
    'iPhone 14',
    'Screen is cracked and not responding to touch',
    'Screen Replacement',
    7500.00
);

-- 5. Verify the insert worked
SELECT * FROM mobile_repairs WHERE customer_name = 'Test Customer';