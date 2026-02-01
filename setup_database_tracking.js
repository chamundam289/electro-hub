// Setup Database Tracking for Storage Management
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xeufezbuuccohiardtrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldWZlemJ1dWNjb2hpYXJkdHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzA3MDcsImV4cCI6MjA4NTAwNjcwN30.zp8ucpKwEbJW-st0PpNm53TarEzNFXrwp_SBoI4cOyI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupDatabaseTracking() {
  try {
    console.log('🔧 Setting up database tracking system...\n');
    
    // Test 1: Check if storage_usage_tracking table exists
    console.log('🔍 Checking storage_usage_tracking table...');
    const { data: trackingData, error: trackingError } = await supabase
      .from('storage_usage_tracking')
      .select('*')
      .limit(1);
    
    if (trackingError) {
      if (trackingError.code === '42P01') {
        console.log('❌ storage_usage_tracking table does not exist');
        console.log('\n📝 Please run this SQL in Supabase SQL Editor:');
        console.log('----------------------------------------');
        console.log(`
-- Create storage tracking table
CREATE TABLE IF NOT EXISTS public.storage_usage_tracking (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name TEXT NOT NULL,
    bucket_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_type TEXT,
    upload_source TEXT,
    uploaded_by UUID,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_storage_tracking_bucket ON public.storage_usage_tracking(bucket_name, is_deleted);
CREATE INDEX IF NOT EXISTS idx_storage_tracking_source ON public.storage_usage_tracking(upload_source, is_deleted);

-- Create storage usage summary view
CREATE OR REPLACE VIEW public.storage_usage_summary AS
SELECT 
    bucket_name,
    upload_source,
    COUNT(*) as total_files,
    SUM(file_size_bytes) as total_size_bytes,
    ROUND(SUM(file_size_bytes) / 1024.0 / 1024.0, 2) as total_size_mb,
    ROUND(SUM(file_size_bytes) / 1024.0 / 1024.0 / 1024.0, 3) as total_size_gb,
    MIN(uploaded_at) as first_upload,
    MAX(uploaded_at) as last_upload
FROM public.storage_usage_tracking 
WHERE is_deleted = false
GROUP BY bucket_name, upload_source;

-- Create overall storage usage view
CREATE OR REPLACE VIEW public.overall_storage_usage AS
SELECT 
    COUNT(*) as total_files,
    SUM(file_size_bytes) as total_size_bytes,
    ROUND(SUM(file_size_bytes) / 1024.0 / 1024.0, 2) as total_size_mb,
    ROUND(SUM(file_size_bytes) / 1024.0 / 1024.0 / 1024.0, 3) as total_size_gb,
    ROUND((1024.0 - SUM(file_size_bytes) / 1024.0 / 1024.0), 2) as remaining_mb_approx,
    ROUND((1.0 - SUM(file_size_bytes) / 1024.0 / 1024.0 / 1024.0), 3) as remaining_gb_approx,
    ROUND((SUM(file_size_bytes) / 1024.0 / 1024.0 / 1024.0 / 1.0) * 100, 1) as usage_percentage
FROM public.storage_usage_tracking 
WHERE is_deleted = false;

-- Disable RLS for development
ALTER TABLE public.storage_usage_tracking DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.storage_usage_tracking TO anon, authenticated;
GRANT SELECT ON public.storage_usage_summary TO anon, authenticated;
GRANT SELECT ON public.overall_storage_usage TO anon, authenticated;
        `);
        console.log('----------------------------------------\n');
        
        return false;
      } else {
        console.log('⚠️  Table access error:', trackingError.message);
        return false;
      }
    } else {
      console.log('✅ storage_usage_tracking table exists');
      
      // Add sample data if table is empty
      if (!trackingData || trackingData.length === 0) {
        console.log('📝 Adding sample tracking data...');
        
        const sampleData = [
          {
            file_name: 'sample-product-1.jpg',
            bucket_name: 'product-images',
            file_size_bytes: 1024000, // 1MB
            file_type: 'image/jpeg',
            upload_source: 'product_images'
          },
          {
            file_name: 'sample-product-2.jpg',
            bucket_name: 'product-images',
            file_size_bytes: 1536000, // 1.5MB
            file_type: 'image/jpeg',
            upload_source: 'product_images'
          },
          {
            file_name: 'sample-story-1.jpg',
            bucket_name: 'instagram-story-media',
            file_size_bytes: 2048000, // 2MB
            file_type: 'image/jpeg',
            upload_source: 'instagram_story_media'
          },
          {
            file_name: 'sample-story-video.mp4',
            bucket_name: 'instagram-story-media',
            file_size_bytes: 5120000, // 5MB
            file_type: 'video/mp4',
            upload_source: 'instagram_story_media'
          },
          {
            file_name: 'sample-repair-1.jpg',
            bucket_name: 'repair-images',
            file_size_bytes: 1024000, // 1MB
            file_type: 'image/jpeg',
            upload_source: 'repair_images'
          }
        ];
        
        const { data: insertData, error: insertError } = await supabase
          .from('storage_usage_tracking')
          .insert(sampleData)
          .select();
        
        if (insertError) {
          console.log('❌ Error inserting sample data:', insertError.message);
        } else {
          console.log('✅ Sample data inserted:', insertData.length, 'records');
          console.log('📊 Total sample size:', (sampleData.reduce((sum, item) => sum + item.file_size_bytes, 0) / 1024 / 1024).toFixed(2), 'MB');
        }
      } else {
        console.log('📊 Existing data found:', trackingData.length, 'records');
      }
      
      return true;
    }
  } catch (error) {
    console.error('❌ Setup failed:', error);
    return false;
  }
}

