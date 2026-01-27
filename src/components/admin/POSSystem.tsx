import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, Minus, ShoppingCart, Trash2, Calculator, User, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  sku?: string;
  tax_rate?: number;
  unit?: string;
}

interface CartItem extends Product {
  quantity: number;
  total: number;
  tax_amount: number;
  line_total: number;
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  customer_type: string;
  credit_limit?: number;
  outstanding_balance?: number;
}

export default function POSSystem() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('walk-in');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [taxPercentage, setTaxPercentage] = useState(18);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    customer_type: 'retail'
  });

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_visible', true)
        .gt('stock_quantity', 0);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.log('Customers table not available yet:', error.message);
        setCustomers([]);
        return;
      }
      setCustomers(data || []);
    } catch (error) {
      console.log('Error fetching customers (table may not exist yet):', error);
      setCustomers([]);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      const taxAmount = (product.price * (product.tax_rate || taxPercentage)) / 100;
      const lineTotal = product.price + taxAmount;
      
      const cartItem: CartItem = {
        ...product,
        quantity: 1,
        total: product.price,
        tax_amount: taxAmount,
        line_total: lineTotal
      };
      
      setCart([...cart, cartItem]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item => {
      if (item.id === productId) {
        const total = item.price * newQuantity;
        const taxAmount = (total * (item.tax_rate || taxPercentage)) / 100;
        const lineTotal = total + taxAmount;
        
        return {
          ...item,
          quantity: newQuantity,
          total,
          tax_amount: taxAmount,
          line_total: lineTotal
        };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const totalTax = cart.reduce((sum, item) => sum + item.tax_amount, 0);
    
    let discountValue = 0;
    if (discountType === 'percentage') {
      discountValue = (subtotal * discountAmount) / 100;
    } else {
      discountValue = discountAmount;
    }
    
    const total = subtotal + totalTax - discountValue;
    
    return {
      subtotal,
      totalTax,
      discount: discountValue,
      total: Math.max(0, total)
    };
  };

  const createCustomer = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          ...newCustomer,
          is_active: true,
          outstanding_balance: 0,
          credit_limit: 0
        }])
        .select()
        .single();

      if (error) {
        console.log('Error creating customer (table may not exist yet):', error.message);
        toast.error('Customer creation not available yet');
        return;
      }
      
      setCustomers([...customers, data]);
      setSelectedCustomer(data.id);
      setNewCustomer({ name: '', phone: '', email: '', customer_type: 'retail' });
      setShowCustomerDialog(false);
      toast.success('Customer created successfully');
    } catch (error) {
      console.log('Error creating customer:', error);
      toast.error('Customer creation not available yet');
    }
  };

  const processOrder = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      setLoading(true);
      const totals = calculateTotals();
      const customer = customers.find(c => c.id === selectedCustomer && selectedCustomer !== 'walk-in');

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_id: selectedCustomer && selectedCustomer !== 'walk-in' ? selectedCustomer : null,
          customer_name: customer?.name || 'Walk-in Customer',
          customer_phone: customer?.phone || '',
          subtotal: totals.subtotal,
          tax_amount: totals.totalTax,
          discount_amount: totals.discount,
          total_amount: totals.total,
          payment_method: paymentMethod,
          payment_status: 'paid',
          status: 'confirmed',
          notes
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_sku: item.sku,
        quantity: item.quantity,
        unit_price: item.price,
        tax_rate: item.tax_rate || taxPercentage,
        tax_amount: item.tax_amount,
        discount_amount: 0,
        line_total: item.line_total
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update inventory
      for (const item of cart) {
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.id)
          .single();

        if (product) {
          const newQuantity = product.stock_quantity - item.quantity;
          
          await supabase
            .from('products')
            .update({ stock_quantity: newQuantity })
            .eq('id', item.id);

          // Create inventory transaction
          try {
            await supabase
              .from('inventory_transactions')
              .insert([{
                product_id: item.id,
                transaction_type: 'sale',
                reference_type: 'order',
                reference_id: order.id,
                quantity_change: -item.quantity,
                quantity_before: product.stock_quantity,
                quantity_after: newQuantity,
                unit_cost: item.price,
                notes: `Sale - Invoice: ${order.invoice_number}`
              }]);
          } catch (invError) {
            console.log('Inventory transactions table not available yet:', invError);
          }
        }
      }

      // Clear cart and reset form
      setCart([]);
      setSelectedCustomer('walk-in');
      setDiscountAmount(0);
      setNotes('');
      
      toast.success(`Order ${order.invoice_number} created successfully!`);
      
    } catch (error) {
      console.error('Error processing order:', error);
      toast.error('Failed to process order');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totals = calculateTotals();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Products Section */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Products
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => addToCart(product)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-sm">{product.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {product.stock_quantity} {product.unit || 'pcs'}
                    </Badge>
                  </div>
                  <p className="text-lg font-bold text-green-600">₹{product.price}</p>
                  {product.sku && (
                    <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart & Checkout Section */}
      <div className="space-y-4">
        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Customer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Customer</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                      placeholder="Email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Customer Type</Label>
                    <Select value={newCustomer.customer_type} onValueChange={(value) => setNewCustomer({...newCustomer, customer_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="wholesale">Wholesale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={createCustomer} className="w-full">
                    Create Customer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Cart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart ({cart.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Cart is empty</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Totals & Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Discount */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Discount</Label>
                <Input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={discountType} onValueChange={(value: 'amount' | 'percentage') => setDiscountType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amount">Amount (₹)</SelectItem>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Order notes..."
                rows={2}
              />
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>₹{totals.totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-₹{totals.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>₹{totals.total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={processOrder}
              disabled={loading || cart.length === 0}
              className="w-full"
              size="lg"
            >
              {loading ? (
                'Processing...'
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Complete Sale
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}