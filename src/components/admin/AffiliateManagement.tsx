import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Users, 
  Plus, 
  Database,
  CheckCircle,
  AlertTriangle,
  Info,
  UserPlus,
  Ticket,
  Target,
  DollarSign,
  Copy,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SimpleErrorBoundary } from '@/components/ErrorBoundary';

interface CreateAffiliateForm {
  email: string;
  mobile: string;
  password: string;
  fullName: string;
}

interface UpdateProductCommissionForm {
  productId: string;
  commissionType: 'percentage' | 'fixed';
  commissionValue: string;
  affiliateEnabled: boolean;
}

interface CreateAffiliateCouponForm {
  affiliateId: string;
  productId: string; // empty means all products
  couponCode: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  minOrderAmount: string;
  usageLimit: string;
  expiryDate: string;
}

export const AffiliateManagement: React.FC = () => {
  return (
    <SimpleErrorBoundary>
      <AffiliateManagementContent />
    </SimpleErrorBoundary>
  );
};

const AffiliateManagementContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('setup');
  const [isCreatingAffiliate, setIsCreatingAffiliate] = useState(false);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);
  const [databaseReady, setDatabaseReady] = useState(false);
  const [checkingDatabase, setCheckingDatabase] = useState(false);
  
  const [affiliateForm, setAffiliateForm] = useState<CreateAffiliateForm>({
    email: '',
    mobile: '',
    password: '',
    fullName: ''
  });

  const [productCommissionForm, setProductCommissionForm] = useState<UpdateProductCommissionForm>({
    productId: '',
    commissionType: 'percentage',
    commissionValue: '',
    affiliateEnabled: true
  });

  const [couponForm, setCouponForm] = useState<CreateAffiliateCouponForm>({
    affiliateId: '',
    productId: 'all-products', // default to all products
    couponCode: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    usageLimit: '',
    expiryDate: ''
  });

  // Check if database tables exist
  const checkDatabaseSetup = async () => {
    setCheckingDatabase(true);
    try {
      // Try to query the new affiliate_users table
      const { data, error } = await supabase
        .from('affiliate_users' as any)
        .select('id')
        .limit(1);
      
      if (!error) {
        setDatabaseReady(true);
        toast.success('Database setup verified! You can now use the Management tab.');
      } else {
        setDatabaseReady(false);
        // Don't show error toast for expected "table doesn't exist" scenarios
        if (error.code === 'PGRST116' || error.message.includes('does not exist') || 
            error.message.includes('permission denied')) {
          console.log('Database setup needed:', error.message);
        } else {
          console.error('Unexpected database error:', error);
          toast.error('Database connection error: ' + error.message);
        }
      }
    } catch (error: any) {
      setDatabaseReady(false);
      console.log('Database check failed (expected if not set up):', error.message);
    } finally {
      setCheckingDatabase(false);
    }
  };

  useEffect(() => {
    // Check database on component mount
    checkDatabaseSetup();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleCreateAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!databaseReady) {
      toast.error('Please set up the database first by running the SQL script');
      setActiveTab('setup');
      return;
    }
    
    setIsCreatingAffiliate(true);

    try {
      // Create affiliate account using new table name
      const { data, error } = await supabase
        .from('affiliate_users' as any)
        .insert({
          email: affiliateForm.email,
          mobile: affiliateForm.mobile,
          password_hash: affiliateForm.password, // In real app, hash this properly
          full_name: affiliateForm.fullName,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('Affiliate account created successfully!');
      setAffiliateForm({
        email: '',
        mobile: '',
        password: '',
        fullName: ''
      });
    } catch (error: any) {
      console.error('Error creating affiliate:', error);
      toast.error(error.message || 'Failed to create affiliate account');
    } finally {
      setIsCreatingAffiliate(false);
    }
  };

  const handleUpdateProductCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!databaseReady) {
      toast.error('Please set up the database first by running the SQL script');
      setActiveTab('setup');
      return;
    }
    
    setIsUpdatingProduct(true);

    try {
      const { error } = await supabase
        .from('products' as any)
        .update({
          affiliate_commission_type: productCommissionForm.commissionType,
          affiliate_commission_value: parseFloat(productCommissionForm.commissionValue),
          affiliate_enabled: productCommissionForm.affiliateEnabled
        })
        .eq('id', productCommissionForm.productId);

      if (error) {
        throw error;
      }

      toast.success('Product commission settings updated!');
      setProductCommissionForm({
        productId: '',
        commissionType: 'percentage',
        commissionValue: '',
        affiliateEnabled: true
      });
    } catch (error: any) {
      console.error('Error updating product commission:', error);
      toast.error(error.message || 'Failed to update product commission');
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!databaseReady) {
      toast.error('Please set up the database first by running the SQL script');
      setActiveTab('setup');
      return;
    }
    
    setIsCreatingCoupon(true);

    try {
      const { error } = await supabase
        .from('affiliate_discount_codes' as any)
        .insert({
          affiliate_id: couponForm.affiliateId,
          product_id: couponForm.productId === 'all-products' ? null : couponForm.productId, // null means all products
          coupon_code: couponForm.couponCode.toUpperCase(),
          discount_type: couponForm.discountType,
          discount_value: parseFloat(couponForm.discountValue),
          min_order_amount: couponForm.minOrderAmount ? parseFloat(couponForm.minOrderAmount) : 0,
          usage_limit: couponForm.usageLimit ? parseInt(couponForm.usageLimit) : null,
          expiry_date: couponForm.expiryDate || null,
          is_active: true
        });

      if (error) {
        throw error;
      }

      toast.success('Affiliate coupon created successfully!');
      setCouponForm({
        affiliateId: '',
        productId: 'all-products',
        couponCode: '',
        discountType: 'percentage',
        discountValue: '',
        minOrderAmount: '',
        usageLimit: '',
        expiryDate: ''
      });
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      toast.error(error.message || 'Failed to create coupon');
    } finally {
      setIsCreatingCoupon(false);
    }
  };

  const setupSteps = [
    {
      id: 1,
      title: 'Run Database Setup Script',
      description: 'Execute the new affiliate system V2 SQL to create required tables',
      status: databaseReady ? 'completed' : 'pending',
      action: 'Copy and run the SQL from new_affiliate_system_v2.sql in Supabase SQL Editor',
      sqlFile: 'new_affiliate_system_v2.sql'
    },
    {
      id: 2,
      title: 'Verify Database Connection',
      description: 'Check that new affiliate tables are accessible and working',
      status: databaseReady ? 'completed' : 'pending',
      action: 'Click "Check Database Setup" button below'
    },
    {
      id: 3,
      title: 'Test Affiliate Creation',
      description: 'Create your first affiliate account to verify everything works',
      status: databaseReady ? 'ready' : 'pending',
      action: 'Use the "Create Affiliate Account" form in the Management tab'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Affiliate Marketing System</h2>
          <p className="text-gray-600">Manage affiliates, coupons, and commissions</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="setup">
            Setup Guide
            {!databaseReady && <Badge variant="destructive" className="ml-2 text-xs">Required</Badge>}
          </TabsTrigger>
          <TabsTrigger value="management" disabled={!databaseReady}>
            Management
            {databaseReady && <Badge variant="default" className="ml-2 text-xs">Ready</Badge>}
          </TabsTrigger>
          <TabsTrigger value="guide">Admin Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="setup">
          <div className="space-y-6">
            <Alert className={databaseReady ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
              <Database className="h-4 w-4" />
              <AlertTitle>
                {databaseReady ? "✅ Database Setup Complete!" : "⚠️ Database Setup Required"}
              </AlertTitle>
              <AlertDescription>
                {databaseReady 
                  ? "All affiliate system tables are ready. You can now manage affiliates in the Management tab."
                  : "The affiliate system tables haven't been created yet. Please run the SQL script to set up the database tables."
                }
              </AlertDescription>
            </Alert>

            <div className="grid gap-4">
              {setupSteps.map((step) => (
                <Card key={step.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                          step.status === 'completed' ? 'bg-green-100 text-green-600' :
                          step.status === 'ready' ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {step.status === 'completed' ? <CheckCircle className="w-4 h-4" /> : step.id}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{step.title}</CardTitle>
                          <CardDescription>{step.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={
                        step.status === 'completed' ? 'default' :
                        step.status === 'ready' ? 'secondary' : 'outline'
                      }>
                        {step.status === 'completed' ? 'Completed' :
                         step.status === 'ready' ? 'Ready' : 'Pending'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Action:</strong> {step.action}
                      </p>
                      {step.sqlFile && (
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(`-- Copy content from: ${step.sqlFile}\n-- Then paste and run in Supabase SQL Editor`)}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy Instructions
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open('https://supabase.com/dashboard/project/_/sql', '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Open Supabase SQL Editor
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Database Status Check</CardTitle>
                <CardDescription className="text-blue-700">
                  Verify that the affiliate system tables have been created successfully
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${databaseReady ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="font-medium">
                      {databaseReady ? 'Database Ready' : 'Database Not Ready'}
                    </span>
                  </div>
                  <Button 
                    onClick={checkDatabaseSetup} 
                    disabled={checkingDatabase}
                    variant="outline"
                  >
                    {checkingDatabase ? 'Checking...' : 'Check Database Setup'}
                  </Button>
                </div>
                {!databaseReady && (
                  <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-yellow-800">
                      <strong>Next Step:</strong> The affiliate system tables don't exist yet. Please:
                      <br />
                      1. Copy the SQL content from <code className="mx-1 px-1 bg-yellow-100 rounded">new_affiliate_system_v2.sql</code>
                      <br />
                      2. Paste and run it in your Supabase SQL Editor
                      <br />
                      3. Click "Check Database Setup" again to verify
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="management">
          <div className="space-y-6">
            {!databaseReady && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-red-900">Database Setup Required</AlertTitle>
                <AlertDescription className="text-red-800">
                  Please complete the database setup in the "Setup Guide" tab before using the management features.
                </AlertDescription>
              </Alert>
            )}

            {/* Three Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Create Affiliate Account */}
              <Card className={!databaseReady ? "opacity-50" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserPlus className="h-5 w-5 mr-2" />
                    Create Affiliate Account
                  </CardTitle>
                  <CardDescription>
                    Manually create affiliate with login credentials
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateAffiliate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={affiliateForm.email}
                        onChange={(e) => setAffiliateForm({...affiliateForm, email: e.target.value})}
                        placeholder="affiliate@example.com"
                        required
                        disabled={!databaseReady}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobile">Mobile Number *</Label>
                      <Input
                        id="mobile"
                        value={affiliateForm.mobile}
                        onChange={(e) => setAffiliateForm({...affiliateForm, mobile: e.target.value})}
                        placeholder="+91 9876543210"
                        required
                        disabled={!databaseReady}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={affiliateForm.password}
                        onChange={(e) => setAffiliateForm({...affiliateForm, password: e.target.value})}
                        placeholder="Enter password"
                        required
                        disabled={!databaseReady}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={affiliateForm.fullName}
                        onChange={(e) => setAffiliateForm({...affiliateForm, fullName: e.target.value})}
                        placeholder="John Doe"
                        required
                        disabled={!databaseReady}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isCreatingAffiliate || !databaseReady}
                    >
                      {isCreatingAffiliate ? 'Creating...' : 'Create Affiliate Account'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Set Product Commission */}
              <Card className={!databaseReady ? "opacity-50" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Product Commission
                  </CardTitle>
                  <CardDescription>
                    Set commission rates for products
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProductCommission} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="productId">Select Product *</Label>
                      <Select 
                        value={productCommissionForm.productId} 
                        onValueChange={(value) => 
                          setProductCommissionForm({...productCommissionForm, productId: value})
                        }
                        disabled={!databaseReady}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose product" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="product-1">iPhone 15 - ₹75,000</SelectItem>
                          <SelectItem value="product-2">Samsung Galaxy - ₹65,000</SelectItem>
                          <SelectItem value="product-3">MacBook Pro - ₹1,50,000</SelectItem>
                          <SelectItem value="product-4">iPad Pro - ₹80,000</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="commissionType">Commission Type *</Label>
                      <Select 
                        value={productCommissionForm.commissionType} 
                        onValueChange={(value: 'percentage' | 'fixed') => 
                          setProductCommissionForm({...productCommissionForm, commissionType: value})
                        }
                        disabled={!databaseReady}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="commissionValue">
                        Commission Value *
                        {productCommissionForm.commissionType === 'percentage' ? ' (%)' : ' (₹)'}
                      </Label>
                      <Input
                        id="commissionValue"
                        type="number"
                        step="0.01"
                        value={productCommissionForm.commissionValue}
                        onChange={(e) => setProductCommissionForm({...productCommissionForm, commissionValue: e.target.value})}
                        placeholder={productCommissionForm.commissionType === 'percentage' ? '5' : '2000'}
                        required
                        disabled={!databaseReady}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="affiliateEnabled"
                        checked={productCommissionForm.affiliateEnabled}
                        onChange={(e) => setProductCommissionForm({...productCommissionForm, affiliateEnabled: e.target.checked})}
                        className="rounded"
                        disabled={!databaseReady}
                      />
                      <Label htmlFor="affiliateEnabled">Enable for Affiliates</Label>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isUpdatingProduct || !databaseReady}
                    >
                      {isUpdatingProduct ? 'Updating...' : 'Update Product Commission'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Create Affiliate Coupon */}
              <Card className={!databaseReady ? "opacity-50" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Ticket className="h-5 w-5 mr-2" />
                    Affiliate Coupon
                  </CardTitle>
                  <CardDescription>
                    Create coupon for affiliate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateCoupon} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="affiliateId">Select Affiliate *</Label>
                      <Select 
                        value={couponForm.affiliateId} 
                        onValueChange={(value) => 
                          setCouponForm({...couponForm, affiliateId: value})
                        }
                        disabled={!databaseReady}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose affiliate" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="affiliate-1">John Doe (john@example.com)</SelectItem>
                          <SelectItem value="affiliate-2">Jane Smith (jane@example.com)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="productId">Product (Optional)</Label>
                      <Select 
                        value={couponForm.productId} 
                        onValueChange={(value) => 
                          setCouponForm({...couponForm, productId: value})
                        }
                        disabled={!databaseReady}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All products" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-products">All Products</SelectItem>
                          <SelectItem value="product-1">iPhone 15</SelectItem>
                          <SelectItem value="product-2">Samsung Galaxy</SelectItem>
                          <SelectItem value="product-3">MacBook Pro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="couponCode">Coupon Code *</Label>
                      <Input
                        id="couponCode"
                        value={couponForm.couponCode}
                        onChange={(e) => setCouponForm({...couponForm, couponCode: e.target.value})}
                        placeholder="SAVE20"
                        required
                        disabled={!databaseReady}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discountType">Discount Type *</Label>
                      <Select 
                        value={couponForm.discountType} 
                        onValueChange={(value: 'percentage' | 'fixed') => 
                          setCouponForm({...couponForm, discountType: value})
                        }
                        disabled={!databaseReady}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discountValue">
                        Discount Value *
                        {couponForm.discountType === 'percentage' ? ' (%)' : ' (₹)'}
                      </Label>
                      <Input
                        id="discountValue"
                        type="number"
                        step="0.01"
                        value={couponForm.discountValue}
                        onChange={(e) => setCouponForm({...couponForm, discountValue: e.target.value})}
                        placeholder={couponForm.discountType === 'percentage' ? '10' : '1000'}
                        required
                        disabled={!databaseReady}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="usageLimit">Usage Limit</Label>
                      <Input
                        id="usageLimit"
                        type="number"
                        value={couponForm.usageLimit}
                        onChange={(e) => setCouponForm({...couponForm, usageLimit: e.target.value})}
                        placeholder="100"
                        disabled={!databaseReady}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isCreatingCoupon || !databaseReady}
                    >
                      {isCreatingCoupon ? 'Creating...' : 'Create Coupon'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">Manual Account Creation</h3>
                      <p className="text-sm text-blue-700">Admin creates affiliate accounts with email & password</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900">Product-Level Commission</h3>
                      <p className="text-sm text-green-700">Set commission rates when adding products</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Ticket className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-purple-900">Flexible Coupons</h3>
                      <p className="text-sm text-purple-700">Product-specific or general coupons</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="guide">
          <Card>
            <CardHeader>
              <CardTitle>Product-Based Affiliate System Guide</CardTitle>
              <CardDescription>
                How to manage product assignments and commissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>New Product-Based System</AlertTitle>
                  <AlertDescription>
                    Affiliates now earn commission only on products specifically assigned to them by admin.
                    Each product can have different commission rates.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Admin Workflow</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                        <div>
                          <h5 className="font-medium">Create Affiliate Account</h5>
                          <p className="text-sm text-gray-600">Add affiliate with basic details (no commission rates needed here)</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                        <div>
                          <h5 className="font-medium">Assign Products</h5>
                          <p className="text-sm text-gray-600">Select affiliate, choose product, set commission rate for that specific product</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                        <div>
                          <h5 className="font-medium">Create Product Coupons</h5>
                          <p className="text-sm text-gray-600">Generate coupons that work only for assigned products</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">4</div>
                        <div>
                          <h5 className="font-medium">Monitor & Pay</h5>
                          <p className="text-sm text-gray-600">Track sales, approve commissions, process payments</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Key Features</h4>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <h5 className="font-medium text-green-900">Product-Specific Commission</h5>
                        <p className="text-sm text-green-700">Different commission rates for different products</p>
                      </div>

                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h5 className="font-medium text-blue-900">Targeted Coupons</h5>
                        <p className="text-sm text-blue-700">Coupons work only for assigned products</p>
                      </div>

                      <div className="p-3 bg-purple-50 rounded-lg">
                        <h5 className="font-medium text-purple-900">Flexible Rates</h5>
                        <p className="text-sm text-purple-700">Percentage or fixed amount per product</p>
                      </div>

                      <div className="p-3 bg-orange-50 rounded-lg">
                        <h5 className="font-medium text-orange-900">Admin Control</h5>
                        <p className="text-sm text-orange-700">Full control over product assignments</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-900 mb-2">Example Scenario</h4>
                  <div className="text-sm text-yellow-800 space-y-2">
                    <p><strong>Affiliate:</strong> John Doe</p>
                    <p><strong>Assigned Products:</strong></p>
                    <ul className="ml-4 space-y-1">
                      <li>• iPhone 15 (₹75,000) → 5% commission = ₹3,750 per sale</li>
                      <li>• MacBook Pro (₹1,50,000) → ₹5,000 fixed commission per sale</li>
                    </ul>
                    <p><strong>Coupons:</strong></p>
                    <ul className="ml-4 space-y-1">
                      <li>• "IPHONE10" → 10% off iPhone 15 only</li>
                      <li>• "MACBOOK5K" → ₹5,000 off MacBook Pro only</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Database Setup Required</h4>
                  <div className="space-y-1 text-sm text-blue-800">
                    <div>□ Run <code>new_affiliate_system_v2.sql</code></div>
                    <div>□ This creates new tables for the manual affiliate system</div>
                    <div>□ Updates commission calculation logic</div>
                    <div>□ Enables product-specific coupon validation</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};