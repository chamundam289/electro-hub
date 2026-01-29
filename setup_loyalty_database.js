// Setup script for Loyalty Coins Database Tables
// Run this script to create the loyalty system tables in your Supabase database

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// You need to replace these with your actual Supabase credentials
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // Use service role key for admin operations

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupLoyaltyDatabase() {
  try {
    console.log('🚀 Setting up Loyalty Coins Database...');
    
    // Read the SQL setup file
    const sqlContent = fs.readFileSync('loyalty_coins_system_setup.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            // Continue with other statements
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('🎉 Loyalty Coins Database setup completed!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Verify tables were created in your Supabase dashboard');
    console.log('2. Check that RLS policies are active');
    console.log('3. Test the loyalty system in your application');
    
  } catch (error) {
    console.error('💥 Setup failed:', error.message);
    console.log('');
    console.log('🔧 Manual setup instructions:');
    console.log('1. Open your Supabase SQL Editor');
    console.log('2. Copy and paste the contents of loyalty_coins_system_setup.sql');
    console.log('3. Execute the SQL statements');
  }
}

// Alternative: Manual SQL execution function
async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.error('SQL Error:', error);
      return false;
    }
    console.log('SQL executed successfully');
    return true;
  } catch (err) {
    console.error('Exception:', err);
    return false;
  }
}

// Run the setup
if (process.argv.includes('--run')) {
  setupLoyaltyDatabase();
} else {
  console.log('🪙 Loyalty Coins Database Setup Script');
  console.log('');
  console.log('📋 Instructions:');
  console.log('1. Update SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in this file');
  console.log('2. Run: node setup_loyalty_database.js --run');
  console.log('');
  console.log('🔧 Alternative (Recommended):');
  console.log('1. Open Supabase Dashboard → SQL Editor');
  console.log('2. Copy contents of loyalty_coins_system_setup.sql');
  console.log('3. Paste and execute in SQL Editor');
  console.log('');
  console.log('📊 This will create:');
  console.log('- loyalty_coins_wallet table');
  console.log('- loyalty_transactions table');
  console.log('- loyalty_product_settings table');
  console.log('- loyalty_system_settings table');
  console.log('- RLS policies for security');
  console.log('- Utility functions and triggers');
}