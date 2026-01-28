-- Fix invoice number generation for orders table with proper uniqueness

-- Create a sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- Create a function to generate unique invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    new_invoice_number TEXT;
    counter INTEGER := 0;
BEGIN
    -- Generate invoice number if not provided
    IF NEW.invoice_number IS NULL THEN
        LOOP
            -- Generate format: POS-YYYYMMDD-NNNN (using sequence)
            new_invoice_number := 'POS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                                 LPAD(nextval('invoice_number_seq')::TEXT, 4, '0');
            
            -- Check if this invoice number already exists
            IF NOT EXISTS (SELECT 1 FROM orders WHERE invoice_number = new_invoice_number) THEN
                NEW.invoice_number := new_invoice_number;
                EXIT; -- Exit the loop when we have a unique number
            END IF;
            
            -- Safety counter to prevent infinite loop
            counter := counter + 1;
            IF counter > 1000 THEN
                -- Fallback to UUID-based number if we can't generate unique number
                NEW.invoice_number := 'POS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                                     UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8));
                EXIT;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate invoice numbers
DROP TRIGGER IF EXISTS trigger_generate_invoice_number ON orders;
CREATE TRIGGER trigger_generate_invoice_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_invoice_number();

-- Update existing orders without invoice numbers (with unique generation)
DO $$
DECLARE
    order_record RECORD;
    new_invoice_number TEXT;
    counter INTEGER;
BEGIN
    FOR order_record IN 
        SELECT id, created_at FROM orders WHERE invoice_number IS NULL
    LOOP
        counter := 0;
        LOOP
            -- Generate unique invoice number for each existing order
            new_invoice_number := 'POS-' || TO_CHAR(order_record.created_at, 'YYYYMMDD') || '-' || 
                                 LPAD(nextval('invoice_number_seq')::TEXT, 4, '0');
            
            -- Check if this invoice number already exists
            IF NOT EXISTS (SELECT 1 FROM orders WHERE invoice_number = new_invoice_number) THEN
                UPDATE orders 
                SET invoice_number = new_invoice_number 
                WHERE id = order_record.id;
                EXIT;
            END IF;
            
            counter := counter + 1;
            IF counter > 100 THEN
                -- Fallback for existing records
                new_invoice_number := 'POS-' || TO_CHAR(order_record.created_at, 'YYYYMMDD') || '-' || 
                                     UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8));
                UPDATE orders 
                SET invoice_number = new_invoice_number 
                WHERE id = order_record.id;
                EXIT;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Create sequence for purchase invoice numbers
CREATE SEQUENCE IF NOT EXISTS purchase_invoice_number_seq START 1;

-- Also fix the same issue for purchase_invoices
CREATE OR REPLACE FUNCTION generate_purchase_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    new_invoice_number TEXT;
    counter INTEGER := 0;
BEGIN
    -- Generate invoice number if not provided
    IF NEW.invoice_number IS NULL THEN
        LOOP
            -- Generate format: PUR-YYYYMMDD-NNNN
            new_invoice_number := 'PUR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                                 LPAD(nextval('purchase_invoice_number_seq')::TEXT, 4, '0');
            
            -- Check if this invoice number already exists
            IF NOT EXISTS (SELECT 1 FROM purchase_invoices WHERE invoice_number = new_invoice_number) THEN
                NEW.invoice_number := new_invoice_number;
                EXIT;
            END IF;
            
            counter := counter + 1;
            IF counter > 1000 THEN
                -- Fallback to UUID-based number
                NEW.invoice_number := 'PUR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                                     UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8));
                EXIT;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for purchase invoices
DROP TRIGGER IF EXISTS trigger_generate_purchase_invoice_number ON purchase_invoices;
CREATE TRIGGER trigger_generate_purchase_invoice_number
    BEFORE INSERT ON purchase_invoices
    FOR EACH ROW
    EXECUTE FUNCTION generate_purchase_invoice_number();

-- Update existing purchase invoices without invoice numbers
DO $$
DECLARE
    invoice_record RECORD;
    new_invoice_number TEXT;
    counter INTEGER;
BEGIN
    FOR invoice_record IN 
        SELECT id, created_at FROM purchase_invoices WHERE invoice_number IS NULL OR invoice_number = ''
    LOOP
        counter := 0;
        LOOP
            new_invoice_number := 'PUR-' || TO_CHAR(invoice_record.created_at, 'YYYYMMDD') || '-' || 
                                 LPAD(nextval('purchase_invoice_number_seq')::TEXT, 4, '0');
            
            IF NOT EXISTS (SELECT 1 FROM purchase_invoices WHERE invoice_number = new_invoice_number) THEN
                UPDATE purchase_invoices 
                SET invoice_number = new_invoice_number 
                WHERE id = invoice_record.id;
                EXIT;
            END IF;
            
            counter := counter + 1;
            IF counter > 100 THEN
                new_invoice_number := 'PUR-' || TO_CHAR(invoice_record.created_at, 'YYYYMMDD') || '-' || 
                                     UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8));
                UPDATE purchase_invoices 
                SET invoice_number = new_invoice_number 
                WHERE id = invoice_record.id;
                EXIT;
            END IF;
        END LOOP;
    END LOOP;
END $$;

COMMENT ON FUNCTION generate_invoice_number() IS 'Auto-generates unique invoice numbers for orders using sequence';
COMMENT ON FUNCTION generate_purchase_invoice_number() IS 'Auto-generates unique invoice numbers for purchase invoices using sequence';
COMMENT ON SEQUENCE invoice_number_seq IS 'Sequence for generating unique order invoice numbers';
COMMENT ON SEQUENCE purchase_invoice_number_seq IS 'Sequence for generating unique purchase invoice numbers';