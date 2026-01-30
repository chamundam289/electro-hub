-- Fix affiliate password to match the login component expectation
-- The login component uses atob() which expects base64 encoding, not SHA256

-- Update the test affiliate user password to use base64 encoding instead of SHA256
UPDATE public.affiliate_users 
SET password_hash = encode('password123'::bytea, 'base64')
WHERE mobile_number = '9999999999';

-- Verify the update
SELECT name, mobile_number, affiliate_code, password_hash, is_active 
FROM public.affiliate_users 
WHERE mobile_number = '9999999999';

SELECT 'Affiliate password fixed! You can now login with mobile: 9999999999 and password: password123' as status;