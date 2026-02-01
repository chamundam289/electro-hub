// CommonJS script to run data tracking setup
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = "https://xeufezbuuccohiardtrk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSetup() {
  try {
    console.log('🚀 Running data operation tracking setup...');
    
    const sql = fs.readFileSync('setup_data_operation_tracking.sql', 'utf8');
    
    // Split SQL into individual statements and execute them
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length === 0) continue;
      
      console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          console.error('Statement:', statement.substring(0, 100) + '...');
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message);
      }
    }
    
    console.log('\n🎉 Setup process completed!');
    
    // Test the setup
    console.log('\n🧪 Testing the setup...');
    
    const { data: testData, error: testError } = await supabase
      .from('data_operation_tracking')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Test failed:', testError.message);
    } else {
      console.log('✅ data_operation_tracking table is accessible');
      console.log('📊 Records found:', testData?.length || 0);
    }
    
    // Test the view
    const { data: viewData, error: viewError } = await supabase
      .from('overall_storage_usage')
      .select('*')
      .single();
    
    if (viewError) {
      console.error('❌ View test failed:', viewError.message);
    } else {
      console.log('✅ overall_storage_usage view is working');
      console.log('📈 Current usage:', {
        total_files: viewData.total_files,
        total_database_operations: viewData.total_database_operations,
        total_size_mb: viewData.total_size_mb
      });
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

runSetup();