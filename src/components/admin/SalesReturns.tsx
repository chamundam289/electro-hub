import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TableShimmer, StatsCardShimmer } from '@/components/ui/shimmer';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, Eye, ArrowLeft, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface SalesReturn {
  id: string;
  return_number: string;
  customer_name: string;
  return_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  refund_method: string;
  refund_status: string;
  reason?: string;
  notes?: string;
  created_at: string;
  orders?: { invoice_number: string };
  sales_return_items?: SalesReturnItem[];
}

interface SalesReturnItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  reason?: string;
}

interface Order {
  id: string;
  invoice_number: string;
  customer_name: string;
  total_amount: number;
  order_items?: OrderItem[];
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  line_total: number;
}

export default function SalesReturns() {
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<SalesReturn | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [returnItems, setReturnItems] = useState<Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    reason: string;
  }>>([]);
  const [formData, setFormData] = useState({
    original_order_id: '',
    refund_method: 'cash',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    fetchReturns();
    fetchOrders();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales_returns')
        .select(`
          *,
          orders (invoice_number),
          sales_return_items (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReturns(data || []);
    } catch (error) {
      console.error('Error fetching returns:', error);
      toast.error('Failed to fetch returns');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          invoice_number,
          customer_name,
          total_amount,
          order_items (*)
        `)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const generateReturnNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `RET${timestamp}`;
  };

  const handleOrderSelect = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setFormData({...formData, original_order_id: orderId});
      // Initialize return items from order items
      setReturnItems(order.order_items?.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: 0,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        reason: ''
      })) || []);
    }
  };

  const updateReturnItem = (index: number, field: string, value: any) => {
    const updatedItems = [...returnItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setReturnItems(updatedItems);
  };

  const calculateTotals = () => {
    const validItems = returnItems.filter(item => item.quantity > 0);
    const subtotal = validItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const totalTax = validItems.reduce((sum, item) => sum + (item.quantity * item.unit_price * item.tax_rate / 100), 0);
    const total = subtotal + totalTax;
    
    return { subtotal, totalTax, total, validItems };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { subtotal, totalTax, total, validItems } = calculateTotals();
    
    if (validItems.length === 0) {
      toast.error('Please select at least one item to return');
      return;
    }

    try {
      setLoading(true);
      
      // Create sales return
      const { data: salesReturn, error: returnError } = await supabase
        .from('sales_returns')
        .insert([{
          return_number: generateReturnNumber(),
          original_order_id: formData.original_order_id,
          customer_id: null, // Will be set from order
          customer_name: selectedOrder?.customer_name || '',
          subtotal,
          tax_amount: totalTax,
          total_amount: total,
          refund_method: formData.refund_method,
          refund_status: 'pending',
          reason: formData.reason,
          notes: formData.notes
        }])
        .select()
        .single();

      if (returnError) throw returnError;

      // Create return items
      const returnItemsData = validItems.map(item => ({
        sales_return_id: salesReturn.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        tax_amount: item.quantity * item.unit_price * item.tax_rate / 100,
        line_total: item.quantity * item.unit_price + (item.quantity * item.unit_price * item.tax_rate / 100),
        reason: item.reason
      }));

      const { error: itemsError } = await supabase
        .from('sales_return_items')
        .insert(returnItemsData);

      if (itemsError) throw itemsError;

      // Update inventory
      for (const item of validItems) {
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();

        if (product) {
          const newQuantity = product.stock_quantity + item.quantity;
          
          await supabase
            .from('products')
            .update({ stock_quantity: newQuantity })
            .eq('id', item.product_id);

          // Create inventory transaction
          await supabase
            .from('inventory_transactions')
            .insert([{
              product_id: item.product_id,
              transaction_type: 'return',
              reference_type: 'sales_return',
              reference_id: salesReturn.id,
              quantity_change: item.quantity,
              quantity_before: product.stock_quantity,
              quantity_after: newQuantity,
              unit_cost: item.unit_price,
              notes: `Sales Return - ${salesReturn.return_number}`
            }]);
        }
      }

      toast.success(`Return ${salesReturn.return_number} created successfully!`);
      resetForm();
      fetchReturns();
    } catch (error) {
      console.error('Error creating return:', error);
      toast.error('Failed to create return');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReturn = async (returnItem: SalesReturn) => {
    try {
      const { data: returnItems, error } = await supabase
        .from('sales_return_items')
        .select('*')
        .eq('sales_return_id', returnItem.id);

      if (error) throw error;
      
      setSelectedReturn({
        ...returnItem,
        sales_return_items: returnItems || []
      });
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error('Error fetching return details:', error);
      toast.error('Failed to fetch return details');
    }
  };

  const handleEditReturn = (returnItem: SalesReturn) => {
    // For now, show a message that editing is not implemented
    // In a full implementation, you would populate the form with return data
    toast.info('Edit functionality will be implemented in the next update');
  };

  const handleDeleteReturn = async (returnId: string) => {
    if (!confirm('Are you sure you want to delete this return? This action cannot be undone.')) {
      return;
    }

    try {
      // First delete return items
      const { error: itemsError } = await supabase
        .from('sales_return_items')
        .delete()
        .eq('sales_return_id', returnId);

      if (itemsError) throw itemsError;

      // Then delete the return
      const { error: returnError } = await supabase
        .from('sales_returns')
        .delete()
        .eq('id', returnId);

      if (returnError) throw returnError;

      toast.success('Sales return deleted successfully');
      fetchReturns();
    } catch (error) {
      console.error('Error deleting return:', error);
      toast.error('Failed to delete return');
    }
  };

  const resetForm = () => {
    setFormData({
      original_order_id: '',
      refund_method: 'cash',
      reason: '',
      notes: ''
    });
    setSelectedOrder(null);
    setReturnItems([]);
    setIsDialogOpen(false);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'processed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const filteredReturns = returns.filter(returnItem => {
    const matchesSearch = returnItem.return_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         returnItem.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || returnItem.refund_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sales Returns</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Return
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create Sales Return</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Order Selection */}
              <div>
                <Label htmlFor="order">Select Order *</Label>
                <Select value={formData.original_order_id} onValueChange={handleOrderSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an order to return" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.invoice_number} - {order.customer_name} (₹{order.total_amount})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedOrder && (
                <>
                  {/* Return Items */}
                  <div>
                    <Label>Return Items</Label>
                    <div className="border rounded-lg p-4 space-y-4">
                      {returnItems.map((item, index) => (
                        <div key={index} className="grid grid-cols-6 gap-4 items-center p-3 border rounded">
                          <div className="col-span-2">
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-sm text-muted-foreground">₹{item.unit_price}</p>
                          </div>
                          <div>
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              min="0"
                              max={selectedOrder.order_items?.find(oi => oi.product_id === item.product_id)?.quantity || 0}
                              value={item.quantity}
                              onChange={(e) => updateReturnItem(index, 'quantity', Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label>Reason</Label>
                            <Select value={item.reason} onValueChange={(value) => updateReturnItem(index, 'reason', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select reason" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="defective">Defective</SelectItem>
                                <SelectItem value="wrong_item">Wrong Item</SelectItem>
                                <SelectItem value="damaged">Damaged</SelectItem>
                                <SelectItem value="not_satisfied">Not Satisfied</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              ₹{(item.quantity * item.unit_price * (1 + item.tax_rate / 100)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Return Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="refund_method">Refund Method</Label>
                      <Select value={formData.refund_method} onValueChange={(value) => setFormData({...formData, refund_method: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="credit">Store Credit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="reason">Return Reason</Label>
                      <Input
                        id="reason"
                        value={formData.reason}
                        onChange={(e) => setFormData({...formData, reason: e.target.value})}
                        placeholder="Overall return reason"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Additional notes"
                      rows={2}
                    />
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2 p-4 border rounded-lg">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{calculateTotals().subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>₹{calculateTotals().totalTax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total Refund:</span>
                        <span>₹{calculateTotals().total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !selectedOrder}>
                  {loading ? 'Creating...' : 'Create Return'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{returns.length}</div>
            <p className="text-xs text-muted-foreground">All time returns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <ArrowLeft className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {returns.filter(ret => ret.refund_status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting refund</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <ArrowLeft className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {returns.filter(ret => ret.refund_status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">Refund completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <ArrowLeft className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {returns.filter(ret => ret.refund_status === 'cancelled').length}
            </div>
            <p className="text-xs text-muted-foreground">Cancelled returns</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search returns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Returns List */}
      <Card>
        <CardHeader>
          <CardTitle>Returns ({filteredReturns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {/* Statistics Cards Shimmer */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <StatsCardShimmer key={i} />
                ))}
              </div>
              
              {/* Filters Shimmer */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-shimmer"></div>
                    <div className="h-10 w-full bg-gray-200 rounded animate-shimmer"></div>
                  </div>
                ))}
              </div>
              
              {/* Table Shimmer */}
              <TableShimmer rows={8} columns={6} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Return #</th>
                    <th className="text-left p-2">Customer</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Refund Method</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReturns.map((returnItem) => (
                    <tr key={returnItem.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{returnItem.return_number}</td>
                      <td className="p-2">{returnItem.customer_name}</td>
                      <td className="p-2">{new Date(returnItem.return_date).toLocaleDateString()}</td>
                      <td className="p-2 font-medium">₹{returnItem.total_amount.toLocaleString()}</td>
                      <td className="p-2 capitalize">{returnItem.refund_method}</td>
                      <td className="p-2">
                        <Badge variant={getStatusBadgeVariant(returnItem.refund_status)}>
                          {returnItem.refund_status}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewReturn(returnItem)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditReturn(returnItem)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteReturn(returnItem.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* View Return Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Return Details - {selectedReturn?.return_number}</DialogTitle>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-6">
              {/* Return Header */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <p><strong>Name:</strong> {selectedReturn.customer_name}</p>
                  <p><strong>Return Date:</strong> {new Date(selectedReturn.return_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Return Information</h3>
                  <p><strong>Refund Method:</strong> {selectedReturn.refund_method}</p>
                  <p><strong>Status:</strong> {selectedReturn.refund_status}</p>
                  {selectedReturn.reason && <p><strong>Reason:</strong> {selectedReturn.reason}</p>}
                </div>
              </div>

              {/* Return Items */}
              <div>
                <h3 className="font-semibold mb-2">Returned Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-2 border">Product</th>
                        <th className="text-left p-2 border">Qty</th>
                        <th className="text-left p-2 border">Rate</th>
                        <th className="text-left p-2 border">Tax</th>
                        <th className="text-left p-2 border">Total</th>
                        <th className="text-left p-2 border">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReturn.sales_return_items?.map((item) => (
                        <tr key={item.id}>
                          <td className="p-2 border">{item.product_name}</td>
                          <td className="p-2 border">{item.quantity}</td>
                          <td className="p-2 border">₹{item.unit_price.toFixed(2)}</td>
                          <td className="p-2 border">₹{item.tax_amount.toFixed(2)}</td>
                          <td className="p-2 border">₹{item.line_total.toFixed(2)}</td>
                          <td className="p-2 border">{item.reason || '-'}</td>
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
                    <span>₹{selectedReturn.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>₹{selectedReturn.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total Refund:</span>
                    <span>₹{selectedReturn.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedReturn.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-muted-foreground">{selectedReturn.notes}</p>
                </div>
              )}

              <div className="flex justify-end">
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