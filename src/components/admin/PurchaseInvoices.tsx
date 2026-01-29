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
import { Plus, Search, Eye, Edit, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';

interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  supplier_invoice_number?: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  payment_status: string;
  status: string;
  notes?: string;
  created_at: string;
  suppliers?: { name: string };
  purchase_items?: PurchaseItem[];
}

interface PurchaseItem {
  id: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  line_total: number;
  batch_number?: string;
  expiry_date?: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  cost_price?: number;
}

export default function PurchaseInvoices() {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [purchaseItems, setPurchaseItems] = useState<Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    discount_amount: number;
    batch_number: string;
    expiry_date: string;
  }>>([]);
  const [formData, setFormData] = useState({
    supplier_id: '',
    supplier_invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    discount_amount: 0,
    notes: ''
  });

  useEffect(() => {
    fetchInvoices();
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('purchase_invoices')
        .select(`
          *,
          suppliers (name),
          purchase_items (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, cost_price')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const generateInvoiceNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `PIN${timestamp}`;
  };

  const addPurchaseItem = () => {
    setPurchaseItems([...purchaseItems, {
      product_id: '',
      product_name: '',
      quantity: 1,
      unit_price: 0,
      tax_rate: 18,
      discount_amount: 0,
      batch_number: '',
      expiry_date: ''
    }]);
  };

  const updatePurchaseItem = (index: number, field: string, value: any) => {
    const updatedItems = [...purchaseItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-fill product details when product is selected
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[index].product_name = product.name;
        updatedItems[index].unit_price = product.cost_price || 0;
      }
    }
    
    setPurchaseItems(updatedItems);
  };

  const removePurchaseItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = purchaseItems.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0);
    const totalTax = purchaseItems.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price * item.tax_rate / 100), 0);
    const totalDiscount = purchaseItems.reduce((sum, item) => 
      sum + item.discount_amount, 0) + formData.discount_amount;
    const total = subtotal + totalTax - totalDiscount;
    
    return { subtotal, totalTax, totalDiscount, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_id || purchaseItems.length === 0) {
      toast.error('Supplier and at least one item are required');
      return;
    }

    try {
      setLoading(true);
      const { subtotal, totalTax, totalDiscount, total } = calculateTotals();
      
      const invoiceData = {
        ...formData,
        invoice_number: editingInvoice?.invoice_number || generateInvoiceNumber(),
        subtotal,
        tax_amount: totalTax,
        discount_amount: totalDiscount,
        total_amount: total,
        paid_amount: 0,
        payment_status: 'pending',
        status: 'draft'
      };

      let invoiceId: string;

      if (editingInvoice) {
        const { error } = await supabase
          .from('purchase_invoices')
          .update(invoiceData)
          .eq('id', editingInvoice.id);

        if (error) throw error;
        invoiceId = editingInvoice.id;
        
        // Delete existing items
        await supabase
          .from('purchase_items')
          .delete()
          .eq('purchase_invoice_id', invoiceId);
      } else {
        const { data: invoice, error } = await supabase
          .from('purchase_invoices')
          .insert([invoiceData])
          .select()
          .single();

        if (error) throw error;
        invoiceId = invoice.id;
      }

      // Create purchase items
      const itemsData = purchaseItems.map(item => ({
        purchase_invoice_id: invoiceId,
        product_id: item.product_id || null,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        tax_amount: item.quantity * item.unit_price * item.tax_rate / 100,
        discount_amount: item.discount_amount,
        line_total: (item.quantity * item.unit_price * (1 + item.tax_rate / 100)) - item.discount_amount,
        batch_number: item.batch_number || null,
        expiry_date: item.expiry_date || null
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(itemsData);

      if (itemsError) throw itemsError;

      toast.success(`Purchase invoice ${editingInvoice ? 'updated' : 'created'} successfully!`);
      resetForm();
      fetchInvoices();
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async (invoice: PurchaseInvoice) => {
    try {
      const { data: items, error } = await supabase
        .from('purchase_items')
        .select('*')
        .eq('purchase_invoice_id', invoice.id);

      if (error) throw error;
      
      setSelectedInvoice({
        ...invoice,
        purchase_items: items || []
      });
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      toast.error('Failed to fetch invoice details');
    }
  };

  const handleEdit = (invoice: PurchaseInvoice) => {
    setEditingInvoice(invoice);
    setFormData({
      supplier_id: '', // Will need to get from join
      supplier_invoice_number: invoice.supplier_invoice_number || '',
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date || '',
      discount_amount: invoice.discount_amount,
      notes: invoice.notes || ''
    });
    // Load purchase items
    setPurchaseItems(invoice.purchase_items?.map(item => ({
      product_id: '', // Will need to get from join
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
      discount_amount: item.discount_amount,
      batch_number: item.batch_number || '',
      expiry_date: item.expiry_date || ''
    })) || []);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const { error } = await supabase
        .from('purchase_invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Invoice deleted successfully');
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      supplier_invoice_number: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      discount_amount: 0,
      notes: ''
    });
    setPurchaseItems([]);
    setEditingInvoice(null);
    setIsDialogOpen(false);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'received': return 'default';
      case 'sent': return 'secondary';
      case 'draft': return 'outline';
      case 'cancelled': return 'destructive';
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

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.suppliers?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesPaymentStatus = paymentStatusFilter === 'all' || invoice.payment_status === paymentStatusFilter;
    
    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Purchase Invoices</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl dialog-content">
            <DialogHeader>
              <DialogTitle>
                {editingInvoice ? 'Edit Purchase Invoice' : 'Create Purchase Invoice'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplier_id">Supplier *</Label>
                  <Select value={formData.supplier_id} onValueChange={(value) => setFormData({...formData, supplier_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="supplier_invoice_number">Supplier Invoice #</Label>
                  <Input
                    id="supplier_invoice_number"
                    value={formData.supplier_invoice_number}
                    onChange={(e) => setFormData({...formData, supplier_invoice_number: e.target.value})}
                    placeholder="Supplier's invoice number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoice_date">Invoice Date</Label>
                  <Input
                    id="invoice_date"
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({...formData, invoice_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  />
                </div>
              </div>

              {/* Purchase Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label>Purchase Items</Label>
                  <Button type="button" onClick={addPurchaseItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {purchaseItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-8 gap-2 items-end p-3 border rounded">
                      <div>
                        <Label>Product</Label>
                        <Select 
                          value={item.product_id} 
                          onValueChange={(value) => updatePurchaseItem(index, 'product_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updatePurchaseItem(index, 'quantity', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Unit Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updatePurchaseItem(index, 'unit_price', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Tax %</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.tax_rate}
                          onChange={(e) => updatePurchaseItem(index, 'tax_rate', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Discount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.discount_amount}
                          onChange={(e) => updatePurchaseItem(index, 'discount_amount', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Batch #</Label>
                        <Input
                          value={item.batch_number}
                          onChange={(e) => updatePurchaseItem(index, 'batch_number', e.target.value)}
                          placeholder="Batch"
                        />
                      </div>
                      <div>
                        <Label>Expiry</Label>
                        <Input
                          type="date"
                          value={item.expiry_date}
                          onChange={(e) => updatePurchaseItem(index, 'expiry_date', e.target.value)}
                        />
                      </div>
                      <div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removePurchaseItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_amount">Overall Discount (₹)</Label>
                  <Input
                    id="discount_amount"
                    type="number"
                    step="0.01"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData({...formData, discount_amount: Number(e.target.value)})}
                  />
                </div>
                <div></div>
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
              {purchaseItems.length > 0 && (
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
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-₹{calculateTotals().totalDiscount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>₹{calculateTotals().total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingInvoice ? 'Update' : 'Create'}
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
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">All time invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {invoices.filter(invoice => invoice.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {invoices.filter(invoice => invoice.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">Approved invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <Package className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {invoices.filter(invoice => invoice.status === 'cancelled').length}
            </div>
            <p className="text-xs text-muted-foreground">Cancelled invoices</p>
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
                placeholder="Search invoices..."
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
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
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Invoices ({filteredInvoices.length})</CardTitle>
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
                    <th className="text-left p-2">Invoice #</th>
                    <th className="text-left p-2">Supplier</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Payment</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{invoice.invoice_number}</td>
                      <td className="p-2">{invoice.suppliers?.name}</td>
                      <td className="p-2">{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                      <td className="p-2 font-medium">₹{invoice.total_amount.toLocaleString()}</td>
                      <td className="p-2">
                        <Badge variant={getPaymentStatusBadgeVariant(invoice.payment_status)}>
                          {invoice.payment_status}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge variant={getStatusBadgeVariant(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewInvoice(invoice)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(invoice)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(invoice.id)}
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

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl dialog-content">
          <DialogHeader>
            <DialogTitle>Purchase Invoice - {selectedInvoice?.invoice_number}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Supplier Information</h3>
                  <p><strong>Name:</strong> {selectedInvoice.suppliers?.name}</p>
                  <p><strong>Invoice Date:</strong> {new Date(selectedInvoice.invoice_date).toLocaleDateString()}</p>
                  {selectedInvoice.due_date && (
                    <p><strong>Due Date:</strong> {new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Invoice Information</h3>
                  <p><strong>Supplier Invoice #:</strong> {selectedInvoice.supplier_invoice_number || 'N/A'}</p>
                  <p><strong>Status:</strong> {selectedInvoice.status}</p>
                  <p><strong>Payment Status:</strong> {selectedInvoice.payment_status}</p>
                </div>
              </div>

              {/* Purchase Items */}
              <div>
                <h3 className="font-semibold mb-2">Items</h3>
                <div className="">
                  <table className="w-full border">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-2 border">Product</th>
                        <th className="text-left p-2 border">Qty</th>
                        <th className="text-left p-2 border">Rate</th>
                        <th className="text-left p-2 border">Tax</th>
                        <th className="text-left p-2 border">Total</th>
                        <th className="text-left p-2 border">Batch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.purchase_items?.map((item) => (
                        <tr key={item.id}>
                          <td className="p-2 border">{item.product_name}</td>
                          <td className="p-2 border">{item.quantity}</td>
                          <td className="p-2 border">₹{item.unit_price.toFixed(2)}</td>
                          <td className="p-2 border">₹{item.tax_amount.toFixed(2)}</td>
                          <td className="p-2 border">₹{item.line_total.toFixed(2)}</td>
                          <td className="p-2 border">{item.batch_number || '-'}</td>
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
                    <span>₹{selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>₹{selectedInvoice.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-₹{selectedInvoice.discount_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>₹{selectedInvoice.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid:</span>
                    <span>₹{selectedInvoice.paid_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Balance:</span>
                    <span>₹{(selectedInvoice.total_amount - selectedInvoice.paid_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-muted-foreground">{selectedInvoice.notes}</p>
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