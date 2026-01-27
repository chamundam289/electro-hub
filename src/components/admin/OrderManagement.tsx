import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Eye, Edit, Printer, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  invoice_number?: string;
  customer_id?: string;
  sub_total?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  paid_amount?: number;
  balance_amount?: number;
  payment_method?: string;
  payment_status?: string;
  order_type?: string;
  status: string;
  shipping_address?: string;
  created_at: string;
  customers?: { name: string; phone?: string };
  order_items?: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    net_price: number;
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
            net_price
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
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

  const filteredOrders = orders.filter(order => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getPaymentStatusColor = (status?: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'partially_paid': return 'secondary';
      case 'unpaid': return 'destructive';
      default: return 'outline';
    }
  };

  const totalOrders = orders.length;
  const paidOrders = orders.filter(o => o.status === 'paid').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalRevenue = orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + (o.total_amount || 0), 0);

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
            <div className="text-2xl font-bold text-green-600">{paidOrders}</div>
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
                  <SelectItem value="paid">Paid</SelectItem>
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
                  <SelectItem value="unpaid">Unpaid</SelectItem>
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
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{order.invoice_number || order.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500 capitalize">{order.order_type || 'walk_in'}</p>
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
                      {order.balance_amount && order.balance_amount > 0 && (
                        <p className="text-xs text-red-600">Balance: ₹{order.balance_amount}</p>
                      )}
                    </td>
                    <td className="p-2">
                      <Badge variant={getPaymentStatusColor(order.payment_status)}>
                        {order.payment_status || 'paid'}
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
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Printer className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
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
                  <Label>Order Type</Label>
                  <p className="font-medium capitalize">{selectedOrder.order_type || 'walk_in'}</p>
                </div>
              </div>

              {selectedOrder.shipping_address && (
                <div>
                  <Label>Shipping Address</Label>
                  <p className="font-medium">{selectedOrder.shipping_address}</p>
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
                          <td className="p-2">₹{item.net_price}</td>
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
                    <span>₹{(selectedOrder.sub_total || 0).toFixed(2)}</span>
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
                    <span>Paid:</span>
                    <span>₹{(selectedOrder.paid_amount || 0).toFixed(2)}</span>
                  </div>
                  {selectedOrder.balance_amount && selectedOrder.balance_amount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Balance:</span>
                      <span>₹{selectedOrder.balance_amount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}