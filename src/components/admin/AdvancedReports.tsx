import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Calendar,
  Download,
  FileText,
  PieChart,
  Activity,
  Target,
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ReportData {
  // General metrics
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  averageOrderValue: number;
  
  // Products data
  products: Array<{
    id: string;
    name: string;
    sku?: string;
    price: number;
    stock_quantity: number;
    category?: string;
    is_visible: boolean;
    created_at: string;
  }>;
  
  // Orders data
  orders: Array<{
    id: string;
    invoice_number?: string;
    customer_name?: string;
    total_amount?: number;
    status: string;
    payment_status?: string;
    payment_method?: string;
    created_at: string;
  }>;
  
  // Sales invoices (same as orders but with different context)
  salesInvoices: Array<{
    id: string;
    invoice_number?: string;
    customer_name?: string;
    subtotal?: number;
    tax_amount?: number;
    total_amount?: number;
    payment_status?: string;
    created_at: string;
  }>;
  
  // Sales returns
  salesReturns: Array<{
    id: string;
    return_number: string;
    customer_name: string;
    total_amount: number;
    refund_status: string;
    reason?: string;
    created_at: string;
  }>;
  
  // Purchase invoices
  purchaseInvoices: Array<{
    id: string;
    invoice_number: string;
    supplier_name?: string;
    total_amount: number;
    payment_status: string;
    status: string;
    created_at: string;
  }>;
  
  // Purchase returns
  purchaseReturns: Array<{
    id: string;
    return_number: string;
    supplier_name?: string;
    total_amount: number;
    status: string;
    reason?: string;
    created_at: string;
  }>;
  
  // Payments
  payments: Array<{
    id: string;
    payment_number: string;
    payment_type: string;
    payment_method: string;
    amount: number;
    payment_date: string;
    customer_name?: string;
    supplier_name?: string;
    created_at: string;
  }>;
  
  // Expenses
  expenses: Array<{
    id: string;
    expense_number: string;
    title: string;
    category_name?: string;
    amount: number;
    total_amount: number;
    payment_status: string;
    expense_date: string;
    created_at: string;
  }>;
  
  // Leads
  leads: Array<{
    id: string;
    lead_number: string;
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    status: string;
    priority: string;
    estimated_value?: number;
    source?: string;
    created_at: string;
  }>;
  
  // Legacy fields for backward compatibility
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  topCustomers: Array<{
    name: string;
    orders: number;
    totalSpent: number;
  }>;
  salesByDay: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  orderStatus: Array<{
    status: string;
    count: number;
  }>;
}

