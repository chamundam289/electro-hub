const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://xeufezbuuccohiardtrk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupEmployeeSystem() {
  try {
    console.log('🚀 Setting up Employee Management System...');
    
    // Create employees table
    console.log('📋 Creating employees table...');
    const { error: empError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS employees (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          employee_id VARCHAR(20) UNIQUE NOT NULL,
          full_name VARCHAR(100) NOT NULL,
          mobile_number VARCHAR(15) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          role VARCHAR(50) NOT NULL CHECK (role IN ('Sales', 'Technician', 'Office Staff', 'Manager')),
          department VARCHAR(50) NOT NULL,
          joining_date DATE NOT NULL,
          salary_type VARCHAR(20) NOT NULL CHECK (salary_type IN ('Monthly', 'Daily', 'Hourly')),
          base_salary DECIMAL(10,2) NOT NULL,
          status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
          profile_image_url TEXT,
          address TEXT,
          emergency_contact VARCHAR(15),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_by UUID REFERENCES auth.users(id)
        );
      `
    });
    
    if (empError) console.log('⚠️ Employees table:', empError.message);
    else console.log('✅ Employees table created');
    
    // Create attendance table
    console.log('📋 Creating attendance table...');
    const { error: attError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS employee_attendance (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
          attendance_date DATE NOT NULL,
          status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent', 'Half Day', 'Leave', 'Holiday')),
          check_in_time TIME,
          check_out_time TIME,
          working_hours DECIMAL(4,2) DEFAULT 0,
          notes TEXT,
          marked_by UUID REFERENCES auth.users(id),
          is_locked BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(employee_id, attendance_date)
        );
      `
    });
    
    if (attError) console.log('⚠️ Attendance table:', attError.message);
    else console.log('✅ Attendance table created');
    
    // Create salaries table
    console.log('📋 Creating salaries table...');
    const { error: salError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS employee_salaries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
          salary_month INTEGER NOT NULL CHECK (salary_month BETWEEN 1 AND 12),
          salary_year INTEGER NOT NULL CHECK (salary_year >= 2020),
          total_working_days INTEGER DEFAULT 0,
          present_days INTEGER DEFAULT 0,
          absent_days INTEGER DEFAULT 0,
          half_days INTEGER DEFAULT 0,
          leave_days INTEGER DEFAULT 0,
          holiday_days INTEGER DEFAULT 0,
          total_working_hours DECIMAL(6,2) DEFAULT 0,
          base_salary DECIMAL(10,2) NOT NULL,
          gross_salary DECIMAL(10,2) DEFAULT 0,
          bonus DECIMAL(10,2) DEFAULT 0,
          incentives DECIMAL(10,2) DEFAULT 0,
          overtime_amount DECIMAL(10,2) DEFAULT 0,
          absent_deduction DECIMAL(10,2) DEFAULT 0,
          late_penalty DECIMAL(10,2) DEFAULT 0,
          advance_deduction DECIMAL(10,2) DEFAULT 0,
          other_deductions DECIMAL(10,2) DEFAULT 0,
          total_deductions DECIMAL(10,2) DEFAULT 0,
          net_salary DECIMAL(10,2) NOT NULL,
          payment_status VARCHAR(20) DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'On Hold')),
          payment_date DATE,
          payment_mode VARCHAR(20) CHECK (payment_mode IN ('Cash', 'Bank Transfer', 'UPI')),
          transaction_reference VARCHAR(100),
          payment_notes TEXT,
          generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          generated_by UUID REFERENCES auth.users(id),
          paid_by UUID REFERENCES auth.users(id),
          UNIQUE(employee_id, salary_month, salary_year)
        );
      `
    });
    
    if (salError) console.log('⚠️ Salaries table:', salError.message);
    else console.log('✅ Salaries table created');
    
    // Disable RLS for development
    console.log('🔓 Disabling RLS for development...');
    await supabase.rpc('exec_sql', { sql_query: 'ALTER TABLE employees DISABLE ROW LEVEL SECURITY;' });
    await supabase.rpc('exec_sql', { sql_query: 'ALTER TABLE employee_attendance DISABLE ROW LEVEL SECURITY;' });
    await supabase.rpc('exec_sql', { sql_query: 'ALTER TABLE employee_salaries DISABLE ROW LEVEL SECURITY;' });
    
    // Insert sample data
    console.log('📝 Inserting sample employees...');
    const { error: insertError } = await supabase
      .from('employees')
      .insert([
        {
          employee_id: 'EMP001',
          full_name: 'John Smith',
          mobile_number: '+91-9876543210',
          email: 'john.smith@company.com',
          role: 'Manager',
          department: 'Sales',
          joining_date: '2024-01-15',
          salary_type: 'Monthly',
          base_salary: 50000.00
        },
        {
          employee_id: 'EMP002',
          full_name: 'Sarah Johnson',
          mobile_number: '+91-9876543211',
          email: 'sarah.johnson@company.com',
          role: 'Sales',
          department: 'Sales',
          joining_date: '2024-02-01',
          salary_type: 'Monthly',
          base_salary: 35000.00
        },
        {
          employee_id: 'EMP003',
          full_name: 'Mike Wilson',
          mobile_number: '+91-9876543212',
          email: 'mike.wilson@company.com',
          role: 'Technician',
          department: 'Technical',
          joining_date: '2024-01-20',
          salary_type: 'Daily',
          base_salary: 1500.00
        },
        {
          employee_id: 'EMP004',
          full_name: 'Lisa Brown',
          mobile_number: '+91-9876543213',
          email: 'lisa.brown@company.com',
          role: 'Office Staff',
          department: 'Administration',
          joining_date: '2024-03-01',
          salary_type: 'Monthly',
          base_salary: 25000.00
        }
      ]);
    
    if (insertError) {
      console.log('⚠️ Sample data insert:', insertError.message);
    } else {
      console.log('✅ Sample employees inserted');
    }
    
    // Test the setup
    console.log('🧪 Testing database setup...');
    
    const { data: employees, error: testError } = await supabase
      .from('employees')
      .select('*')
      .limit(5);
    
    if (testError) {
      console.error('❌ Error fetching employees:', testError.message);
    } else {
      console.log(`✅ Found ${employees.length} employees in database`);
      employees.forEach(emp => {
        console.log(`   - ${emp.employee_id}: ${emp.full_name} (${emp.role})`);
      });
    }
    
    console.log('\n🎉 Employee Management System setup completed successfully!');
    console.log('\n📋 What you can do now:');
    console.log('   1. Go to Admin Dashboard → Employee Management');
    console.log('   2. View and manage employees');
    console.log('   3. Mark daily attendance');
    console.log('   4. Generate and manage monthly salaries');
    console.log('   5. Track employee performance and payments');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

setupEmployeeSystem();