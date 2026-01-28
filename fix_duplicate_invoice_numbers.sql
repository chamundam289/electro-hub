-- Fix duplicate invoice numbers issue

-- Step 1: Clean up existing duplicate invoice numbers
DO $$
DECLARE
    duplicate_record RECORD;
    new_invoice_number TEXT;
    row_counter INTEGER := 1;
BEGIN
    -- Find and fix duplicate invoice numbers
    FOR duplicate_record IN 
        SELECT id, invoice_number, created_at,
               ROW_NUMBER() OVER (PARTITION BY invoice_number ORDER BY created_at) as rn
        FROM orders 
        WHERE invoice_number IS NOT NULL
    LOOP
        -- If this is a duplicate (not the first occurrence)
        IF duplicate_record.rn > 1 THEN
            -- Generate a new unique invoice number
            new_invoice_number := 'POS-' || TO_CHAR(duplicate_record.created_at, 'YYYYMMDD') || '-' || 
                                 LPAD((EXTRACT(EPOCH FROM duplicate_record.created_at)::BIGINT + duplicate_record.rn)::TEXT, 6, '0');
            
            -- Update the duplicate record
            UPDATE orders 
            SET invoice_number = new_invoice_number 
            WHERE id = duplicate_record.id;
            
            RAISE NOTICE 'Updated duplicate invoice number for order %: % -> %', 
                         duplicate_record.id, duplicate_record.invoice_number, new_invoice_number;
        END IF;
    END LOOP;
END $$;

-- Step 2: Create sequence for future invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;

-- Step 3: Create improved function with better uniqueness
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    new_invoice_number TEXT;
    attempt_count INTEGER := 0;
    max_attempts INTEGER := 10;
BEGIN
    -- Generate invoice number if not provided
    IF NEW.invoice_number IS NULL THEN
        LOOP
            -- Generate format: POS-YYYYMMDD-NNNN (using sequence + random component)
            new_invoice_number := 'POS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                                 LPAD((nextval('invoice_number_seq') + FLOOR(RANDOM() * 100))::TEXT, 4, '0');
            
            -- Check if this invoice number already exists
            PERFORM 1 FROM orders WHERE invoice_number = new_invoice_number;
            
            IF NOT FOUND THEN
                NEW.invoice_number := new_invoice_number;
                EXIT; -- Exit the loop when we have a unique number
            END IF;
            
            -- Increment attempt counter
            attempt_count := attempt_count + 1;
            
            -- If we've tried too many times, use UUID fallback
            IF attempt_count >= max_attempts THEN
                NEW.invoice_number := 'POS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                                     UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 6));
                EXIT;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Recreate the trigger
DROP TRIGGER IF EXISTS trigger_generate_invoice_number ON orders;
CREATE TRIGGER trigger_generate_invoice_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_invoice_number();

-- Step 5: Verify no duplicates remain
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT invoice_number, COUNT(*) as cnt
        FROM orders 
        WHERE invoice_number IS NOT NULL
        GROUP BY invoice_number
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Warning: % duplicate invoice numbers still exist', duplicate_count;
    ELSE
        RAISE NOTICE 'Success: No duplicate invoice numbers found';
    END IF;
END $$;

COMMENT ON FUNCTION generate_invoice_number() IS 'Generates unique invoice numbers with collision detection and fallback';