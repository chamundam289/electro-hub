// Check website_settings table structure
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xeufezbuuccohiardtrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkWebsiteSettings() {
  try {
    console.log('🔍 Checking website_settings table structure...\n');
    
    // Try to get all data to see the structure
    const { data, error } = await supabase
      .from('website_settings')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Error accessing website_settings:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ website_settings table exists with data:');
      console.log('📊 Sample records:');
      data.forEach((record, index) => {
        console.log(`\n${index + 1}. Record:`, record);
      });
      
      console.log('\n📋 Available columns:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => {
        console.log(`   - ${col}`);
      });
      
    } else {
      console.log('✅ website_settings table exists but is empty');
      console.log('🔍 Trying to insert a test record to see the structure...');
      
      // Try to insert a simple record to see what columns are expected
      const { data: insertData, error: insertError } = await supabase
        .from('website_settings')
        .insert([{ test: 'test' }])
        .select();
      
      if (insertError) {
        console.log('❌ Insert failed:', insertError.message);
        console.log('💡 This tells us about the expected structure');
      } else {
        console.log('✅ Insert successful:', insertData);
      }
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkWebsiteSettings().catch(console.error);