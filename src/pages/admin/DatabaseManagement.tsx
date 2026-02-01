import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  Database, 
  HardDrive, 
  AlertTriangle, 
  AlertCircle,
  RefreshCw,
  FileImage,
  Video,
  Image as ImageIcon,
  Info,
  Trash2,
  TrendingUp,
  Server,
  Activity,
  BarChart3,
  PieChart,
  CheckCircle,
  Zap,
  Shield,
  ShoppingCart,
  User,
  Smartphone,
  Wrench
} from 'lucide-react';
import { toast } from 'sonner';
import { storageTrackingService } from '@/services/storageTrackingService';

interface StorageUsage {
  total_files: number;
  total_size_bytes: number;
  total_size_mb: number;
  total_size_gb: number;
  remaining_mb_approx: number;
  remaining_gb_approx: number;
  usage_percentage: number;
  // Database operation stats
  total_database_operations?: number;
  database_size_bytes?: number;
  database_size_mb?: number;
}

interface StorageSummary {
  bucket_name: string;
  upload_source: string;
  total_files: number;
  total_size_mb: number;
  total_size_gb: number;
  first_upload: string;
  last_upload: string;
}

interface DatabaseStats {
  table_name: string;
  row_count: number;
  size_estimate: string;
}

interface DataOperationSummary {
  operation_source: string;
  table_name: string;
  total_operations: number;
  total_size_mb: number;
  total_size_gb: number;
  first_operation: string;
  last_operation: string;
  create_operations: number;
  update_operations: number;
  delete_operations: number;
}

