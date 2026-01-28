 import React, { useState, useEffect } from 'react';
import { useAffiliateAuth } from '@/hooks/useAffiliateAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  ShoppingCart, 
  Target, 
  Gift, 
  TrendingUp, 
  Copy,
  LogOut,
  Calendar,
  Award
} from 'lucide-react';
import { toast } from 'sonner';

// Define types locally since they're not in the main types file yet
interface AffiliateDashboardStats {
  total_sales: number;
  total_commission: number;
  pending_commission: number;
  paid_commission: number;
  total_orders: number;
  active_coupons: number;
  current_month_sales: number;
  current_month_orders: number;
  target_progress: number;
  rewards_unlocked: number;
}

interface AffiliateCoupon {
  id: string;
  affiliate_id: string;
  coupon_code: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  used_count: number;
  expiry_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AffiliateCommission {
  id: string;
  affiliate_id: string;
  order_id: string;
  commission_amount: number;
  commission_rate: number;
  order_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  approved_at?: string;
  paid_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  invoice_number?: string;
  customer_name?: string;
}

interface AffiliateTarget {
  id: string;
  affiliate_id: string;
  month_year: string;
  target_sales_amount: number;
  target_orders: number;
  achieved_sales_amount: number;
  achieved_orders: number;
  reward_type?: 'cash' | 'gift' | 'bonus' | 'coupon';
  reward_value?: number;
  reward_description?: string;
  status: 'active' | 'achieved' | 'expired';
  created_at: string;
  updated_at: string;
}

interface AffiliateReward {
  id: string;
  affiliate_id: string;
  target_id: string;
  reward_type: 'cash' | 'gift' | 'bonus' | 'coupon';
  reward_value: number;
  reward_description?: string;
  reward_status: 'locked' | 'unlocked' | 'claimed' | 'paid';
  claimed_at?: string;
  paid_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  target_month_year?: string;
  target_sales_amount?: number;
}

export const AffiliateDashboard: React.FC = () => {
  const { affiliateUser, signOut, loading: authLoading, isAuthenticated } = useAffiliateAuth();
  const [stats, setStats] = useState<AffiliateDashboardStats | null>(null);
  const [coupons, setCoupons] = useState<AffiliateCoupon[]>([]);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [targets, setTargets] = useState<AffiliateTarget[]>([]);
  const [rewards, setRewards] = useState<AffiliateReward[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated
  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please log in to access your affiliate dashboard</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.href = '/affiliate/login'}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    if (affiliateUser) {
      fetchDashboardData();
    }
  }, [affiliateUser]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchCoupons(),
        fetchCommissions(),
        fetchTargets(),
        fetchRewards()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // For now, set default stats since we can't access affiliate tables directly
      // In a real implementation, you would need to update the Supabase types
      // or use raw SQL queries
      setStats({
        total_sales: 0,
        total_commission: 0,
        pending_commission: 0,
        paid_commission: 0,
        total_orders: 0,
        active_coupons: 0,
        current_month_sales: 0,
        current_month_orders: 0,
        target_progress: 0,
        rewards_unlocked: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        total_sales: 0,
        total_commission: 0,
        pending_commission: 0,
        paid_commission: 0,
        total_orders: 0,
        active_coupons: 0,
        current_month_sales: 0,
        current_month_orders: 0,
        target_progress: 0,
        rewards_unlocked: 0
      });
    }
  };

  const fetchCoupons = async () => {
    try {
      // Set empty array for now
      setCoupons([]);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setCoupons([]);
    }
  };

  const fetchCommissions = async () => {
    try {
      // Set empty array for now
      setCommissions([]);
    } catch (error) {
      console.error('Error fetching commissions:', error);
      setCommissions([]);
    }
  };

  const fetchTargets = async () => {
    try {
      // Set empty array for now
      setTargets([]);
    } catch (error) {
      console.error('Error fetching targets:', error);
      setTargets([]);
    }
  };

  const fetchRewards = async () => {
    try {
      // Set empty array for now
      setRewards([]);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      setRewards([]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'achieved': return 'bg-purple-100 text-purple-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'unlocked': return 'bg-blue-100 text-blue-800';
      case 'claimed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Affiliate Dashboard</h1>
              <p className="text-gray-600">Welcome back, {affiliateUser?.full_name || affiliateUser?.email}</p>
            </div>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats?.total_sales?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                From {stats?.total_orders || 0} orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats?.total_commission?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                Pending: ₹{stats?.pending_commission?.toLocaleString() || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.active_coupons || 0}</div>
              <p className="text-xs text-muted-foreground">
                Ready to use
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rewards Unlocked</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.rewards_unlocked || 0}</div>
              <p className="text-xs text-muted-foreground">
                Available rewards
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Target Progress */}
        {targets.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Monthly Target Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Sales Target</span>
                    <span>₹{stats?.current_month_sales?.toLocaleString()} / ₹{targets[0]?.target_sales_amount?.toLocaleString()}</span>
                  </div>
                  <Progress value={stats?.target_progress || 0} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Orders This Month:</span>
                    <span className="ml-2 font-semibold">{stats?.current_month_orders} / {targets[0]?.target_orders}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Reward:</span>
                    <span className="ml-2 font-semibold">
                      {targets[0]?.reward_type} - ₹{targets[0]?.reward_value}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Setup Notice */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Setup Required</CardTitle>
            <CardDescription className="text-blue-700">
              The affiliate system database tables need to be created to display live data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-blue-700">
              <p>To complete the setup:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Run the affiliate system database migration</li>
                <li>Create affiliate accounts through the admin panel</li>
                <li>Assign coupons and set targets</li>
                <li>Start tracking sales and commissions</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="coupons" className="space-y-4">
          <TabsList>
            <TabsTrigger value="coupons">My Coupons</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
            <TabsTrigger value="targets">Targets</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
          </TabsList>

          <TabsContent value="coupons">
            <Card>
              <CardHeader>
                <CardTitle>My Coupons</CardTitle>
                <CardDescription>
                  Share these coupon codes with your customers to earn commissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Coupons Yet
                  </h3>
                  <p className="text-gray-600">
                    Contact your admin to get coupon codes assigned to your account.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <CardTitle>Commission History</CardTitle>
                <CardDescription>
                  Track your earnings from successful sales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Commissions Yet
                  </h3>
                  <p className="text-gray-600">
                    Start sharing your coupons to earn commissions on sales!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="targets">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Targets</CardTitle>
                <CardDescription>
                  Your sales targets and progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Targets Set
                  </h3>
                  <p className="text-gray-600">
                    Your admin will assign monthly targets and rewards soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rewards">
            <Card>
              <CardHeader>
                <CardTitle>Rewards</CardTitle>
                <CardDescription>
                  Rewards earned from achieving targets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Rewards Yet
                  </h3>
                  <p className="text-gray-600">
                    Achieve your targets to unlock rewards!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};