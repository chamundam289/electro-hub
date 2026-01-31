// Check auth.users table structure
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xeufezbuuccohiardtrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAuthUsers() {
  console.log('🔍 Checking Auth Users...\n');
  
  try {
    // Try to access auth.users (this might not work with anon key)
    console.log('📋 Trying to access auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Cannot access auth.users with anon key:', authError.message);
    } else {
      console.log(`✅ Found ${authUsers?.users?.length || 0} auth users`);
    }
    
    // Check if there's a public users table or profiles table
    console.log('\n📋 Checking for public user tables...');
    
    const possibleTables = ['users', 'profiles', 'user_profiles'];
    
    for (const table of possibleTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${table} not accessible: ${error.message}`);
        } else {
          console.log(`✅ Table ${table} exists with ${data?.length || 0} records`);
          if (data && data.length > 0) {
            console.log('   Sample record keys:', Object.keys(data[0]));
          }
        }
      } catch (err) {
        console.log(`❌ Error checking ${table}: ${err.message}`);
      }
    }
    
    // Check orders table to see user_id references
    console.log('\n📋 Checking orders table for user references...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('user_id, customer_name, customer_email, customer_phone')
      .limit(3);
    
    if (ordersError) {
      console.log('❌ Error accessing orders:', ordersError.message);
    } else {
      console.log(`✅ Found ${orders?.length || 0} orders with user references`);
      if (orders && orders.length > 0) {
        orders.forEach(order => {
          console.log(`   - User ID: ${order.user_id?.substring(0, 8) || 'none'}... | Customer: ${order.customer_name} | Email: ${order.customer_email}`);
        });
      }
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkAuthUsers().catch(console.error);