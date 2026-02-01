import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TableShimmer, StatsCardShimmer } from '@/components/ui/Shimmer';
import { supabase } from '@/integrations/supabase/client';
import { storageTrackingService, DATA_OPERATION_SOURCES } from '@/services/storageTrackingService';
import { Plus, Search, CreditCard, ArrowUpRight, ArrowDownLeft, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Payment {
  id: string;
  payment_number: string;
  payment_type: string;
  reference_type: string;
  reference_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  transaction_id?: string;
  bank_name?: string;
  cheque_number?: string;
  cheque_date?: string;
  notes?: string;
  created_at: string;
  customers?: { name: string };
  suppliers?: { name: string };
}

interface Customer {
  id: string;
  name: string;
  outstanding_balance: number;
}

interface Supplier {
  id: string;
  name: string;
  outstanding_balance: number;
}

interface Order {
  id: string;
  invoice_number: string;
  customer_name: string;
  total_amount: number;
  payment_status: string;
}

interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  suppliers?: { name: string };
  total_amount: number;
  payment_status: string;
}

export default function PaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    payment_type: 'received',
    reference_type: 'order',
    reference_id: '',
    customer_id: '',
    supplier_id: '',
    amount: 0,
    payment_method: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    transaction_id: '',
    bank_name: '',
    cheque_number: '',
    cheque_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchPayments();
    fetchCustomers();
    fetchSuppliers();
    fetchOrders();
    fetchPurchaseInvoices();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          customers (name),
          suppliers (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, outstanding_balance')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, outstanding_balance')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, invoice_number, customer_name, total_amount, payment_status')
        .in('payment_status', ['pending', 'partial'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchPurchaseInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_invoices')
        .select(`
          id,
          invoice_number,
          total_amount,
          payment_status,
          suppliers (name)
        `)
        .in('payment_status', ['pending', 'partial'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchaseInvoices(data || []);
    } catch (error) {
      console.error('Error fetching purchase invoices:', error);
    }
  };

  const generatePaymentNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `PAY${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reference_id || formData.amount <= 0) {
      toast.error('Reference and amount are required');
      return;
    }

    try {
      setLoading(true);
      
      const paymentData = {
        ...formData,
        payment_number: generatePaymentNumber(),
        customer_id: formData.payment_type === 'received' ? (formData.customer_id === 'none' ? null : formData.customer_id || null) : null,
        supplier_id: formData.payment_type === 'paid' ? (formData.supplier_id === 'none' ? null : formData.supplier_id || null) : null,
        transaction_id: formData.transaction_id || null,
        bank_name: formData.bank_name || null,
        cheque_number: formData.cheque_number || null,
        cheque_date: formData.cheque_date || null
      };

      const { data, error } = await supabase
        .from('payments')
        .insert([paymentData])
        .select()
        .single();

      if (error) throw error;

      // Track payment creation
      await storageTrackingService.trackDataOperation({
        operation_type: 'create',
        table_name: 'payments',
        record_id: data.id,
        operation_source: DATA_OPERATION_SOURCES.ADMIN_PAYMENT_CREATE,
        metadata: {
          payment_number: paymentData.payment_number,
          payment_type: formData.payment_type,
          reference_type: formData.reference_type,
          amount: formData.amount,
          payment_method: formData.payment_method,
          customer_id: formData.customer_id,
          supplier_id: formData.supplier_id
        }
      });

      // Update the reference record's payment status
      if (formData.reference_type === 'order') {
        // Update order payment status
        const order = orders.find(o => o.id === formData.reference_id);
        if (order) {
          const newStatus = formData.amount >= order.total_amount ? 'paid' : 'partial';
          await supabase
            .from('orders')
            .update({ payment_status: newStatus })
            .eq('id', formData.reference_id);
          
          // Track order payment status update
          await storageTrackingService.trackDataOperation({
            operation_type: 'update',
            table_name: 'orders',
            record_id: formData.reference_id,
            operation_source: DATA_OPERATION_SOURCES.ADMIN_PAYMENT_CREATE,
            metadata: {
              order_number: order.order_number,
              old_payment_status: order.payment_status,
              new_payment_status: newStatus,
              payment_amount: formData.amount,
              operation: 'payment_status_update'
            }
          });
        }
      } else if (formData.reference_type === 'purchase_invoice') {
        // Update purchase invoice payment status
        const invoice = purchaseInvoices.find(i => i.id === formData.reference_id);
        if (invoice) {
          const newStatus = formData.amount >= invoice.total_amount ? 'paid' : 'partial';
          await supabase
            .from('purchase_invoices')
            .update({ 
              payment_status: newStatus,
              paid_amount: formData.amount
            })
            .eq('id', formData.reference_id);
        }
      }

      // Update customer/supplier outstanding balance
      if (formData.customer_id) {
        const customer = customers.find(c => c.id === formData.customer_id);
        if (customer) {
          const newBalance = Math.max(0, customer.outstanding_balance - formData.amount);
          await supabase
            .from('customers')
            .update({ outstanding_balance: newBalance })
            .eq('id', formData.customer_id);
        }
      }

      if (formData.supplier_id) {
        const supplier = suppliers.find(s => s.id === formData.supplier_id);
        if (supplier) {
          const newBalance = Math.max(0, supplier.outstanding_balance - formData.amount);
          await supabase
            .from('suppliers')
            .update({ outstanding_balance: newBalance })
            .eq('id', formData.supplier_id);
        }
      }

      toast.success('Payment recorded successfully!');
      resetForm();
      fetchPayments();
      fetchOrders();
      fetchPurchaseInvoices();
      fetchCustomers();
      fetchSuppliers();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      payment_type: 'received',
      reference_type: 'order',
      reference_id: '',
      customer_id: '',
      supplier_id: '',
      amount: 0,
      payment_method: 'cash',
      payment_date: new Date().toISOString().split('T')[0],
      transaction_id: '',
      bank_name: '',
      cheque_number: '',
      cheque_date: '',
      notes: ''
    });
    setIsDialogOpen(false);
  };

  const getPaymentTypeIcon = (type: string) => {
    return type === 'received' ? ArrowDownLeft : ArrowUpRight;
  };

  const getPaymentTypeBadgeVariant = (type: string) => {
    return type === 'received' ? 'default' : 'secondary';
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.payment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.customers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.suppliers?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || payment.payment_type === typeFilter;
    const matchesMethod = methodFilter === 'all' || payment.payment_method === methodFilter;
    
    return matchesSearch && matchesType && matchesMethod;
  });

  const paymentStats = {
    totalReceived: payments
      .filter(p => p.payment_type === 'received')
      .reduce((sum, p) => sum + p.amount, 0),
    totalPaid: payments
      .filter(p => p.payment_type === 'paid')
      .reduce((sum, p) => sum + p.amount, 0),
    todayReceived: payments
      .filter(p => p.payment_type === 'received' && p.payment_date === new Date().toISOString().split('T')[0])
      .reduce((sum, p) => sum + p.amount, 0),
    todayPaid: payments
      .filter(p => p.payment_type === 'paid' && p.payment_date === new Date().toISOString().split('T')[0])
      .reduce((sum, p) => sum + p.amount, 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Payment Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0 pb-4 border-b">
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record a new payment transaction for customers or suppliers.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto dialog-scroll-container px-1">
              <form onSubmit={handleSubmit} className="payment-form space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payment_type">Payment Type</Label>
                  <Select value={formData.payment_type} onValueChange={(value) => setFormData({...formData, payment_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="received">Payment Received</SelectItem>
                      <SelectItem value="paid">Payment Made</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="reference_type">Reference Type</Label>
                  <Select value={formData.reference_type} onValueChange={(value) => setFormData({...formData, reference_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.payment_type === 'received' && (
                        <SelectItem value="order">Sales Order</SelectItem>
                      )}
                      {formData.payment_type === 'paid' && (
                        <SelectItem value="purchase_invoice">Purchase Invoice</SelectItem>
                      )}
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="reference_id">Reference</Label>
                <Select value={formData.reference_id} onValueChange={(value) => setFormData({...formData, reference_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reference" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.reference_type === 'order' && orders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.invoice_number} - {order.customer_name} (₹{order.total_amount})
                      </SelectItem>
                    ))}
                    {formData.reference_type === 'purchase_invoice' && purchaseInvoices.map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {invoice.invoice_number} - {invoice.suppliers?.name} (₹{invoice.total_amount})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.payment_type === 'received' && (
                <div>
                  <Label htmlFor="customer_id">Customer (Optional)</Label>
                  <Select value={formData.customer_id} onValueChange={(value) => setFormData({...formData, customer_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Customer</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} (Outstanding: ₹{customer.outstanding_balance})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.payment_type === 'paid' && (
                <div>
                  <Label htmlFor="supplier_id">Supplier (Optional)</Label>
                  <Select value={formData.supplier_id} onValueChange={(value) => setFormData({...formData, supplier_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Supplier</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name} (Outstanding: ₹{supplier.outstanding_balance})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount (₹) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="payment_date">Payment Date</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select value={formData.payment_method} onValueChange={(value) => setFormData({...formData, payment_method: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.payment_method === 'online' || formData.payment_method === 'upi' || formData.payment_method === 'card') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="transaction_id">Transaction ID</Label>
                    <Input
                      id="transaction_id"
                      value={formData.transaction_id}
                      onChange={(e) => setFormData({...formData, transaction_id: e.target.value})}
                      placeholder="Transaction ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Input
                      id="bank_name"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                      placeholder="Bank name"
                    />
                  </div>
                </div>
              )}

              {formData.payment_method === 'cheque' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cheque_number">Cheque Number</Label>
                    <Input
                      id="cheque_number"
                      value={formData.cheque_number}
                      onChange={(e) => setFormData({...formData, cheque_number: e.target.value})}
                      placeholder="Cheque number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cheque_date">Cheque Date</Label>
                    <Input
                      id="cheque_date"
                      type="date"
                      value={formData.cheque_date}
                      onChange={(e) => setFormData({...formData, cheque_date: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Payment notes"
                  rows={2}
                />
              </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Recording...' : 'Record Payment'}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Received</p>
                <p className="text-2xl font-bold text-green-600">₹{paymentStats.totalReceived.toLocaleString()}</p>
              </div>
              <ArrowDownLeft className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-red-600">₹{paymentStats.totalPaid.toLocaleString()}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today Received</p>
                <p className="text-2xl font-bold text-green-600">₹{paymentStats.todayReceived.toLocaleString()}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today Paid</p>
                <p className="text-2xl font-bold text-red-600">₹{paymentStats.todayPaid.toLocaleString()}</p>
              </div>
              <Calendar className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Payments ({filteredPayments.length})</CardTitle>
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-shimmer"></div>
                    <div className="h-10 w-full bg-gray-200 rounded animate-shimmer"></div>
                  </div>
                ))}
              </div>
              
              {/* Table Shimmer */}
              <TableShimmer rows={8} columns={7} />
            </div>
          ) : (
            <div className="">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Payment #</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Party</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Method</th>
                    <th className="text-left p-2">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => {
                    const Icon = getPaymentTypeIcon(payment.payment_type);
                    return (
                      <tr key={payment.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{payment.payment_number}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${payment.payment_type === 'received' ? 'text-green-500' : 'text-red-500'}`} />
                            <Badge variant={getPaymentTypeBadgeVariant(payment.payment_type)}>
                              {payment.payment_type}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-2">
                          {payment.customers?.name || payment.suppliers?.name || '-'}
                        </td>
                        <td className="p-2">{new Date(payment.payment_date).toLocaleDateString()}</td>
                        <td className="p-2 font-medium">
                          <span className={payment.payment_type === 'received' ? 'text-green-600' : 'text-red-600'}>
                            {payment.payment_type === 'received' ? '+' : '-'}₹{payment.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-2 capitalize">{payment.payment_method.replace('_', ' ')}</td>
                        <td className="p-2 capitalize">{payment.reference_type.replace('_', ' ')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}