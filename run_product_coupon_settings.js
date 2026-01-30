import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://xeufezbuuccohiardtrk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL() {
  try {
    const sql = fs.readFileSync('product_coupon_settings_table.sql', 'utf8');
    console.log('Executing SQL...');
    
    // Execute the entire SQL as one statement
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Success! Table created successfully');
    }
  } catch (err) {
    console.error('Script error:', err);
  }
}

runSQL();