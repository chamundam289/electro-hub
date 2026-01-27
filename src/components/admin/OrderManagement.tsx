import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DataPagination } from '@/components/ui/data-pagination';
import { usePagination } from '@/hooks/usePagination';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Eye, Edit, Printer, Search, Mail, MessageCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  invoice_number?: string;
  customer_id?: string;
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  payment_method?: string;
  payment_status?: string;
  status: string;
  notes?: string;
  created_at: string;
  customers?: { name: string; phone?: string };
  order_items?: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast.error('Failed to load orders');
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      toast.success('Order status updated successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const updatePaymentStatus = async (orderId: string, newPaymentStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newPaymentStatus })
        .eq('id', orderId);

      if (error) throw error;
      toast.success('Payment status updated successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        (order.invoice_number && order.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.customers?.name && order.customers.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.customers?.phone && order.customers.phone.includes(searchTerm));

      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
      const matchesPaymentStatus = filterPaymentStatus === 'all' || order.payment_status === filterPaymentStatus;

      let matchesDate = true;
      if (dateFrom || dateTo) {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        if (dateFrom && orderDate < dateFrom) matchesDate = false;
        if (dateTo && orderDate > dateTo) matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesPaymentStatus && matchesDate;
    });
  }, [orders, searchTerm, filterStatus, filterPaymentStatus, dateFrom, dateTo]);

  const pagination = usePagination({
    totalItems: filteredOrders.length,
    itemsPerPage: 30,
  });

  const paginatedOrders = useMemo(() => {
    const startIndex = pagination.startIndex;
    const endIndex = pagination.endIndex;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, pagination.startIndex, pagination.endIndex]);

  const printOrder = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Order Invoice - ${order.invoice_number || order.id.slice(0, 8)}</title>
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
            <h1>ORDER INVOICE</h1>
          </div>
          
          <div class="company-info">
            <h2>ElectroStore</h2>
            <p>123 Tech Street, Digital City</p>
            <p>Phone: +1234567890 | Email: contact@electrostore.com</p>
          </div>
          
          <div class="invoice-info">
            <div>
              <strong>Invoice Number:</strong> ${order.invoice_number || order.id.slice(0, 8)}<br>
              <strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}<br>
              <strong>Order Time:</strong> ${new Date(order.created_at).toLocaleTimeString()}<br>
              <strong>Status:</strong> ${order.status.toUpperCase()}
            </div>
            <div>
              <strong>Payment Method:</strong> ${order.payment_method || 'N/A'}<br>
              <strong>Payment Status:</strong> ${(order.payment_status || 'pending').toUpperCase()}
            </div>
          </div>
          
          <div class="customer-info">
            <h3>Bill To:</h3>
            <strong>${order.customers?.name || 'Walk-in Customer'}</strong><br>
            ${order.customers?.phone ? `Phone: ${order.customers.phone}<br>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${order.order_items?.map(item => `
                <tr>
                  <td>${item.product_name}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.unit_price.toFixed(2)}</td>
                  <td>₹${item.line_total.toFixed(2)}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
          
          <table class="totals">
            <tr><td>Subtotal:</td><td>₹${(order.subtotal || 0).toFixed(2)}</td></tr>
            ${order.tax_amount && order.tax_amount > 0 ? `<tr><td>Tax:</td><td>₹${order.tax_amount.toFixed(2)}</td></tr>` : ''}
            ${order.discount_amount && order.discount_amount > 0 ? `<tr><td>Discount:</td><td>-₹${order.discount_amount.toFixed(2)}</td></tr>` : ''}
            <tr class="total-row"><td>Total:</td><td>₹${(order.total_amount || 0).toFixed(2)}</td></tr>
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

  const generateBillTemplate = (order: Order) => {
    const itemsHtml = order.order_items?.map(item => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 8px; text-align: left;">${item.product_name}</td>
        <td style="padding: 12px 8px; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px 8px; text-align: right;">₹${item.unit_price.toFixed(2)}</td>
        <td style="padding: 12px 8px; text-align: right; font-weight: 600;">₹${item.line_total.toFixed(2)}</td>
      </tr>
    `).join('') || '';

    return `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">ElectroStore</h1>
          <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Your Electronics Partner</p>
          <div style="background: rgba(255,255,255,0.2); padding: 12px 20px; border-radius: 8px; margin-top: 20px; display: inline-block;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 600;">INVOICE</h2>
          </div>
        </div>

        <!-- Invoice Info -->
        <div style="padding: 30px 20px 20px 20px; background: #f8fafc;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px; margin-bottom: 15px;">
              <h3 style="margin: 0 0 10px 0; color: #374151; font-size: 16px; font-weight: 600;">Invoice Details</h3>
              <p style="margin: 4px 0; color: #6b7280; font-size: 14px;"><strong>Invoice #:</strong> ${order.invoice_number || order.id.slice(0, 8)}</p>
              <p style="margin: 4px 0; color: #6b7280; font-size: 14px;"><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
              <p style="margin: 4px 0; color: #6b7280; font-size: 14px;"><strong>Status:</strong> <span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${order.status.toUpperCase()}</span></p>
            </div>
            <div style="flex: 1; min-width: 200px;">
              <h3 style="margin: 0 0 10px 0; color: #374151; font-size: 16px; font-weight: 600;">Customer Details</h3>
              <p style="margin: 4px 0; color: #6b7280; font-size: 14px;"><strong>Name:</strong> ${order.customers?.name || 'Walk-in Customer'}</p>
              ${order.customers?.phone ? `<p style="margin: 4px 0; color: #6b7280; font-size: 14px;"><strong>Phone:</strong> ${order.customers.phone}</p>` : ''}
              <p style="margin: 4px 0; color: #6b7280; font-size: 14px;"><strong>Payment:</strong> <span style="background: #3b82f6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${(order.payment_status || 'pending').toUpperCase()}</span></p>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div style="padding: 0 20px;">
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 16px 8px; text-align: left; font-weight: 600; color: #374151; font-size: 14px;">Item</th>
                <th style="padding: 16px 8px; text-align: center; font-weight: 600; color: #374151; font-size: 14px;">Qty</th>
                <th style="padding: 16px 8px; text-align: right; font-weight: 600; color: #374151; font-size: 14px;">Rate</th>
                <th style="padding: 16px 8px; text-align: right; font-weight: 600; color: #374151; font-size: 14px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div style="padding: 20px; background: #f8fafc;">
          <div style="max-width: 300px; margin-left: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #6b7280;">
              <span>Subtotal:</span>
              <span>₹${(order.subtotal || 0).toFixed(2)}</span>
            </div>
            ${order.tax_amount && order.tax_amount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #6b7280;">
              <span>Tax:</span>
              <span>₹${order.tax_amount.toFixed(2)}</span>
            </div>` : ''}
            ${order.discount_amount && order.discount_amount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #ef4444;">
              <span>Discount:</span>
              <span>-₹${order.discount_amount.toFixed(2)}</span>
            </div>` : ''}
            <div style="border-top: 2px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
              <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 700; color: #111827;">
                <span>Total:</span>
                <span style="color: #059669;">₹${(order.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        ${order.notes ? `
        <div style="padding: 20px; background: #fef3c7; border-left: 4px solid #f59e0b;">
          <h4 style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: 600;">Notes:</h4>
          <p style="margin: 0; color: #92400e; font-size: 14px;">${order.notes}</p>
        </div>` : ''}

        <!-- Footer -->
        <div style="background: #111827; color: white; padding: 25px 20px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">Thank you for choosing ElectroStore!</p>
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">📧 contact@electrostore.com | 📞 +1234567890</p>
          <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.6;">This is a computer generated invoice.</p>
        </div>
      </div>
    `;
  };

  const sendBillViaEmail = async (order: Order) => {
    if (!order.customers?.name || order.customers.name === 'Walk-in Customer') {
      toast.error('Customer email not available for this order');
      return;
    }

    try {
      const billTemplate = generateBillTemplate(order);
      const subject = `Invoice ${order.invoice_number || order.id.slice(0, 8)} - ElectroStore`;
      const body = `Dear ${order.customers.name},

Thank you for your purchase! Please find your invoice details below.

${billTemplate}

Best regards,
ElectroStore Team`;

      // For demo purposes, we'll create a mailto link
      // In production, you would integrate with an email service like SendGrid, Nodemailer, etc.
      const mailtoLink = `mailto:customer@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent('Please find your invoice attached. We will send the HTML version via our email service.')}`;
      window.open(mailtoLink);
      
      toast.success('Email client opened. In production, this would send via email service.');
    } catch (error) {
      toast.error('Failed to send email');
    }
  };

  const sendBillViaWhatsApp = (order: Order) => {
    if (!order.customers?.phone) {
      toast.error('Customer phone number not available for this order');
      return;
    }

    try {
      const message = `🧾 *INVOICE FROM ELECTROSTORE* 🧾

📋 *Invoice Details:*
• Invoice #: ${order.invoice_number || order.id.slice(0, 8)}
• Date: ${new Date(order.created_at).toLocaleDateString()}
• Status: ${order.status.toUpperCase()}

👤 *Customer:* ${order.customers?.name || 'Walk-in Customer'}

🛍️ *Items:*
${order.order_items?.map(item => 
  `• ${item.product_name} - Qty: ${item.quantity} - ₹${item.line_total.toFixed(2)}`
).join('\n') || ''}

💰 *Payment Summary:*
• Subtotal: ₹${(order.subtotal || 0).toFixed(2)}
${order.tax_amount && order.tax_amount > 0 ? `• Tax: ₹${order.tax_amount.toFixed(2)}\n` : ''}
${order.discount_amount && order.discount_amount > 0 ? `• Discount: -₹${order.discount_amount.toFixed(2)}\n` : ''}
• *Total: ₹${(order.total_amount || 0).toFixed(2)}*

💳 Payment Status: ${(order.payment_status || 'pending').toUpperCase()}

${order.notes ? `📝 Notes: ${order.notes}\n` : ''}

Thank you for choosing ElectroStore! 🙏
📧 contact@electrostore.com | 📞 +1234567890`;

      const phoneNumber = order.customers.phone.replace(/[^\d]/g, '');
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      toast.success('WhatsApp opened with invoice details');
    } catch (error) {
      toast.error('Failed to open WhatsApp');
    }
  };

  const sendBillViaSMS = (order: Order) => {
    if (!order.customers?.phone) {
      toast.error('Customer phone number not available for this order');
      return;
    }

    try {
      const message = `ElectroStore Invoice ${order.invoice_number || order.id.slice(0, 8)}
Date: ${new Date(order.created_at).toLocaleDateString()}
Customer: ${order.customers?.name || 'Walk-in Customer'}
Total: ₹${(order.total_amount || 0).toFixed(2)}
Status: ${order.status.toUpperCase()}
Payment: ${(order.payment_status || 'pending').toUpperCase()}

Thank you for your business!
ElectroStore - contact@electrostore.com`;

      // For demo purposes, we'll create an SMS link
      // In production, you would integrate with SMS services like Twilio, AWS SNS, etc.
      const smsUrl = `sms:${order.customers.phone}?body=${encodeURIComponent(message)}`;
      window.open(smsUrl);
      
      toast.success('SMS client opened with invoice details');
    } catch (error) {
      toast.error('Failed to open SMS client');
    }
  };

  const handleEditOrder = (order: Order) => {
    // For now, show a message that editing is not implemented
    // In a full implementation, you would open an edit dialog with form fields
    toast.info('Edit order functionality will be implemented in the next update. You can update order status using the dropdown.');
  };

  const handleDeleteOrder = async (orderId: string, invoiceNumber?: string) => {
    if (!confirm(`Are you sure you want to delete order ${invoiceNumber || orderId.slice(0, 8)}? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      
      // First delete order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      // Then delete the order
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) throw orderError;

      toast.success('Order deleted successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getPaymentStatusColor = (status?: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'partially_paid': return 'secondary';
      case 'pending': return 'destructive';
      default: return 'outline';
    }
  };

  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
      </div>

      {/* Order Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">All time orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedOrders}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <FileText className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From completed orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <Label>Search Orders</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Invoice, customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Order Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Status</Label>
              <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterPaymentStatus('all');
                setDateFrom('');
                setDateTo('');
              }}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Invoice</th>
                  <th className="text-left p-2">Customer</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Payment</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{order.invoice_number || order.id.slice(0, 8)}</p>
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{order.customers?.name || 'Walk-in Customer'}</p>
                        {order.customers?.phone && (
                          <p className="text-xs text-gray-500">{order.customers.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <p className="text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleTimeString()}</p>
                    </td>
                    <td className="p-2">
                      <p className="font-medium">₹{(order.total_amount || 0).toLocaleString()}</p>
                    </td>
                    <td className="p-2">
                      <Badge variant={getPaymentStatusColor(order.payment_status)}>
                        {order.payment_status || 'pending'}
                      </Badge>
                      {order.payment_method && (
                        <p className="text-xs text-gray-500 mt-1 capitalize">{order.payment_method}</p>
                      )}
                    </td>
                    <td className="p-2">
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsViewDialogOpen(true);
                          }}
                          title="View Details"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditOrder(order)}
                          title="Edit Order"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => printOrder(order)}
                          title="Print Invoice"
                        >
                          <Printer className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => sendBillViaEmail(order)}
                          title="Send via Email"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Mail className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => sendBillViaWhatsApp(order)}
                          title="Send via WhatsApp"
                          className="text-green-600 hover:text-green-700"
                        >
                          <MessageCircle className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteOrder(order.id, order.invoice_number)}
                          title="Delete Order"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredOrders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No orders found matching your criteria.
              </div>
            )}
          </div>
          
          {filteredOrders.length > 0 && (
            <div className="mt-4">
              <DataPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={filteredOrders.length}
                itemsPerPage={pagination.itemsPerPage}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
                hasNextPage={pagination.hasNextPage}
                hasPreviousPage={pagination.hasPreviousPage}
                onPageChange={pagination.goToPage}
                onItemsPerPageChange={pagination.setItemsPerPage}
                onFirstPage={pagination.goToFirstPage}
                onLastPage={pagination.goToLastPage}
                onNextPage={pagination.goToNextPage}
                onPreviousPage={pagination.goToPreviousPage}
                getPageNumbers={pagination.getPageNumbers}
                itemsPerPageOptions={[15, 30, 50, 100]}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              View complete order information including items, customer details, and payment status.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Invoice Number</Label>
                  <p className="font-medium">{selectedOrder.invoice_number || selectedOrder.id.slice(0, 8)}</p>
                </div>
                <div>
                  <Label>Order Date</Label>
                  <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label>Customer</Label>
                  <p className="font-medium">{selectedOrder.customers?.name || 'Walk-in Customer'}</p>
                  {selectedOrder.customers?.phone && (
                    <p className="text-sm text-gray-600">{selectedOrder.customers.phone}</p>
                  )}
                </div>
                <div>
                  <Label>Notes</Label>
                  <p className="font-medium">{selectedOrder.notes || 'No notes'}</p>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <Label>Additional Notes</Label>
                  <p className="font-medium">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Order Items */}
              <div>
                <Label>Order Items</Label>
                <div className="border rounded mt-2">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2">Product</th>
                        <th className="text-left p-2">Qty</th>
                        <th className="text-left p-2">Price</th>
                        <th className="text-left p-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.order_items?.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">{item.product_name}</td>
                          <td className="p-2">{item.quantity}</td>
                          <td className="p-2">₹{item.unit_price}</td>
                          <td className="p-2">₹{item.line_total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{(selectedOrder.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {selectedOrder.tax_amount && selectedOrder.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>₹{selectedOrder.tax_amount.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedOrder.discount_amount && selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-₹{selectedOrder.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>₹{(selectedOrder.total_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Status:</span>
                    <Badge variant={getPaymentStatusColor(selectedOrder.payment_status)}>
                      {selectedOrder.payment_status || 'pending'}
                    </Badge>
                  </div>
                  {selectedOrder.payment_method && (
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span className="capitalize">{selectedOrder.payment_method}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 flex-wrap gap-2">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleEditOrder(selectedOrder)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => printOrder(selectedOrder)}
                  className="flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => sendBillViaEmail(selectedOrder)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => sendBillViaWhatsApp(selectedOrder)}
                  className="flex items-center gap-2 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleDeleteOrder(selectedOrder.id, selectedOrder.invoice_number);
                  }}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}