async function testStorageViews() {
  try {
    console.log('\n🔍 Testing storage usage views...');
    
    // Test overall storage usage view
    const { data: usageData, error: usageError } = await supabase
      .from('overall_storage_usage')
      .select('*')
      .single();
    
    if (usageError) {
      if (usageError.code === '42P01') {
        console.log('❌ overall_storage_usage view does not exist');
        console.log('📝 Run the SQL script above to create views');
      } else if (usageError.code === 'PGRST116') {
        console.log('✅ overall_storage_usage view exists (no data yet)');
      } else {
        console.log('⚠️  View error:', usageError.message);
      }
    } else {
      console.log('✅ overall_storage_usage view working');
      console.log('📊 Current usage:', {
        files: usageData.total_files,
        size_mb: usageData.total_size_mb,
        size_gb: usageData.total_size_gb,
        percentage: usageData.usage_percentage + '%',
        remaining_mb: usageData.remaining_mb_approx
      });
    }
    
    // Test storage summary view
    const { data: summaryData, error: summaryError } = await supabase
      .from('storage_usage_summary')
      .select('*');
    
    if (summaryError) {
      console.log('❌ storage_usage_summary view error:', summaryError.message);
    } else {
      console.log('✅ storage_usage_summary view working');
      console.log('📋 Storage breakdown:');
      summaryData.forEach(item => {
        console.log(`   - ${item.upload_source}: ${item.total_files} files, ${item.total_size_mb} MB`);
      });
    }
    
  } catch (error) {
    console.error('❌ View test failed:', error);
  }
}

async function main() {
  const setupSuccess = await setupDatabaseTracking();
  
  if (setupSuccess) {
    await testStorageViews();
    
    console.log('\n🎉 Database tracking setup complete!');
    console.log('📝 You can now:');
    console.log('   1. Go to Admin Dashboard → Database');
    console.log('   2. View storage usage statistics');
    console.log('   3. Monitor database table counts');
    console.log('   4. Upload files to see tracking in action');
  } else {
    console.log('\n⚠️  Setup incomplete. Please run the SQL script in Supabase SQL Editor first.');
  }
}

main().catch(console.error);