-- Create a fresh affiliate user with correct password encoding

-- Delete existing test user
DELETE FROM public.affiliate_users WHERE mobile_number = '9999999999';

-- Create new test user with base64 encoded password
INSERT INTO public.affiliate_users (
    name, 
    mobile_number, 
    password_hash, 
    affiliate_code, 
    is_active
) VALUES (
    'Test Affiliate User',
    '9999999999',
    encode('password123'::bytea, 'base64'),  -- This creates proper base64 encoding
    'AFF000001',
    true
);

-- Verify the user was created correctly
SELECT 
    name,
    mobile_number,
    password_hash,
    affiliate_code,
    is_active,
    created_at
FROM public.affiliate_users 
WHERE mobile_number = '9999999999';

-- Test password decoding (should return 'password123')
SELECT 
    name,
    mobile_number,
    convert_from(decode(password_hash, 'base64'), 'UTF8') as decoded_password
FROM public.affiliate_users 
WHERE mobile_number = '9999999999';

SELECT 'Fresh affiliate user created! Login with mobile: 9999999999, password: password123' as status;