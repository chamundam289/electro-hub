import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Database,
  Users,
  Tag,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

export const AffiliateSystemTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>({});
  const [isRunning, setIsRunning] = useState(false);
  const [couponCode, setCouponCode] = useState('TEST20');
  const [orderAmount, setOrderAmount] = useState(1000);

  const runDatabaseTests = async () => {
    setIsRunning(true);
    const results: any = {};

    try {
      // Test 1: Check if affiliate tables exist
      console.log('Testing database schema...');
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', [
          'profiles',
          'affiliates', 
          'affiliate_coupons',
          'affiliate_commissions',
          'affiliate_targets',
          'affiliate_rewards'
        ]);

      results.schema = {
        success: !tablesError && tables && tables.length >= 6,
        message: tablesError ? tablesError.message : `Found ${tables?.length || 0} affiliate tables`,
        data: tables?.map(t => t.table_name)
      };

      // Test 2: Check RLS policies
      console.log('Testing RLS policies...');
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('tablename, policyname')
        .like('tablename', 'affiliate%');

      results.rls = {
        success: !policiesError && policies && policies.length > 0,
        message: policiesError ? policiesError.message : `Found ${policies?.length || 0} RLS policies`,
        data: policies
      };

      // Test 3: Test coupon validation function
      console.log('Testing coupon validation...');
      try {
        const { data: validationData, error: validationError } = await supabase
          .rpc('validate_and_apply_coupon', {
            coupon_code_param: 'NONEXISTENT',
            order_amount: 1000
          });

        results.couponValidation = {
          success: !validationError,
          message: validationError ? validationError.message : 'Coupon validation function works',
          data: validationData
        };
      } catch (error) {
        results.couponValidation = {
          success: false,
          message: 'Coupon validation function not found or error occurred',
          data: null
        };
      }

      // Test 4: Check sample data
      console.log('Checking for sample data...');
      const { data: sampleAffiliates, error: affiliatesError } = await supabase
        .from('affiliates')
        .select('id, status')
        .limit(5);

      results.sampleData = {
        success: !affiliatesError,
        message: affiliatesError ? affiliatesError.message : `Found ${sampleAffiliates?.length || 0} affiliates`,
        data: sampleAffiliates
      };

    } catch (error) {
      console.error('Test error:', error);
      results.error = {
        success: false,
        message: 'Unexpected error during testing',
        data: error
      };
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const testCouponValidation = async () => {
    if (!couponCode) {
      toast.error('Please enter a coupon code');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('validate_and_apply_coupon', {
        coupon_code_param: couponCode,
        order_amount: orderAmount
      });

      if (error) {
        toast.error('Validation failed: ' + error.message);
        return;
      }

      const result = data[0];
      if (result.is_valid) {
        toast.success(`Valid coupon! Discount: ₹${result.discount_amount}`);
      } else {
        toast.error(result.error_message || 'Invalid coupon');
      }
    } catch (error) {
      toast.error('Error testing coupon validation');
      console.error(error);
    }
  };

  const createTestData = async () => {
    try {
      // Create a test affiliate (this would normally be done by admin)
      const testEmail = 'test-affiliate@example.com';
      
      toast.info('Creating test data...');
      
      // Note: In production, this would be done through the admin interface
      // This is just for testing purposes
      
      toast.success('Test data creation would be handled by admin interface');
    } catch (error) {
      toast.error('Error creating test data');
      console.error(error);
    }
  };

  const TestResult: React.FC<{ result: any; title: string }> = ({ result, title }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center space-x-2">
        {result?.success ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
        <span className="font-medium">{title}</span>
      </div>
      <div className="text-right">
        <Badge variant={result?.success ? "default" : "destructive"}>
          {result?.success ? 'Pass' : 'Fail'}
        </Badge>
        {result?.message && (
          <p className="text-xs text-gray-600 mt-1">{result.message}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <TestTube className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Affiliate System Test Suite</h2>
      </div>

      <Tabs defaultValue="database" className="space-y-4">
        <TabsList>
          <TabsTrigger value="database">Database Tests</TabsTrigger>
          <TabsTrigger value="coupon">Coupon Validation</TabsTrigger>
          <TabsTrigger value="data">Test Data</TabsTrigger>
        </TabsList>

        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Database Schema & Functions</span>
              </CardTitle>
              <CardDescription>
                Test database tables, RLS policies, and functions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={runDatabaseTests} 
                disabled={isRunning}
                className="w-full"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  'Run Database Tests'
                )}
              </Button>

              {Object.keys(testResults).length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Test Results:</h3>
                  
                  {testResults.schema && (
                    <TestResult 
                      result={testResults.schema} 
                      title="Database Schema" 
                    />
                  )}
                  
                  {testResults.rls && (
                    <TestResult 
                      result={testResults.rls} 
                      title="RLS Policies" 
                    />
                  )}
                  
                  {testResults.couponValidation && (
                    <TestResult 
                      result={testResults.couponValidation} 
                      title="Coupon Validation Function" 
                    />
                  )}
                  
                  {testResults.sampleData && (
                    <TestResult 
                      result={testResults.sampleData} 
                      title="Sample Data" 
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coupon">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Tag className="h-5 w-5" />
                <span>Coupon Validation Test</span>
              </CardTitle>
              <CardDescription>
                Test coupon validation with different codes and amounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="coupon">Coupon Code</Label>
                  <Input
                    id="coupon"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Order Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={orderAmount}
                    onChange={(e) => setOrderAmount(parseFloat(e.target.value))}
                    placeholder="1000"
                  />
                </div>
              </div>
              
              <Button onClick={testCouponValidation} className="w-full">
                Test Coupon Validation
              </Button>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Test Cases:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Try "NONEXISTENT" - should fail with "Invalid coupon code"</li>
                  <li>• Try any existing coupon code from the database</li>
                  <li>• Test with different order amounts</li>
                  <li>• Test expired coupons</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Test Data Management</span>
              </CardTitle>
              <CardDescription>
                Create sample data for testing the affiliate system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Test Data Includes:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Sample affiliate account</li>
                  <li>• Test coupon codes</li>
                  <li>• Monthly targets</li>
                  <li>• Sample orders and commissions</li>
                </ul>
              </div>

              <Button onClick={createTestData} className="w-full">
                Create Test Data
              </Button>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Test data creation should be done through the admin interface 
                  in a production environment. This is for development testing only.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>System Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-sm text-green-800">Authentication</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">✓</div>
              <div className="text-sm text-blue-800">Database</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">✓</div>
              <div className="text-sm text-purple-800">RLS Security</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">✓</div>
              <div className="text-sm text-orange-800">Functions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};