export default function AdvancedReports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('weekly');
  const [reportCategory, setReportCategory] = useState('overview');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    generateReport();
  }, [reportType]);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now);

    switch (reportType) {
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) return null;
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate };
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      const dateRange = getDateRange();
      if (!dateRange) {
        toast.error('Please select valid date range for custom reports');
        return;
      }

      const { startDate, endDate } = dateRange;

      // Validate date range
      if (startDate > endDate) {
        toast.error('Start date cannot be after end date');
        return;
      }

      // Check if date range is too large (more than 1 year)
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 365) {
        toast.error('Date range cannot exceed 1 year');
        return;
      }

      await fetchReportData(startDate, endDate);

    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateReportWithMessage = async () => {
    try {
      setLoading(true);
      const dateRange = getDateRange();
      if (!dateRange) {
        toast.error('Please select valid date range for custom reports');
        return;
      }

      const { startDate, endDate } = dateRange;

      // Validate date range
      if (startDate > endDate) {
        toast.error('Start date cannot be after end date');
        return;
      }

      // Check if date range is too large (more than 1 year)
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 365) {
        toast.error('Date range cannot exceed 1 year');
        return;
      }

      toast.info(`Generating ${reportType} report for ${daysDiff} days...`);

      await fetchReportData(startDate, endDate);

      toast.success('Report generated successfully!');

    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReportData = async (startDate: Date, endDate: Date) => {
      // Fetch all data in parallel for better performance
      const [
        ordersResult,
        customersResult,
        productsResult,
        salesReturnsResult,
        purchaseInvoicesResult,
        purchaseReturnsResult,
        paymentsResult,
        expensesResult,
        leadsResult
      ] = await Promise.allSettled([
        // Orders data
        supabase
          .from('orders')
          .select(`
            *,
            customers(name, phone),
            order_items(
              product_name,
              quantity,
              unit_price,
              line_total
            )
          `)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),

        // Customers data
        supabase
          .from('customers')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),

        // Products data
        supabase
          .from('products')
          .select('*'),

        // Sales returns data
        supabase
          .from('sales_returns')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),

        // Purchase invoices data
        supabase
          .from('purchase_invoices')
          .select(`
            *,
            suppliers(name)
          `)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),

        // Purchase returns data
        supabase
          .from('purchase_returns')
          .select(`
            *,
            suppliers(name)
          `)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),

        // Payments data
        supabase
          .from('payments')
          .select(`
            *,
            customers(name),
            suppliers(name)
          `)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),

        // Expenses data
        supabase
          .from('expenses')
          .select(`
            *,
            expense_categories(name)
          `)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),

        // Leads data
        supabase
          .from('leads')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
      ]);

      // Process results and handle errors
      const orders = ordersResult.status === 'fulfilled' ? ordersResult.value.data || [] : [];
      const customers = customersResult.status === 'fulfilled' ? customersResult.value.data || [] : [];
      const products = productsResult.status === 'fulfilled' ? productsResult.value.data || [] : [];
      const salesReturns = salesReturnsResult.status === 'fulfilled' ? salesReturnsResult.value.data || [] : [];
      const purchaseInvoices = purchaseInvoicesResult.status === 'fulfilled' ? purchaseInvoicesResult.value.data || [] : [];
      const purchaseReturns = purchaseReturnsResult.status === 'fulfilled' ? purchaseReturnsResult.value.data || [] : [];
      const payments = paymentsResult.status === 'fulfilled' ? paymentsResult.value.data || [] : [];
      const expenses = expensesResult.status === 'fulfilled' ? expensesResult.value.data || [] : [];
      const leads = leadsResult.status === 'fulfilled' ? leadsResult.value.data || [] : [];

      // Check for any errors
      const errors = [
        ordersResult,
        customersResult,
        productsResult,
        salesReturnsResult,
        purchaseInvoicesResult,
        purchaseReturnsResult,
        paymentsResult,
        expensesResult,
        leadsResult
      ].filter(result => result.status === 'rejected');

      if (errors.length > 0) {
        console.warn('Some data could not be fetched:', errors);
        toast.warning('Some data could not be loaded, but report will continue with available data');
      }

      // Process all data
      const processedData = processAllReportData(
        orders,
        customers,
        products,
        salesReturns,
        purchaseInvoices,
        purchaseReturns,
        payments,
        expenses,
        leads
      );

      setReportData(processedData);

      return { orders, customers, products, salesReturns, purchaseInvoices, purchaseReturns, payments, expenses, leads };
  };

  const processAllReportData = (
    orders: any[],
    customers: any[],
    products: any[],
    salesReturns: any[],
    purchaseInvoices: any[],
    purchaseReturns: any[],
    payments: any[],
    expenses: any[],
    leads: any[]
  ): ReportData => {
    // Calculate totals
    const totalSales = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const totalOrders = orders.length;
    const totalCustomers = customers.length;
    const totalProducts = products.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Process legacy data for backward compatibility
    const legacyData = processReportData(orders, customers, products);

    // Process products data
    const processedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      stock_quantity: product.stock_quantity,
      category: product.category_id,
      is_visible: product.is_visible,
      created_at: product.created_at
    }));

    // Process orders data
    const processedOrders = orders.map(order => ({
      id: order.id,
      invoice_number: order.invoice_number,
      customer_name: order.customers?.name || order.customer_name,
      total_amount: order.total_amount,
      status: order.status,
      payment_status: order.payment_status,
      payment_method: order.payment_method,
      created_at: order.created_at
    }));

    // Process sales invoices (same as orders but different context)
    const processedSalesInvoices = orders.map(order => ({
      id: order.id,
      invoice_number: order.invoice_number,
      customer_name: order.customers?.name || order.customer_name,
      subtotal: order.subtotal,
      tax_amount: order.tax_amount,
      total_amount: order.total_amount,
      payment_status: order.payment_status,
      created_at: order.created_at
    }));

    // Process sales returns data
    const processedSalesReturns = salesReturns.map(returnItem => ({
      id: returnItem.id,
      return_number: returnItem.return_number,
      customer_name: returnItem.customer_name,
      total_amount: returnItem.total_amount,
      refund_status: returnItem.refund_status,
      reason: returnItem.reason,
      created_at: returnItem.created_at
    }));

    // Process purchase invoices data
    const processedPurchaseInvoices = purchaseInvoices.map(invoice => ({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      supplier_name: invoice.suppliers?.name,
      total_amount: invoice.total_amount,
      payment_status: invoice.payment_status,
      status: invoice.status,
      created_at: invoice.created_at
    }));

    // Process purchase returns data
    const processedPurchaseReturns = purchaseReturns.map(returnItem => ({
      id: returnItem.id,
      return_number: returnItem.return_number,
      supplier_name: returnItem.suppliers?.name,
      total_amount: returnItem.total_amount,
      status: returnItem.status,
      reason: returnItem.reason,
      created_at: returnItem.created_at
    }));

    // Process payments data
    const processedPayments = payments.map(payment => ({
      id: payment.id,
      payment_number: payment.payment_number,
      payment_type: payment.payment_type,
      payment_method: payment.payment_method,
      amount: payment.amount,
      payment_date: payment.payment_date,
      customer_name: payment.customers?.name,
      supplier_name: payment.suppliers?.name,
      created_at: payment.created_at
    }));

    // Process expenses data
    const processedExpenses = expenses.map(expense => ({
      id: expense.id,
      expense_number: expense.expense_number,
      title: expense.title,
      category_name: expense.expense_categories?.name,
      amount: expense.amount,
      total_amount: expense.total_amount,
      payment_status: expense.payment_status,
      expense_date: expense.expense_date,
      created_at: expense.created_at
    }));

    // Process leads data
    const processedLeads = leads.map(lead => ({
      id: lead.id,
      lead_number: lead.lead_number,
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      priority: lead.priority,
      estimated_value: lead.estimated_value,
      source: lead.source,
      created_at: lead.created_at
    }));

    return {
      totalSales,
      totalOrders,
      totalCustomers,
      totalProducts,
      averageOrderValue,
      products: processedProducts,
      orders: processedOrders,
      salesInvoices: processedSalesInvoices,
      salesReturns: processedSalesReturns,
      purchaseInvoices: processedPurchaseInvoices,
      purchaseReturns: processedPurchaseReturns,
      payments: processedPayments,
      expenses: processedExpenses,
      leads: processedLeads,
      // Legacy data for backward compatibility
      topProducts: legacyData.topProducts,
      topCustomers: legacyData.topCustomers,
      salesByDay: legacyData.salesByDay,
      paymentMethods: legacyData.paymentMethods,
      orderStatus: legacyData.orderStatus
    };
  };

  const processReportData = (orders: any[], customers: any[], products: any[]) => {
    // Calculate totals
    const totalSales = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Top products
    const productSales: { [key: string]: { quantity: number; revenue: number } } = {};
    orders.forEach(order => {
      order.order_items?.forEach((item: any) => {
        if (!productSales[item.product_name]) {
          productSales[item.product_name] = { quantity: 0, revenue: 0 };
        }
        productSales[item.product_name].quantity += item.quantity;
        productSales[item.product_name].revenue += item.line_total;
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Top customers
    const customerSales: { [key: string]: { orders: number; totalSpent: number } } = {};
    orders.forEach(order => {
      const customerName = order.customers?.name || order.customer_name || 'Walk-in Customer';
      if (!customerSales[customerName]) {
        customerSales[customerName] = { orders: 0, totalSpent: 0 };
      }
      customerSales[customerName].orders += 1;
      customerSales[customerName].totalSpent += order.total_amount || 0;
    });

    const topCustomers = Object.entries(customerSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Sales by day
    const salesByDay: { [key: string]: { sales: number; orders: number } } = {};
    orders.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!salesByDay[date]) {
        salesByDay[date] = { sales: 0, orders: 0 };
      }
      salesByDay[date].sales += order.total_amount || 0;
      salesByDay[date].orders += 1;
    });

    const salesByDayArray = Object.entries(salesByDay)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Payment methods
    const paymentMethodStats: { [key: string]: { count: number; amount: number } } = {};
    orders.forEach(order => {
      const method = order.payment_method || 'cash';
      if (!paymentMethodStats[method]) {
        paymentMethodStats[method] = { count: 0, amount: 0 };
      }
      paymentMethodStats[method].count += 1;
      paymentMethodStats[method].amount += order.total_amount || 0;
    });

    const paymentMethods = Object.entries(paymentMethodStats)
      .map(([method, data]) => ({ method, ...data }));

    // Order status
    const orderStatusStats: { [key: string]: number } = {};
    orders.forEach(order => {
      const status = order.status || 'pending';
      orderStatusStats[status] = (orderStatusStats[status] || 0) + 1;
    });

    const orderStatus = Object.entries(orderStatusStats)
      .map(([status, count]) => ({ status, count }));

    return {
      topProducts,
      topCustomers,
      salesByDay: salesByDayArray,
      paymentMethods,
      orderStatus
    };
  };

  const exportToExcel = () => {
    if (!reportData) return;

    try {
      // Create a new workbook
      const workbook = XLSX.utils.book_new();

      // Executive Summary Sheet
      const summaryData = [{
        'Report Category': reportCategory.charAt(0).toUpperCase() + reportCategory.slice(1),
        'Report Period': reportType.charAt(0).toUpperCase() + reportType.slice(1),
        'Date Range': reportType === 'custom' ? `${customStartDate} to ${customEndDate}` : reportType,
        'Total Sales (₹)': reportData.totalSales,
        'Total Orders': reportData.totalOrders,
        'New Customers': reportData.totalCustomers,
        'Total Products': reportData.totalProducts,
        'Average Order Value (₹)': Math.round(reportData.averageOrderValue),
        'Generated At': new Date().toLocaleString(),
        '': '', // Empty row for spacing
        'Data Summary': '',
        'Products Count': reportData.products.length,
        'Orders Count': reportData.orders.length,
        'Payments Count': reportData.payments.length,
        'Expenses Count': reportData.expenses.length,
        'Purchase Invoices': reportData.purchaseInvoices.length,
        'Sales Returns': reportData.salesReturns.length,
        'Purchase Returns': reportData.purchaseReturns.length,
        'Leads Count': reportData.leads.length
      }];

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      summarySheet['!cols'] = [{ width: 25 }, { width: 30 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');

      // Products Sheet
      if (reportData.products.length > 0) {
        const productsData = reportData.products.map(product => ({
          'Product ID': product.id,
          'Product Name': product.name,
          'SKU': product.sku || '',
          'Price (₹)': product.price,
          'Stock Quantity': product.stock_quantity,
          'Status': product.is_visible ? 'Active' : 'Inactive',
          'Created Date': new Date(product.created_at).toLocaleDateString()
        }));

        const productsSheet = XLSX.utils.json_to_sheet(productsData);
        productsSheet['!cols'] = [
          { width: 15 }, { width: 30 }, { width: 15 }, { width: 12 }, 
          { width: 15 }, { width: 12 }, { width: 15 }
        ];
        XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products');
      }

      // Orders Sheet
      if (reportData.orders.length > 0) {
        const ordersData = reportData.orders.map(order => ({
          'Order ID': order.id,
          'Invoice Number': order.invoice_number || '',
          'Customer Name': order.customer_name || 'Walk-in Customer',
          'Total Amount (₹)': order.total_amount || 0,
          'Status': order.status,
          'Payment Status': order.payment_status || 'pending',
          'Payment Method': order.payment_method || '',
          'Order Date': new Date(order.created_at).toLocaleDateString()
        }));

        const ordersSheet = XLSX.utils.json_to_sheet(ordersData);
        ordersSheet['!cols'] = [
          { width: 15 }, { width: 20 }, { width: 25 }, { width: 15 }, 
          { width: 12 }, { width: 15 }, { width: 15 }, { width: 15 }
        ];
        XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Orders');
      }

      // Generate filename with timestamp
      const dateRange = reportType === 'custom' 
        ? `${customStartDate}_to_${customEndDate}` 
        : reportType;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `${reportCategory.charAt(0).toUpperCase() + reportCategory.slice(1)}_Report_${dateRange}_${timestamp}.xlsx`;

      // Write and download the file
      XLSX.writeFile(workbook, filename);

      toast.success(`Excel report downloaded successfully! File: ${filename}`);

    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export Excel file. Please try again.');
    }
  };

  const exportReport = () => {
    if (!reportData) {
      toast.error('No report data available to export');
      return;
    }

    exportToExcel();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Generating report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Advanced Reports</h1>
        <div className="flex gap-2">
          <Button onClick={exportReport} disabled={!reportData}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Report Category</Label>
              <Select value={reportCategory} onValueChange={setReportCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="products">Products</SelectItem>
                  <SelectItem value="orders">Orders</SelectItem>
                  <SelectItem value="sales-invoices">Sales Invoices</SelectItem>
                  <SelectItem value="sales-returns">Sales Returns</SelectItem>
                  <SelectItem value="purchase-invoices">Purchase Invoices</SelectItem>
                  <SelectItem value="purchase-returns">Purchase Returns</SelectItem>
                  <SelectItem value="payments">Payments</SelectItem>
                  <SelectItem value="expenses">Expenses</SelectItem>
                  <SelectItem value="leads">Leads</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Report Period</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Last 7 Days</SelectItem>
                  <SelectItem value="monthly">This Month</SelectItem>
                  <SelectItem value="yearly">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportType === 'custom' && (
              <>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <Button onClick={generateReportWithMessage} className="w-full">
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{reportData.totalSales.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Revenue generated</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalOrders}</div>
                <p className="text-xs text-muted-foreground">Orders processed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalCustomers}</div>
                <p className="text-xs text-muted-foreground">Customer acquisitions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{reportData.averageOrderValue.toFixed(0)}</div>
                <p className="text-xs text-muted-foreground">Per order average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalProducts}</div>
                <p className="text-xs text-muted-foreground">Total products</p>
              </CardContent>
            </Card>
          </div>

          {/* Simple Data Display */}
          <Card>
            <CardHeader>
              <CardTitle>Report Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium">Products: {reportData.products.length}</p>
                </div>
                <div>
                  <p className="font-medium">Orders: {reportData.orders.length}</p>
                </div>
                <div>
                  <p className="font-medium">Payments: {reportData.payments.length}</p>
                </div>
                <div>
                  <p className="font-medium">Expenses: {reportData.expenses.length}</p>
                </div>
                <div>
                  <p className="font-medium">Purchase Invoices: {reportData.purchaseInvoices.length}</p>
                </div>
                <div>
                  <p className="font-medium">Sales Returns: {reportData.salesReturns.length}</p>
                </div>
                <div>
                  <p className="font-medium">Purchase Returns: {reportData.purchaseReturns.length}</p>
                </div>
                <div>
                  <p className="font-medium">Leads: {reportData.leads.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}