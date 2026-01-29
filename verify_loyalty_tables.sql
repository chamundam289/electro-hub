-- ============================================
-- VERIFY LOYALTY SYSTEM TABLES EXIST
-- ============================================

-- Check if loyalty tables exist
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename LIKE 'loyalty_%'
ORDER BY tablename;

-- Check table structures
\d loyalty_coins_wallet
\d loyalty_transactions  
\d loyalty_product_settings
\d loyalty_system_settings

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename LIKE 'loyalty_%'
ORDER BY tablename;

-- Check sample data
SELECT 'loyalty_coins_wallet' as table_name, COUNT(*) as record_count FROM loyalty_coins_wallet
UNION ALL
SELECT 'loyalty_transactions', COUNT(*) FROM loyalty_transactions
UNION ALL  
SELECT 'loyalty_product_settings', COUNT(*) FROM loyalty_product_settings
UNION ALL
SELECT 'loyalty_system_settings', COUNT(*) FROM loyalty_system_settings;

-- Check if products have loyalty columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name LIKE '%coin%'
ORDER BY column_name;