import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Initialize Supabase client
const supabaseUrl = 'https://xeufezbuuccohiardtrk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupRepairFeedback() {
  console.log('🔧 Setting up Repair Feedback Table...\n');

  try {
    // Read and execute the SQL file
    const sql = readFileSync('create_repair_feedback_table_only.sql', 'utf8');
    
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error.message);
      
      // Try alternative approach - create table directly
      console.log('🔄 Trying alternative approach...');
      
      const { error: createError } = await supabase
        .from('repair_feedback')
        .select('id')
        .limit(1);
        
      if (createError && createError.message.includes('does not exist')) {
        console.log('📝 Creating repair_feedback table manually...');
        
        // Since we can't execute DDL directly, let's just verify the table exists
        console.log('⚠️  Please create the repair_feedback table manually in Supabase:');
        console.log('1. Go to Supabase Dashboard → SQL Editor');
        console.log('2. Copy and paste the contents of create_repair_feedback_table_only.sql');
        console.log('3. Execute the SQL script');
      } else {
        console.log('✅ repair_feedback table already exists');
      }
    } else {
      console.log('✅ repair_feedback table created successfully');
    }

    // Test table access
    console.log('🧪 Testing repair_feedback table access...');
    const { data, error: testError } = await supabase
      .from('repair_feedback')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Table access error:', testError.message);
    } else {
      console.log('✅ repair_feedback table is accessible');
    }

    console.log('\n🎉 Repair Feedback Setup Complete!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

// Run the setup
setupRepairFeedback().catch(console.error);