export default function DatabaseManagement() {
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [storageSummary, setStorageSummary] = useState<StorageSummary[]>([]);
  const [databaseStats, setDatabaseStats] = useState<DatabaseStats[]>([]);
  const [dataOperationSummary, setDataOperationSummary] = useState<DataOperationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('storage');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStorageData(),
        fetchDatabaseStats(),
        fetchDataOperationSummary()
      ]);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load database information');
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageData = async () => {
    try {
      // Try to fetch from storage tracking tables first
      const { data: usageData, error: usageError } = await (supabase as any)
        .from('overall_storage_usage')
        .select('*')
        .single();

      if (usageError) {
        // Storage tracking not available, use fallback data
        console.log('Storage tracking not available, using fallback data');
        
        // Fallback: Create approximate data based on existing records
        const fallbackUsage = {
          total_files: 0,
          total_size_bytes: 0,
          total_size_mb: 0,
          total_size_gb: 0,
          remaining_mb_approx: 1024,
          remaining_gb_approx: 1,
          usage_percentage: 0
        };
        
        // Try to estimate from existing data
        try {
          // Count products with images (rough estimate)
          const { count: productCount } = await (supabase as any)
            .from('products')
            .select('*', { count: 'exact', head: true })
            .not('image_url', 'is', null);
          
          // Count Instagram story media
          const { count: storyCount } = await (supabase as any)
            .from('instagram_story_media')
            .select('*', { count: 'exact', head: true });
          
          // Rough estimation: assume average file sizes
          const estimatedFiles = (productCount || 0) + (storyCount || 0);
          const estimatedSizeMB = estimatedFiles * 1.5; // Assume 1.5MB per file average
          const estimatedSizeBytes = estimatedSizeMB * 1024 * 1024;
          
          fallbackUsage.total_files = estimatedFiles;
          fallbackUsage.total_size_bytes = estimatedSizeBytes;
          fallbackUsage.total_size_mb = estimatedSizeMB;
          fallbackUsage.total_size_gb = estimatedSizeMB / 1024;
          fallbackUsage.remaining_mb_approx = Math.max(0, 1024 - estimatedSizeMB);
          fallbackUsage.remaining_gb_approx = Math.max(0, 1 - (estimatedSizeMB / 1024));
          fallbackUsage.usage_percentage = Math.min(100, (estimatedSizeMB / 1024) * 100);
          
        } catch (estimationError) {
          console.log('Could not estimate storage usage, using defaults');
        }
        
        setStorageUsage(fallbackUsage);
        
        // Create fallback summary data
        const fallbackSummary = [];
        if (fallbackUsage.total_files > 0) {
          fallbackSummary.push({
            bucket_name: 'product-images',
            upload_source: 'product_images',
            total_files: Math.floor(fallbackUsage.total_files * 0.6),
            total_size_mb: fallbackUsage.total_size_mb * 0.6,
            total_size_gb: fallbackUsage.total_size_gb * 0.6,
            first_upload: new Date().toISOString(),
            last_upload: new Date().toISOString()
          });
          
          if (fallbackUsage.total_files > 1) {
            fallbackSummary.push({
              bucket_name: 'instagram-story-media',
              upload_source: 'instagram_story_media',
              total_files: Math.floor(fallbackUsage.total_files * 0.4),
              total_size_mb: fallbackUsage.total_size_mb * 0.4,
              total_size_gb: fallbackUsage.total_size_gb * 0.4,
              first_upload: new Date().toISOString(),
              last_upload: new Date().toISOString()
            });
          }
        }
        
        setStorageSummary(fallbackSummary);
        
      } else {
        // Storage tracking is available
        setStorageUsage(usageData || {
          total_files: 0,
          total_size_bytes: 0,
          total_size_mb: 0,
          total_size_gb: 0,
          remaining_mb_approx: 1024,
          remaining_gb_approx: 1,
          usage_percentage: 0,
          total_database_operations: 0,
          database_size_bytes: 0,
          database_size_mb: 0
        });

        // Fetch storage summary by source
        const { data: summaryData, error: summaryError } = await (supabase as any)
          .from('storage_usage_summary')
          .select('*')
          .order('total_size_bytes', { ascending: false });

        if (!summaryError) {
          setStorageSummary(summaryData || []);
        }
      }

    } catch (error: any) {
      console.log('Error fetching storage data, using defaults');
      // Set default values if everything fails
      setStorageUsage({
        total_files: 0,
        total_size_bytes: 0,
        total_size_mb: 0,
        total_size_gb: 0,
        remaining_mb_approx: 1024,
        remaining_gb_approx: 1,
        usage_percentage: 0,
        total_database_operations: 0,
        database_size_bytes: 0,
        database_size_mb: 0
      });
      setStorageSummary([]);
    }
  };

  const fetchDataOperationSummary = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('data_operation_summary')
        .select('*')
        .order('total_size_bytes', { ascending: false });

      if (error) {
        console.log('Data operation summary not available:', error.message);
        setDataOperationSummary([]);
        return;
      }

      setDataOperationSummary(data || []);
    } catch (error: any) {
      console.log('Error fetching data operation summary:', error.message);
      setDataOperationSummary([]);
    }
  };

  const fetchDatabaseStats = async () => {
    try {
      // Get basic table statistics
      const tables = [
        'products', 'orders', 'instagram_users', 'instagram_stories',
        'loyalty_transactions', 'coupon_usage', 'repair_requests', 'storage_usage_tracking'
      ];

      const stats: DatabaseStats[] = [];

      for (const table of tables) {
        try {
          const { count, error } = await (supabase as any)
            .from(table)
            .select('*', { count: 'exact', head: true });

          if (!error) {
            stats.push({
              table_name: table,
              row_count: count || 0,
              size_estimate: 'N/A' // Supabase doesn't expose table sizes via client API
            });
          }
        } catch (err) {
          // Skip tables that don't exist or can't be accessed
          console.log(`Table ${table} not accessible, skipping`);
        }
      }

      setDatabaseStats(stats);

    } catch (error: any) {
      console.log('Error fetching database stats, using defaults');
      setDatabaseStats([]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success('Database information refreshed');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    if (percentage >= 60) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getUsageAlert = (percentage: number) => {
    if (percentage >= 90) {
      return {
        variant: 'destructive' as const,
        icon: AlertCircle,
        title: '🚨 Storage Almost Full',
        message: 'Storage usage is above 90%. Consider cleanup or upgrade to avoid service interruption.'
      };
    }
    if (percentage >= 80) {
      return {
        variant: 'default' as const,
        icon: AlertTriangle,
        title: '⚠️ Storage Usage Above 80%',
        message: 'Storage usage is above 80%. Monitor usage and consider cleanup.'
      };
    }
    return null;
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'product_images':
        return ImageIcon;
      case 'instagram_story_media':
        return Video;
      case 'repair_images':
        return FileImage;
      default:
        return Database;
    }
  };

  const getSourceLabel = (source: string): string => {
    switch (source) {
      case 'product_images':
        return 'Product Images';
      case 'instagram_story_media':
        return 'Instagram Story Media';
      case 'repair_images':
        return 'Repair Service Images';
      default:
        return source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case 'products':
        return ImageIcon;
      case 'orders':
        return BarChart3;
      case 'users':
        return Shield;
      case 'instagram_users':
      case 'instagram_stories':
        return Video;
      case 'loyalty_transactions':
        return TrendingUp;
      case 'repair_requests':
        return FileImage;
      default:
        return Database;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Database Management</h1>
        </div>

        {/* Loading Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const alert = storageUsage ? getUsageAlert(storageUsage.usage_percentage) : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Database Management</h1>
          <p className="text-gray-600">Monitor database performance and storage usage</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Important Disclaimer */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Storage usage shown here is approximate and based on uploaded files tracked by the application. 
          This is not official Supabase billing data. For exact usage and billing information, check your Supabase Dashboard.
        </AlertDescription>
      </Alert>

      {/* Setup Notice */}
      {(!storageUsage || storageUsage.total_files === 0) && (
        <Alert variant="default">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Setup Required:</strong> Storage tracking is not fully configured. 
            The data shown is estimated. For accurate tracking, run the storage tracking setup SQL script in your Supabase Dashboard.
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const setupSQL = `-- Run this in Supabase SQL Editor to enable accurate storage tracking
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

ALTER TABLE public.storage_usage_tracking DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.storage_usage_tracking TO anon, authenticated;
GRANT SELECT ON public.overall_storage_usage TO anon, authenticated;`;
                  
                  navigator.clipboard.writeText(setupSQL).then(() => {
                    toast.success('Setup SQL copied to clipboard! Paste it in Supabase SQL Editor.');
                  }).catch(() => {
                    toast.error('Could not copy to clipboard. Please copy the SQL manually.');
                  });
                }}
              >
                Copy Setup SQL
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Storage Usage Alert */}
      {alert && (
        <Alert variant={alert.variant}>
          <alert.icon className="h-4 w-4" />
          <AlertDescription>
            <strong>{alert.title}:</strong> {alert.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Database Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-lg font-bold">Online</span>
            </div>
            <p className="text-xs text-muted-foreground">Supabase PostgreSQL</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Operations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storageUsage?.total_database_operations || 0}</div>
            <p className="text-xs text-muted-foreground">Data operations tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storageUsage?.total_files || 0}</div>
            <p className="text-xs text-muted-foreground">Files uploaded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {storageUsage?.total_size_gb && storageUsage.total_size_gb > 0 
                ? `${storageUsage.total_size_gb} GB` 
                : `${storageUsage?.total_size_mb || 0} MB`}
            </div>
            <p className="text-xs text-muted-foreground">
              Files: {formatFileSize((storageUsage?.total_size_bytes || 0) - (storageUsage?.database_size_bytes || 0))} | 
              Data: {formatFileSize(storageUsage?.database_size_bytes || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usage</CardTitle>
            <Badge 
              variant={storageUsage && storageUsage.usage_percentage >= 80 ? 'destructive' : 'secondary'}
            >
              {storageUsage?.usage_percentage || 0}%
            </Badge>
          </CardHeader>
          <CardContent>
            <Progress 
              value={storageUsage?.usage_percentage || 0} 
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {storageUsage?.usage_percentage || 0}% of free plan used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="storage">Storage Usage</TabsTrigger>
          <TabsTrigger value="operations">Data Operations</TabsTrigger>
          <TabsTrigger value="tables">Database Tables</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="storage" className="space-y-6">
          {/* Storage Usage Progress Bar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Approximate Storage Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Used: {formatFileSize(storageUsage?.total_size_bytes || 0)}</span>
                  <span>Free Plan Limit: 1 GB</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className={`h-4 rounded-full transition-all duration-300 ${getUsageColor(storageUsage?.usage_percentage || 0)}`}
                    style={{ width: `${Math.min(storageUsage?.usage_percentage || 0, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {storageUsage?.remaining_gb_approx && storageUsage.remaining_gb_approx > 0 
                      ? `${storageUsage.remaining_gb_approx} GB` 
                      : `${storageUsage?.remaining_mb_approx || 1024} MB`}
                  </div>
                  <div className="text-sm text-gray-600">Remaining (Approx)</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {storageUsage?.usage_percentage || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Usage Percentage</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">1 GB</div>
                  <div className="text-sm text-gray-600">Free Plan Limit</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Storage by Source */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Storage by Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              {storageSummary.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No storage usage data available</p>
                  <p className="text-sm">Upload some files to see storage breakdown</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {storageSummary.map((summary, index) => {
                    const SourceIcon = getSourceIcon(summary.upload_source);
                    return (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <SourceIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{getSourceLabel(summary.upload_source)}</h3>
                            <p className="text-sm text-gray-600">
                              {summary.total_files} files • {summary.bucket_name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {summary.total_size_gb > 0 ? `${summary.total_size_gb} GB` : `${summary.total_size_mb} MB`}
                          </div>
                          <div className="text-sm text-gray-500">
                            Last upload: {new Date(summary.last_upload).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          {/* Data Operations Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Database Operations Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dataOperationSummary.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No database operations tracked yet</p>
                  <p className="text-sm">Create orders, products, or other data to see operation tracking</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dataOperationSummary.map((summary, index) => {
                    const getOperationIcon = (source: string) => {
                      if (source.includes('order')) return ShoppingCart;
                      if (source.includes('product')) return ImageIcon;
                      if (source.includes('customer')) return User;
                      if (source.includes('recharge')) return Smartphone;
                      if (source.includes('repair')) return Wrench;
                      if (source.includes('inventory')) return Database;
                      return Activity;
                    };
                    
                    const OperationIcon = getOperationIcon(summary.operation_source);
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <OperationIcon className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{storageTrackingService.getDataOperationLabel(summary.operation_source)}</h3>
                            <p className="text-sm text-gray-600">
                              {summary.total_operations} operations • {summary.table_name} table
                            </p>
                            <div className="flex gap-4 text-xs text-gray-500 mt-1">
                              <span>✅ {summary.create_operations} created</span>
                              <span>📝 {summary.update_operations} updated</span>
                              <span>🗑️ {summary.delete_operations} deleted</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {summary.total_size_gb > 0 ? `${summary.total_size_gb} GB` : `${summary.total_size_mb} MB`}
                          </div>
                          <div className="text-sm text-gray-500">
                            Last: {new Date(summary.last_operation).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Database Operations Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Operations Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {dataOperationSummary.reduce((sum, op) => sum + op.create_operations, 0)}
                  </div>
                  <div className="text-sm text-green-700">Create Operations</div>
                  <div className="text-xs text-green-600 mt-1">
                    Orders, Products, Customers, etc.
                  </div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {dataOperationSummary.reduce((sum, op) => sum + op.update_operations, 0)}
                  </div>
                  <div className="text-sm text-blue-700">Update Operations</div>
                  <div className="text-xs text-blue-600 mt-1">
                    Status changes, edits, modifications
                  </div>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {dataOperationSummary.reduce((sum, op) => sum + op.delete_operations, 0)}
                  </div>
                  <div className="text-sm text-red-700">Delete Operations</div>
                  <div className="text-xs text-red-600 mt-1">
                    Removed records, cleanup operations
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">📊 Data Size Breakdown</h4>
                <div className="text-sm text-gray-600">
                  <p>Total Database Operations: <span className="font-medium">{storageUsage?.total_database_operations || 0}</span></p>
                  <p>Estimated Data Size: <span className="font-medium">{formatFileSize(storageUsage?.database_size_bytes || 0)}</span></p>
                  <p>Average Operation Size: <span className="font-medium">
                    {storageUsage?.total_database_operations ? 
                      formatFileSize(Math.round((storageUsage.database_size_bytes || 0) / storageUsage.total_database_operations)) : 
                      '0 B'
                    }
                  </span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Tables Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {databaseStats.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No database statistics available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {databaseStats.map((stat, index) => {
                    const TableIcon = getTableIcon(stat.table_name);
                    return (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <TableIcon className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{stat.table_name}</h3>
                            <p className="text-sm text-gray-600">Database table</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{stat.row_count.toLocaleString()} rows</div>
                          <div className="text-sm text-gray-500">Size: {stat.size_estimate}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          {/* Storage Management Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Storage Management & Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-green-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Best Practices
                  </h4>
                  <ul className="text-sm space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>Compress images before uploading</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>Use WebP format for better compression</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>Delete unused or old media files</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>Monitor usage regularly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>Clean up test data periodically</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-blue-700 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    For Accurate Data
                  </h4>
                  <ul className="text-sm space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Check Supabase Dashboard → Usage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>This display is approximate only</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Official billing may differ</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Consider upgrading if needed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Monitor trends over time</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-orange-700 flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4" />
                  Important Limitations
                </h4>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <ul className="text-sm space-y-1 text-orange-800">
                    <li>• Storage usage shown here is approximate and based on uploaded files</li>
                    <li>• This is NOT official Supabase billing data</li>
                    <li>• Exact remaining storage cannot be determined via client-side API</li>
                    <li>• Use this feature for monitoring trends only</li>
                    <li>• For exact billing information, check your Supabase Dashboard</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                >
                  <Activity className="h-6 w-6 text-blue-600" />
                  <div className="text-center">
                    <div className="font-medium">Supabase Dashboard</div>
                    <div className="text-xs text-gray-500">View official usage</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-6 w-6 text-green-600 ${refreshing ? 'animate-spin' : ''}`} />
                  <div className="text-center">
                    <div className="font-medium">Refresh Data</div>
                    <div className="text-xs text-gray-500">Update statistics</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => toast.info('Storage cleanup tools coming soon')}
                >
                  <Trash2 className="h-6 w-6 text-red-600" />
                  <div className="text-center">
                    <div className="font-medium">Cleanup Tools</div>
                    <div className="text-xs text-gray-500">Coming soon</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}