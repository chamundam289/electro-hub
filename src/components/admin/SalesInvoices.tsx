import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Search, Eye, Printer, Download, Filter, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Order {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_phone?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  status: string;
  notes?: string;
  created_at: string;
  order_items?: OrderItem[];
}

interface OrderItem {
  id: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  line_total: number;
}

export default function SalesInvoices() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = async (order: Order) => {
    try {
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      if (error) throw error;
      
      setSelectedOrder({
        ...order,
        order_items: orderItems || []
      });
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to fetch order details');
    }
  };

  const printInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${order.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .company-info { text-align: center; margin-bottom: 20px; }
            .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .customer-info { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .totals { margin-left: auto; width: 300px; }
            .total-row { font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SALES INVOICE</h1>
          </div>
          
          <div class="company-info">
            <h2>ElectroStore</h2>
            <p>123 Tech Street, Digital City</p>
            <p>Phone: +1234567890 | Email: contact@electrostore.com</p>
          </div>
          
          <div class="invoice-info">
            <div>
              <strong>Invoice Number:</strong> ${order.invoice_number}<br>
              <strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}<br>
              <strong>Status:</strong> ${order.status.toUpperCase()}
            </div>
            <div>
              <strong>Payment Method:</strong> ${order.payment_method.toUpperCase()}<br>
              <strong>Payment Status:</strong> ${order.payment_status.toUpperCase()}
            </div>
          </div>
          
          <div class="customer-info">
            <h3>Bill To:</h3>
            <strong>${order.customer_name}</strong><br>
            ${order.customer_phone ? `Phone: ${order.customer_phone}<br>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Tax</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${order.order_items?.map(item => `
                <tr>
                  <td>${item.product_name}</td>
                  <td>${item.product_sku || '-'}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.unit_price.toFixed(2)}</td>
                  <td>₹${item.tax_amount.toFixed(2)}</td>
                  <td>₹${item.line_total.toFixed(2)}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
          
          <table class="totals">
            <tr><td>Subtotal:</td><td>₹${order.subtotal.toFixed(2)}</td></tr>
            <tr><td>Tax:</td><td>₹${order.tax_amount.toFixed(2)}</td></tr>
            <tr><td>Discount:</td><td>-₹${order.discount_amount.toFixed(2)}</td></tr>
            <tr class="total-row"><td>Total:</td><td>₹${order.total_amount.toFixed(2)}</td></tr>
          </table>
          
          ${order.notes ? `<div><strong>Notes:</strong> ${order.notes}</div>` : ''}
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>This is a computer generated invoice.</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Invoice Number', 'Customer', 'Date', 'Total Amount', 'Payment Status', 'Status'].join(','),
      ...filteredOrders.map(order => [
        order.invoice_number,
        order.customer_name,
        new Date(order.created_at).toLocaleDateString(),
        order.total_amount,
        order.payment_status,
        order.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_invoices_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'delivered': return 'default';
      case 'confirmed': return 'secondary';
      case 'processing': return 'outline';
      case 'shipped': return 'outline';
      case 'cancelled': return 'destructive';
      case 'returned': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'partial': return 'secondary';
      case 'pending': return 'outline';
      case 'overdue': return 'destructive';
      default: return 'secondary';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPaymentStatus = paymentStatusFilter === 'all' || order.payment_status === paymentStatusFilter;
    
    let matchesDate = true;
    if (dateRange !== 'all') {
      const orderDate = new Date(order.created_at);
      const today = new Date();
      
      switch (dateRange) {
        case 'today':
          matchesDate = orderDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = orderDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = orderDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesPaymentStatus && matchesDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sales Invoices</h1>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Order Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading invoices...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Invoice #</th>
                    <th className="text-left p-2">Customer</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Payment</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{order.invoice_number}</td>
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{order.customer_name}</div>
                          {order.customer_phone && (
                            <div className="text-sm text-muted-foreground">{order.customer_phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-2">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="p-2 font-medium">₹{order.total_amount.toLocaleString()}</td>
                      <td className="p-2">
                        <Badge variant={getPaymentStatusBadgeVariant(order.payment_status)}>
                          {order.payment_status}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => printInvoice(order)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Invoice Details - {selectedOrder?.invoice_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <p><strong>Name:</strong> {selectedOrder.customer_name}</p>
                  {selectedOrder.customer_phone && (
                    <p><strong>Phone:</strong> {selectedOrder.customer_phone}</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Invoice Information</h3>
                  <p><strong>Date:</strong> {new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                  <p><strong>Payment Method:</strong> {selectedOrder.payment_method}</p>
                  <p><strong>Status:</strong> {selectedOrder.status}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-2">Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-2 border">Product</th>
                        <th className="text-left p-2 border">SKU</th>
                        <th className="text-left p-2 border">Qty</th>
                        <th className="text-left p-2 border">Rate</th>
                        <th className="text-left p-2 border">Tax</th>
                        <th className="text-left p-2 border">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.order_items?.map((item) => (
                        <tr key={item.id}>
                          <td className="p-2 border">{item.product_name}</td>
                          <td className="p-2 border">{item.product_sku || '-'}</td>
                          <td className="p-2 border">{item.quantity}</td>
                          <td className="p-2 border">₹{item.unit_price.toFixed(2)}</td>
                          <td className="p-2 border">₹{item.tax_amount.toFixed(2)}</td>
                          <td className="p-2 border">₹{item.line_total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>₹{selectedOrder.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-₹{selectedOrder.discount_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>₹{selectedOrder.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-muted-foreground">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => printInvoice(selectedOrder)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}