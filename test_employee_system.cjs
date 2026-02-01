const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xeufezbuuccohiardtrk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmployeeSystem() {
  try {
    console.log('🧪 Testing Employee Management System...');
    
    // Test if tables exist by trying to query them
    console.log('📋 Checking employees table...');
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .limit(1);
    
    if (empError) {
      console.log('❌ Employees table not found:', empError.message);
      console.log('📝 Please run the SQL setup manually in Supabase dashboard');
      console.log('   1. Go to Supabase Dashboard → SQL Editor');
      console.log('   2. Copy and paste the contents of employee_management_system_setup.sql');
      console.log('   3. Run the SQL script');
      return;
    } else {
      console.log('✅ Employees table exists');
    }
    
    console.log('📋 Checking attendance table...');
    const { data: attendance, error: attError } = await supabase
      .from('employee_attendance')
      .select('*')
      .limit(1);
    
    if (attError) {
      console.log('❌ Attendance table not found:', attError.message);
    } else {
      console.log('✅ Attendance table exists');
    }
    
    console.log('📋 Checking salaries table...');
    const { data: salaries, error: salError } = await supabase
      .from('employee_salaries')
      .select('*')
      .limit(1);
    
    if (salError) {
      console.log('❌ Salaries table not found:', salError.message);
    } else {
      console.log('✅ Salaries table exists');
    }
    
    // If all tables exist, show sample data
    if (!empError && !attError && !salError) {
      console.log('\n📊 Sample data:');
      
      const { data: allEmployees } = await supabase
        .from('employees')
        .select('employee_id, full_name, role, department, salary_type, base_salary')
        .limit(10);
      
      if (allEmployees && allEmployees.length > 0) {
        console.log('👥 Employees:');
        allEmployees.forEach(emp => {
          console.log(`   - ${emp.employee_id}: ${emp.full_name} (${emp.role}, ${emp.department})`);
          console.log(`     Salary: ${emp.salary_type} - ₹${emp.base_salary.toLocaleString()}`);
        });
      }
      
      const { data: recentAttendance } = await supabase
        .from('employee_attendance')
        .select(`
          attendance_date, status, working_hours,
          employee:employees(employee_id, full_name)
        `)
        .order('attendance_date', { ascending: false })
        .limit(5);
      
      if (recentAttendance && recentAttendance.length > 0) {
        console.log('\n📅 Recent Attendance:');
        recentAttendance.forEach(att => {
          console.log(`   - ${att.attendance_date}: ${att.employee?.employee_id} - ${att.status}`);
        });
      }
      
      console.log('\n🎉 Employee Management System is working correctly!');
      console.log('\n🚀 Ready to use:');
      console.log('   1. Admin Dashboard → Employee Management');
      console.log('   2. Admin Dashboard → Attendance');
      console.log('   3. Admin Dashboard → Salary Management');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEmployeeSystem();