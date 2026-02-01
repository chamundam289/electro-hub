-- Employee Management System Database Setup
-- Complete system for Employee, Attendance, and Salary Management

-- Disable RLS for development
ALTER TABLE IF EXISTS employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employee_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employee_salaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS salary_components DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance_rules DISABLE ROW LEVEL SECURITY;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS salary_components CASCADE;
DROP TABLE IF EXISTS employee_salaries CASCADE;
DROP TABLE IF EXISTS employee_attendance CASCADE;
DROP TABLE IF EXISTS attendance_rules CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- 1. EMPLOYEES TABLE (Master Data)
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(20) UNIQUE NOT NULL, -- Auto-generated (EMP001, EMP002, etc.)
    full_name VARCHAR(100) NOT NULL,
    mobile_number VARCHAR(15) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Sales', 'Technician', 'Office Staff', 'Manager')),
    department VARCHAR(50) NOT NULL,
    joining_date DATE NOT NULL,
    salary_type VARCHAR(20) NOT NULL CHECK (salary_type IN ('Monthly', 'Daily', 'Hourly')),
    base_salary DECIMAL(10,2) NOT NULL, -- Base salary/rate
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    profile_image_url TEXT,
    address TEXT,
    emergency_contact VARCHAR(15),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. ATTENDANCE RULES TABLE (System Configuration)
CREATE TABLE attendance_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(50) NOT NULL,
    rule_value TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. EMPLOYEE ATTENDANCE TABLE (Daily Records)
CREATE TABLE employee_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent', 'Half Day', 'Leave', 'Holiday')),
    check_in_time TIME,
    check_out_time TIME,
    working_hours DECIMAL(4,2) DEFAULT 0, -- For hourly employees
    notes TEXT,
    marked_by UUID REFERENCES auth.users(id), -- Admin who marked attendance
    is_locked BOOLEAN DEFAULT false, -- Prevent editing after certain period
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one attendance record per employee per day
    UNIQUE(employee_id, attendance_date)
);

-- 4. EMPLOYEE SALARIES TABLE (Monthly Salary Records)
CREATE TABLE employee_salaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    salary_month INTEGER NOT NULL CHECK (salary_month BETWEEN 1 AND 12),
    salary_year INTEGER NOT NULL CHECK (salary_year >= 2020),
    
    -- Attendance Summary
    total_working_days INTEGER DEFAULT 0,
    present_days INTEGER DEFAULT 0,
    absent_days INTEGER DEFAULT 0,
    half_days INTEGER DEFAULT 0,
    leave_days INTEGER DEFAULT 0,
    holiday_days INTEGER DEFAULT 0,
    total_working_hours DECIMAL(6,2) DEFAULT 0, -- For hourly employees
    
    -- Salary Calculation
    base_salary DECIMAL(10,2) NOT NULL,
    gross_salary DECIMAL(10,2) DEFAULT 0,
    bonus DECIMAL(10,2) DEFAULT 0,
    incentives DECIMAL(10,2) DEFAULT 0,
    overtime_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Deductions
    absent_deduction DECIMAL(10,2) DEFAULT 0,
    late_penalty DECIMAL(10,2) DEFAULT 0,
    advance_deduction DECIMAL(10,2) DEFAULT 0,
    other_deductions DECIMAL(10,2) DEFAULT 0,
    total_deductions DECIMAL(10,2) DEFAULT 0,
    
    -- Final Amount
    net_salary DECIMAL(10,2) NOT NULL,
    
    -- Payment Details
    payment_status VARCHAR(20) DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'On Hold')),
    payment_date DATE,
    payment_mode VARCHAR(20) CHECK (payment_mode IN ('Cash', 'Bank Transfer', 'UPI')),
    transaction_reference VARCHAR(100),
    payment_notes TEXT,
    
    -- Metadata
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_by UUID REFERENCES auth.users(id),
    paid_by UUID REFERENCES auth.users(id),
    
    -- Ensure one salary record per employee per month
    UNIQUE(employee_id, salary_month, salary_year)
);

-- 5. SALARY COMPONENTS TABLE (Optional - For detailed breakdown)
CREATE TABLE salary_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salary_id UUID REFERENCES employee_salaries(id) ON DELETE CASCADE,
    component_type VARCHAR(20) NOT NULL CHECK (component_type IN ('Earning', 'Deduction')),
    component_name VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employees_department ON employees(department);

CREATE INDEX idx_attendance_employee_date ON employee_attendance(employee_id, attendance_date);
CREATE INDEX idx_attendance_date ON employee_attendance(attendance_date);
CREATE INDEX idx_attendance_status ON employee_attendance(status);

CREATE INDEX idx_salaries_employee_month_year ON employee_salaries(employee_id, salary_month, salary_year);
CREATE INDEX idx_salaries_payment_status ON employee_salaries(payment_status);
CREATE INDEX idx_salaries_month_year ON employee_salaries(salary_month, salary_year);

-- Insert default attendance rules
INSERT INTO attendance_rules (rule_name, rule_value, description) VALUES
('working_days_per_month', '26', 'Standard working days in a month'),
('working_hours_per_day', '8', 'Standard working hours per day'),
('half_day_hours', '4', 'Minimum hours for half day'),
('attendance_edit_window', '1', 'Days allowed to edit attendance'),
('monthly_holidays', '4', 'Average holidays per month');

-- Function to auto-generate employee ID
CREATE OR REPLACE FUNCTION generate_employee_id()
RETURNS TEXT AS $$
DECLARE
    next_id INTEGER;
    employee_id TEXT;
