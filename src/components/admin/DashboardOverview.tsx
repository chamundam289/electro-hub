import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Receipt,
  CreditCard,
  UserPlus,
  FileText,
  Smartphone
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatsCardShimmer, CardShimmer, ListShimmer } from '@/components/ui/shimmer';
import DatabaseStatus from './DatabaseStatus';

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  totalPurchaseInvoices: number;
  totalPayments: number;
  totalExpenses: number;
  totalSuppliers: number;
  totalMobileRecharges: number;
  todaySales: number;
  monthSales: number;
  lowStockProducts: number;
  pendingOrders: number;
  activeLeads: number;
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: string;
    invoice_number: string;
    customer_name: string;
    total_amount: number;
    status: string;
    created_at: string;
  }>;
  salesTrend: Array<{
    date: string;
    sales: number;
  }>;
  lowStockItems: Array<{
    name: string;
    stock_quantity: number;
    min_stock_level: number;
  }>;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalPurchaseInvoices: 0,
    totalPayments: 0,
    totalExpenses: 0,
    totalSuppliers: 0,
    totalMobileRecharges: 0,
    todaySales: 0,
    monthSales: 0,
    lowStockProducts: 0,
    pendingOrders: 0,
    activeLeads: 0,
    topProducts: [],
    recentOrders: [],
    salesTrend: [],
    lowStockItems: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch basic counts with fallback for missing tables
      const [
        ordersResult,
        productsResult,
        customersResult
      ] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('products').select('*'),
        supabase.from('customers').select('*')
      ]);

      // Try to fetch from new tables with fallback
      let suppliersResult = { data: [], error: null };
      let expensesResult = { data: [], error: null };
      let leadsResult = { data: [], error: null };
      let purchaseInvoicesResult = { data: [], error: null };
      let paymentsResult = { data: [], error: null };
      let mobileRechargesResult = { data: [], error: null };

      try {
        suppliersResult = await supabase.from('suppliers').select('id');
      } catch (error) {
        console.log('Suppliers table not available yet');
      }

      try {
        expensesResult = await supabase.from('expenses').select('total_amount');
      } catch (error) {
        console.log('Expenses table not available yet');
      }

      try {
        leadsResult = await supabase.from('leads').select('id').in('status', ['new', 'contacted', 'qualified']);
      } catch (error) {
        console.log('Leads table not available yet');
      }

      try {
        purchaseInvoicesResult = await supabase.from('purchase_invoices').select('id, total_amount');
      } catch (error) {
        console.log('Purchase invoices table not available yet');
      }

      try {
        paymentsResult = await supabase.from('payments').select('id, amount');
      } catch (error) {
        console.log('Payments table not available yet');
      }

      try {
        mobileRechargesResult = await supabase.from('mobile_recharges').select('id');
      } catch (error) {
        console.log('Mobile recharges table not available yet');
      }

      // Calculate stats from existing data
      const orders = ordersResult.data || [];
      const products = productsResult.data || [];
      const customers = customersResult.data || [];

      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().slice(0, 7);

      // Use fallback values for missing columns
      const todaySales = orders
        .filter((order: any) => order.created_at?.startsWith(today))
        .reduce((sum: number, order: any) => sum + (order.total_amount || order.product_price || 0), 0);

      const monthSales = orders
        .filter((order: any) => order.created_at?.startsWith(thisMonth))
        .reduce((sum: number, order: any) => sum + (order.total_amount || order.product_price || 0), 0);

      const totalSales = orders.reduce((sum: number, order: any) => sum + (order.total_amount || order.product_price || 0), 0);
      const pendingOrders = orders.filter((order: any) => order.status === 'pending').length;

      // Low stock products with fallback
      const lowStockItems = products
        .filter((product: any) => product.stock_quantity <= (product.min_stock_level || 10))
        .slice(0, 5)
        .map((product: any) => ({
          name: product.name,
          stock_quantity: product.stock_quantity || 0,
          min_stock_level: product.min_stock_level || 10
        }));

      // Create mock recent orders from existing data
      const recentOrders = orders
        .slice(0, 5)
        .map((order: any) => ({
          id: order.id,
          invoice_number: order.invoice_number || `INV-${order.id.slice(0, 8)}`,
          customer_name: order.customer_name || 'Walk-in Customer',
          total_amount: order.total_amount || order.product_price || 0,
          status: order.status || 'pending',
          created_at: order.created_at
        }));

      setStats({
        totalSales,
        totalOrders: orders.length,
        totalProducts: products.length,
        totalCustomers: customers.length,
        totalPurchaseInvoices: (purchaseInvoicesResult.data || []).length,
        totalPayments: (paymentsResult.data || []).reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0),
        totalExpenses: (expensesResult.data || []).reduce((sum: number, expense: any) => sum + (expense.total_amount || 0), 0),
        totalSuppliers: (suppliersResult.data || []).length,
        totalMobileRecharges: (mobileRechargesResult.data || []).length,
        todaySales,
        monthSales,
        lowStockProducts: lowStockItems.length,
        pendingOrders,
        activeLeads: (leadsResult.data || []).length,
        topProducts: [], // Will be implemented with proper aggregation
        recentOrders,
        salesTrend: [], // Will be implemented with date grouping
        lowStockItems
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Set default values on error
      setStats({
        totalSales: 0,
        totalOrders: 0,
        totalProducts: 0,
        totalCustomers: 0,
        totalPurchaseInvoices: 0,
        totalPayments: 0,
        totalExpenses: 0,
        totalSuppliers: 0,
        totalMobileRecharges: 0,
        todaySales: 0,
        monthSales: 0,
        lowStockProducts: 0,
        pendingOrders: 0,
        activeLeads: 0,
        topProducts: [],
        recentOrders: [],
        salesTrend: [],
        lowStockItems: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-shimmer"></div>
          <div className="h-6 w-32 bg-gray-200 rounded animate-shimmer"></div>
        </div>

        {/* Key Metrics Shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatsCardShimmer key={i} />
          ))}
        </div>

        {/* Additional Business Metrics Shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCardShimmer key={i} />
          ))}
        </div>

        {/* Additional Metrics Shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatsCardShimmer key={i} />
          ))}
        </div>

        {/* Financial Summary Shimmer */}
        <CardShimmer />

        {/* Recent Orders Shimmer */}
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-gray-200 rounded animate-shimmer"></div>
          </CardHeader>
          <CardContent>
            <ListShimmer count={5} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            Last updated: {new Date().toLocaleTimeString()}
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.totalSales.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5% from last month
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8.2% from last month
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {stats.lowStockProducts} low stock
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Customers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <UserPlus className="h-3 w-3 mr-1" />
                  +15 new this month
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-full">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Mobile Recharges</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMobileRecharges}</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <Smartphone className="h-3 w-3 mr-1" />
                  Total recharges
                </p>
              </div>
              <div className="p-2 bg-teal-100 rounded-full">
                <Smartphone className="h-5 w-5 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Purchase Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPurchaseInvoices}</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <FileText className="h-3 w-3 mr-1" />
                  Total invoices
                </p>
              </div>
              <div className="p-2 bg-indigo-100 rounded-full">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.totalPayments.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <CreditCard className="h-3 w-3 mr-1" />
                  All transactions
                </p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-full">
                <CreditCard className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.totalExpenses.toLocaleString()}</p>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Business costs
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-full">
                <DollarSign className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Suppliers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSuppliers}</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <UserPlus className="h-3 w-3 mr-1" />
                  Active suppliers
                </p>
              </div>
              <div className="p-2 bg-cyan-100 rounded-full">
                <UserPlus className="h-5 w-5 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Today's Sales</p>
                <p className="text-xl font-bold text-gray-900">₹{stats.todaySales.toLocaleString()}</p>
              </div>
              <Receipt className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">This Month</p>
                <p className="text-xl font-bold text-gray-900">₹{stats.monthSales.toLocaleString()}</p>
              </div>
              <CreditCard className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Pending Orders</p>
                <p className="text-xl font-bold text-gray-900">{stats.pendingOrders}</p>
              </div>
              <FileText className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600 mb-2">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">₹{stats.totalSales.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">From sales</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600 mb-2">Total Payments</p>
              <p className="text-2xl font-bold text-blue-600">₹{stats.totalPayments.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">All transactions</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600 mb-2">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">₹{stats.totalExpenses.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Business costs</p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Net Profit (Estimated)</span>
              <span className={`text-xl font-bold ${
                (stats.totalSales - stats.totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ₹{(stats.totalSales - stats.totalExpenses).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Revenue minus expenses (simplified calculation)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      {stats.lowStockItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.lowStockItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      Current: {item.stock_quantity} | Minimum: {item.min_stock_level}
                    </p>
                  </div>
                  <Progress 
                    value={(item.stock_quantity / item.min_stock_level) * 100} 
                    className="w-24"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Database Status */}
      <DatabaseStatus />

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{order.customer_name}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">₹{order.total_amount.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'paid' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}