BEGIN
    -- Get the next sequence number
    SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)), 0) + 1
    INTO next_id
    FROM employees
    WHERE employee_id ~ '^EMP[0-9]+$';
    
    -- Format as EMP001, EMP002, etc.
    employee_id := 'EMP' || LPAD(next_id::TEXT, 3, '0');
    
    RETURN employee_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate employee ID
CREATE OR REPLACE FUNCTION set_employee_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.employee_id IS NULL OR NEW.employee_id = '' THEN
        NEW.employee_id := generate_employee_id();
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_employee_id
    BEFORE INSERT OR UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION set_employee_id();

-- Function to calculate salary based on attendance
CREATE OR REPLACE FUNCTION calculate_monthly_salary(
    emp_id UUID,
    month INTEGER,
    year INTEGER
)
RETURNS TABLE(
    calculated_gross DECIMAL(10,2),
    calculated_deductions DECIMAL(10,2),
    calculated_net DECIMAL(10,2)
) AS $$
DECLARE
    emp_record RECORD;
    attendance_summary RECORD;
    working_days INTEGER := 26; -- Default working days
    gross_amount DECIMAL(10,2) := 0;
    deduction_amount DECIMAL(10,2) := 0;
    net_amount DECIMAL(10,2) := 0;
BEGIN
    -- Get employee details
    SELECT * INTO emp_record FROM employees WHERE id = emp_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Employee not found';
    END IF;
    
    -- Get attendance summary for the month
    SELECT 
        COUNT(*) FILTER (WHERE status = 'Present') as present_days,
        COUNT(*) FILTER (WHERE status = 'Absent') as absent_days,
        COUNT(*) FILTER (WHERE status = 'Half Day') as half_days,
        COUNT(*) FILTER (WHERE status = 'Leave') as leave_days,
        COUNT(*) FILTER (WHERE status = 'Holiday') as holiday_days,
        COALESCE(SUM(working_hours), 0) as total_hours
    INTO attendance_summary
    FROM employee_attendance 
    WHERE employee_id = emp_id 
    AND EXTRACT(MONTH FROM attendance_date) = month 
    AND EXTRACT(YEAR FROM attendance_date) = year;
    
    -- Calculate salary based on salary type
    IF emp_record.salary_type = 'Monthly' THEN
        gross_amount := emp_record.base_salary;
        -- Deduct for absent days (optional)
        deduction_amount := (emp_record.base_salary / working_days) * attendance_summary.absent_days;
    ELSIF emp_record.salary_type = 'Daily' THEN
        gross_amount := emp_record.base_salary * (attendance_summary.present_days + (attendance_summary.half_days * 0.5));
    ELSIF emp_record.salary_type = 'Hourly' THEN
        gross_amount := emp_record.base_salary * attendance_summary.total_hours;
    END IF;
    
    net_amount := gross_amount - deduction_amount;
    
    RETURN QUERY SELECT gross_amount, deduction_amount, net_amount;
END;
$$ LANGUAGE plpgsql;

-- Create views for reporting
CREATE OR REPLACE VIEW employee_summary AS
SELECT 
    e.id,
    e.employee_id,
    e.full_name,
    e.role,
    e.department,
    e.salary_type,
    e.base_salary,
    e.status,
    e.joining_date,
    -- Current month attendance
    COALESCE(att.present_days, 0) as current_month_present,
    COALESCE(att.absent_days, 0) as current_month_absent,
    COALESCE(att.total_days, 0) as current_month_total,
    -- Latest salary info
    COALESCE(sal.net_salary, 0) as last_salary,
    sal.payment_status as last_payment_status
FROM employees e
LEFT JOIN (
    SELECT 
        employee_id,
        COUNT(*) FILTER (WHERE status = 'Present') as present_days,
        COUNT(*) FILTER (WHERE status = 'Absent') as absent_days,
        COUNT(*) as total_days
    FROM employee_attendance 
    WHERE EXTRACT(MONTH FROM attendance_date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM attendance_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    GROUP BY employee_id
) att ON e.id = att.employee_id
LEFT JOIN (
    SELECT DISTINCT ON (employee_id) 
        employee_id, net_salary, payment_status
    FROM employee_salaries 
    ORDER BY employee_id, salary_year DESC, salary_month DESC
) sal ON e.id = sal.employee_id
WHERE e.status = 'Active';

-- Sample data for testing
INSERT INTO employees (full_name, mobile_number, email, role, department, joining_date, salary_type, base_salary) VALUES
('John Smith', '+91-9876543210', 'john.smith@company.com', 'Manager', 'Sales', '2024-01-15', 'Monthly', 50000.00),
('Sarah Johnson', '+91-9876543211', 'sarah.johnson@company.com', 'Sales', 'Sales', '2024-02-01', 'Monthly', 35000.00),
('Mike Wilson', '+91-9876543212', 'mike.wilson@company.com', 'Technician', 'Technical', '2024-01-20', 'Daily', 1500.00),
('Lisa Brown', '+91-9876543213', 'lisa.brown@company.com', 'Office Staff', 'Administration', '2024-03-01', 'Monthly', 25000.00);

-- Sample attendance data for current month
INSERT INTO employee_attendance (employee_id, attendance_date, status, check_in_time, check_out_time, working_hours)
SELECT 
    e.id,
    CURRENT_DATE - (INTERVAL '1 day' * generate_series(0, 15)),
    CASE 
        WHEN random() < 0.85 THEN 'Present'
        WHEN random() < 0.95 THEN 'Absent'
        ELSE 'Half Day'
    END,
    '09:00:00'::TIME,
    '18:00:00'::TIME,
    8.0
FROM employees e
WHERE e.status = 'Active';

COMMIT;