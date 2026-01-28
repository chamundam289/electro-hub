import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ProductGridShimmer, FormShimmer, CardShimmer } from '@/components/ui/shimmer';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, Minus, ShoppingCart, Trash2, Calculator, User, CreditCard, Mail, MessageCircle, Smartphone, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Product {
  id: string;
  name: string;
  slug: string;
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
  const [walkInCustomerPhone, setWalkInCustomerPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [taxPercentage, setTaxPercentage] = useState(18);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [sendSMS, setSendSMS] = useState(true);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    customer_type: 'retail'
  });

  // Mobile Recharge States
  const [mobileRecharge, setMobileRecharge] = useState({
    mobile_number: '',
    operator: '',
    plan_type: 'prepaid' as 'prepaid' | 'postpaid',
    recharge_amount: 0,
    customer_name: '',
    customer_phone: '',
    payment_method: 'cash',
    notes: ''
  });

  // Mobile Repair States
  const [mobileRepair, setMobileRepair] = useState({
    customer_name: '',
    customer_phone: '',
    device_brand: '',
    device_model: '',
    issue_description: '',
    repair_type: '',
    estimated_cost: 0,
    advance_payment: 0,
    technician_name: '',
    expected_delivery_date: '',
    warranty_period: 30,
    notes: ''
  });

  const OPERATORS = [
    'Airtel', 'Jio', 'Vi (Vodafone Idea)', 'BSNL', 'Aircel', 'Telenor', 'Tata Docomo', 'Reliance'
  ];

  const RECHARGE_PLANS = {
    prepaid: [
      { amount: 99, validity: '28 days', description: 'Unlimited calls + 1GB/day' },
      { amount: 149, validity: '28 days', description: 'Unlimited calls + 1.5GB/day' },
      { amount: 199, validity: '28 days', description: 'Unlimited calls + 2GB/day' },
      { amount: 299, validity: '28 days', description: 'Unlimited calls + 2.5GB/day' },
      { amount: 399, validity: '56 days', description: 'Unlimited calls + 2.5GB/day' },
      { amount: 499, validity: '56 days', description: 'Unlimited calls + 3GB/day' },
      { amount: 599, validity: '84 days', description: 'Unlimited calls + 2GB/day' },
      { amount: 999, validity: '84 days', description: 'Unlimited calls + 3GB/day' }
    ],
    postpaid: [
      { amount: 299, validity: '30 days', description: '25GB + Unlimited calls' },
      { amount: 399, validity: '30 days', description: '40GB + Unlimited calls' },
      { amount: 499, validity: '30 days', description: '75GB + Unlimited calls' },
      { amount: 699, validity: '30 days', description: '100GB + Unlimited calls' },
      { amount: 999, validity: '30 days', description: '150GB + Unlimited calls' }
    ]
  };

  const DEVICE_BRANDS = [
    'Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Huawei', 'Google', 'Motorola', 'Nokia', 'Other'
  ];

  const REPAIR_TYPES = [
    'Screen Replacement', 'Battery Replacement', 'Charging Port Repair', 'Speaker Repair', 'Camera Repair', 
    'Water Damage Repair', 'Software Issue', 'Motherboard Repair', 'Button Repair', 'Back Cover Replacement', 'Other'
  ];

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

  const generateBillTemplate = (order: any, customer: Customer | null) => {
    const itemsHtml = cart.map(item => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 8px; text-align: left;">${item.name}</td>
        <td style="padding: 12px 8px; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px 8px; text-align: right;">₹${item.price.toFixed(2)}</td>
        <td style="padding: 12px 8px; text-align: right; font-weight: 600;">₹${item.line_total.toFixed(2)}</td>
      </tr>
    `).join('');

    const totals = calculateTotals();

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
              <p style="margin: 4px 0; color: #6b7280; font-size: 14px;"><strong>Invoice #:</strong> ${order.invoice_number || order.id?.slice(0, 8) || 'POS-' + Date.now().toString().slice(-6)}</p>
              <p style="margin: 4px 0; color: #6b7280; font-size: 14px;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p style="margin: 4px 0; color: #6b7280; font-size: 14px;"><strong>Payment:</strong> <span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${paymentMethod.toUpperCase()}</span></p>
            </div>
            <div style="flex: 1; min-width: 200px;">
              <h3 style="margin: 0 0 10px 0; color: #374151; font-size: 16px; font-weight: 600;">Customer Details</h3>
              <p style="margin: 4px 0; color: #6b7280; font-size: 14px;"><strong>Name:</strong> ${customer?.name || 'Walk-in Customer'}</p>
              ${customer?.phone ? `<p style="margin: 4px 0; color: #6b7280; font-size: 14px;"><strong>Phone:</strong> ${customer.phone}</p>` : ''}
              ${customer?.email ? `<p style="margin: 4px 0; color: #6b7280; font-size: 14px;"><strong>Email:</strong> ${customer.email}</p>` : ''}
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
              <span>₹${totals.subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #6b7280;">
              <span>Tax:</span>
              <span>₹${totals.totalTax.toFixed(2)}</span>
            </div>
            ${totals.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #ef4444;">
              <span>Discount:</span>
              <span>-₹${totals.discount.toFixed(2)}</span>
            </div>` : ''}
            <div style="border-top: 2px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
              <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 700; color: #111827;">
                <span>Total:</span>
                <span style="color: #059669;">₹${totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        ${notes ? `
        <div style="padding: 20px; background: #fef3c7; border-left: 4px solid #f59e0b;">
          <h4 style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: 600;">Notes:</h4>
          <p style="margin: 0; color: #92400e; font-size: 14px;">${notes}</p>
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

  const sendBillViaEmail = async (order: any, customer: Customer | null) => {
    if (!customer?.email) {
      toast.error('Customer email not available');
      return false;
    }

    try {
      const billTemplate = generateBillTemplate(order, customer);
      const subject = `Invoice ${order.invoice_number || 'POS-' + Date.now().toString().slice(-6)} - ElectroStore`;
      
      // Real email sending using mailto (will open email client with pre-filled content)
      const emailBody = `Dear ${customer.name},

Thank you for your purchase! Please find your invoice details below:

Invoice Number: ${order.invoice_number || 'POS-' + Date.now().toString().slice(-6)}
Date: ${new Date().toLocaleDateString()}
Total Amount: ₹${order.total_amount}

Items purchased:
${order.order_items?.map((item: any) => `• ${item.product_name} x${item.quantity} - ₹${item.line_total}`).join('\n') || 'Items details will be attached'}

Payment Method: ${order.payment_method?.toUpperCase()}
Status: ${order.status?.toUpperCase()}

Thank you for choosing ElectroStore!

Best regards,
ElectroStore Team
contact@electrostore.com`;

      // Open email client with pre-filled content
      const mailtoLink = `mailto:${customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
      window.open(mailtoLink);
      
      toast.success(`📧 Email client opened for ${customer.email} - Please send the email`);
      return true;
    } catch (error) {
      toast.error('Failed to open email client');
      return false;
    }
  };

  const sendBillViaSMS = async (order: any, customer: Customer | null) => {
    if (!customer?.phone) {
      toast.error('Customer phone number not available');
      return false;
    }

    try {
      const totals = calculateTotals();
      const message = `🧾 ElectroStore Invoice
Invoice: ${order.invoice_number || 'POS-' + Date.now().toString().slice(-6)}
Date: ${new Date().toLocaleDateString()}
Customer: ${customer?.name || 'Walk-in Customer'}

Items: ${cart.length} item(s)
${cart.map(item => `• ${item.name} x${item.quantity} - ₹${item.line_total.toFixed(2)}`).join('\n')}

💰 Total: ₹${totals.total.toFixed(2)}
Payment: ${paymentMethod.toUpperCase()}

Thank you for your business! 🙏
ElectroStore - contact@electrostore.com`;

      // Real SMS sending using device SMS app
      const phoneNumber = customer.phone.replace(/[^\d]/g, '');
      const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
      window.open(smsUrl);
      
      toast.success(`📱 SMS app opened for ${customer.phone} - Please send the message`);
      return true;
    } catch (error) {
      toast.error('Failed to open SMS app');
      return false;
    }
  };

  const sendRechargeInvoiceViaSMS = (recharge: any, phoneNumber: string) => {
    if (!phoneNumber) {
      toast.error('Customer phone number not available');
      return false;
    }

    try {
      const message = `🎉 MOBILE RECHARGE SUCCESSFUL! 🎉

📱 Mobile: ${recharge.mobile_number}
🏢 Operator: ${recharge.operator}
💰 Amount: ₹${recharge.recharge_amount}
📋 Plan: ${recharge.plan_type.toUpperCase()}

🆔 Transaction ID: ${recharge.transaction_id}
🔗 Operator Ref: ${recharge.operator_transaction_id}
📅 Date: ${new Date().toLocaleDateString()}
⏰ Time: ${new Date().toLocaleTimeString()}

✅ Status: SUCCESS
💳 Payment: ${recharge.payment_method.toUpperCase()}

Thank you for choosing ElectroStore! 🙏
📧 contact@electrostore.com
📞 +1234567890

🔒 Secure | ⚡ Instant | 📱 24/7`;

      const cleanPhoneNumber = phoneNumber.replace(/[^\d]/g, '');
      const smsUrl = `sms:${cleanPhoneNumber}?body=${encodeURIComponent(message)}`;
      window.open(smsUrl);
      
      toast.success(`Recharge invoice sent via SMS to ${phoneNumber}`);
      return true;
    } catch (error) {
      toast.error('Failed to send SMS');
      return false;
    }
  };

  const sendRepairInvoiceViaSMS = (repair: any, phoneNumber: string) => {
    if (!phoneNumber) {
      toast.error('Customer phone number not available');
      return false;
    }

    try {
      const message = `🔧 MOBILE REPAIR SERVICE REGISTERED! 🔧

👤 Customer: ${repair.customer_name}
📱 Device: ${repair.device_brand} ${repair.device_model}
🔧 Service: ${repair.repair_type}
💰 Estimated Cost: ₹${repair.estimated_cost}

🆔 Service ID: ${repair.id.slice(0, 8)}
📅 Received: ${new Date().toLocaleDateString()}
⏰ Time: ${new Date().toLocaleTimeString()}

📋 Status: RECEIVED
💳 Payment: ${repair.payment_status.toUpperCase()}
${repair.advance_payment > 0 ? `💵 Advance Paid: ₹${repair.advance_payment}` : ''}

${repair.expected_delivery_date ? `📅 Expected Delivery: ${new Date(repair.expected_delivery_date).toLocaleDateString()}` : ''}
${repair.warranty_period ? `🛡️ Warranty: ${repair.warranty_period} days` : ''}

📝 Issue: ${repair.issue_description}

We'll keep you updated on progress! 📱
Thank you for choosing ElectroStore! 🙏

📧 repair@electrostore.com
📞 +1234567890

🔒 Quality Service | ⚡ Expert Repair | 📱 Warranty Included`;

      const cleanPhoneNumber = phoneNumber.replace(/[^\d]/g, '');
      const smsUrl = `sms:${cleanPhoneNumber}?body=${encodeURIComponent(message)}`;
      window.open(smsUrl);
      
      toast.success(`Repair service invoice sent via SMS to ${phoneNumber}`);
      return true;
    } catch (error) {
      toast.error('Failed to send SMS');
      return false;
    }
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
      const customerPhone = customer?.phone || walkInCustomerPhone;

      // Validate sending options if selected
      if (sendEmail && (!customer || !customer.email)) {
        toast.error('Customer email is required to send invoice via email');
        return;
      }
      
      if (sendSMS && !customerPhone) {
        toast.error('Customer phone number is required to send invoice via SMS');
        return;
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_id: selectedCustomer && selectedCustomer !== 'walk-in' ? selectedCustomer : null,
          customer_name: customer?.name || 'Walk-in Customer',
          customer_phone: customerPhone || '',
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
                notes: `Sale - Invoice: ${order.invoice_number || order.id.slice(0, 8)}`
              }]);
          } catch (invError) {
            console.log('Inventory transactions table not available yet:', invError);
          }
        }
      }

      // Send bills based on admin's choice (checkbox selection)
      let emailSent = false;
      let smsSent = false;

      // Send email only if checkbox is checked and customer has email
      if (sendEmail && customer?.email) {
        emailSent = await sendBillViaEmail(order, customer);
      }

      // Send SMS only if checkbox is checked and phone number is available
      if (sendSMS && customerPhone) {
        const customerForSMS = customer || { 
          name: 'Walk-in Customer', 
          phone: customerPhone,
          email: '',
          id: 'walk-in',
          customer_type: 'retail'
        };
        smsSent = await sendBillViaSMS(order, customerForSMS);
      }

      // Clear cart and reset form
      setCart([]);
      setSelectedCustomer('walk-in');
      setWalkInCustomerPhone('');
      setDiscountAmount(0);
      setNotes('');
      setSendEmail(false);
      setSendSMS(true);
      
      let successMessage = `Order ${order.invoice_number || order.id.slice(0, 8)} created successfully!`;
      if (emailSent && smsSent) {
        successMessage += ' Email & SMS sent to customer.';
      } else if (emailSent) {
        successMessage += ' Email sent to customer.';
      } else if (smsSent) {
        successMessage += ' SMS sent to customer.';
      }
      
      toast.success(successMessage);
      
    } catch (error) {
      console.error('Error processing order:', error);
      toast.error('Failed to process order');
    } finally {
      setLoading(false);
    }
  };

  const processMobileRecharge = async () => {
    if (!mobileRecharge.mobile_number || !mobileRecharge.operator || !mobileRecharge.recharge_amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const rechargeData = {
        ...mobileRecharge,
        payment_status: 'paid' as const,
        transaction_id: 'TXN' + Date.now(),
        operator_transaction_id: 'OP' + Date.now(),
        status: 'success' as const
      };

      // Save to database
      try {
        const { data, error } = await supabase
          .from('mobile_recharges' as any)
          .insert([rechargeData])
          .select()
          .single();

        if (error) {
          console.error('Error saving recharge:', error);
          toast.error(`Failed to save recharge: ${error.message}`);
          return; // Don't clear form if save failed
        }
        
        if (!data) {
          console.error('No data returned from recharge insert');
          toast.error('Failed to save recharge: No data returned');
          return;
        }

        // Send automatic SMS invoice to customer
        const smsSuccess = sendRechargeInvoiceViaSMS(data, rechargeData.mobile_number);
        
        let successMessage = `Mobile recharge of ₹${rechargeData.recharge_amount} completed successfully!`;
        if (smsSuccess) {
          successMessage += ' Invoice sent via SMS.';
        }
        
        toast.success(successMessage);
        
      } catch (dbError: any) {
        console.error('Database error:', dbError);
        toast.error(`Failed to process recharge: ${dbError?.message || 'Unknown error'}`);
        return; // Don't clear form if save failed
      }

      // Clear form
      setMobileRecharge({
        mobile_number: '',
        operator: '',
        plan_type: 'prepaid',
        recharge_amount: 0,
        customer_name: '',
        customer_phone: '',
        payment_method: 'cash',
        notes: ''
      });
      
    } catch (error) {
      console.error('Error processing mobile recharge:', error);
      toast.error('Failed to process mobile recharge');
    } finally {
      setLoading(false);
    }
  };

  const processMobileRepair = async () => {
    if (!mobileRepair.customer_name || !mobileRepair.customer_phone || !mobileRepair.device_brand || !mobileRepair.device_model || !mobileRepair.issue_description || !mobileRepair.repair_type || !mobileRepair.estimated_cost) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Clean up the data - convert empty strings to null for optional fields
      const repairData = {
        customer_name: mobileRepair.customer_name,
        customer_phone: mobileRepair.customer_phone,
        device_brand: mobileRepair.device_brand,
        device_model: mobileRepair.device_model,
        issue_description: mobileRepair.issue_description,
        repair_type: mobileRepair.repair_type,
        estimated_cost: mobileRepair.estimated_cost,
        advance_payment: mobileRepair.advance_payment || 0,
        technician_name: mobileRepair.technician_name || null,
        expected_delivery_date: mobileRepair.expected_delivery_date ? new Date(mobileRepair.expected_delivery_date).toISOString() : null,
        warranty_period: mobileRepair.warranty_period || 30,
        notes: mobileRepair.notes || null,
        payment_status: mobileRepair.advance_payment > 0 ? 'partial' as const : 'pending' as const,
        repair_status: 'received' as const,
        received_date: new Date().toISOString()
      };

      // Save to database
      console.log('Attempting to save mobile repair data:', repairData);
      
      const { data, error } = await supabase
        .from('mobile_repairs' as any)
        .insert([repairData])
        .select()
        .single();

      if (error) {
        console.error('Error saving repair to database:', error);
        toast.error(`Failed to save repair service: ${error.message}`);
        return; // Don't clear form if save failed
      } 
      
      if (!data) {
        console.error('No data returned from repair insert');
        toast.error('Failed to save repair service: No data returned');
        return;
      }

      console.log('Successfully saved repair data:', data);
      
      // Send automatic SMS invoice to customer
      const smsSuccess = sendRepairInvoiceViaSMS(data, repairData.customer_phone);
      
      let successMessage = `Mobile repair service registered successfully! Service ID: ${(data as any)?.id?.slice(0, 8) || 'Unknown'}`;
      if (smsSuccess) {
        successMessage += ' Invoice sent via SMS.';
      }
      
      toast.success(successMessage);

      // Clear form
      setMobileRepair({
        customer_name: '',
        customer_phone: '',
        device_brand: '',
        device_model: '',
        issue_description: '',
        repair_type: '',
        estimated_cost: 0,
        advance_payment: 0,
        technician_name: '',
        expected_delivery_date: '',
        warranty_period: 30,
        notes: ''
      });
      
    } catch (error) {
      console.error('Error processing mobile repair:', error);
      toast.error('Failed to register mobile repair service');
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
    <Tabs defaultValue="products" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="products" className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Products POS
        </TabsTrigger>
        <TabsTrigger value="mobile-recharge" className="flex items-center gap-2">
          <Smartphone className="h-4 w-4" />
          Mobile Recharge
        </TabsTrigger>
        <TabsTrigger value="mobile-repair" className="flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          Mobile Repair
        </TabsTrigger>
      </TabsList>

      <TabsContent value="products" className="mt-6">
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

            {selectedCustomer === 'walk-in' && (
              <div>
                <Label htmlFor="walk-in-phone">Customer Phone (for SMS invoice)</Label>
                <Input
                  id="walk-in-phone"
                  type="tel"
                  placeholder="Enter customer phone number"
                  value={walkInCustomerPhone}
                  onChange={(e) => setWalkInCustomerPhone(e.target.value)}
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  📱 Invoice will be sent automatically via SMS if phone number is provided
                </p>
              </div>
            )}
            
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
                  <DialogDescription>
                    Create a new customer account for this transaction.
                  </DialogDescription>
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

            {/* Bill Sending Options */}
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-sm font-medium">📧📱 Send Invoice Options</Label>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send-email"
                    checked={sendEmail}
                    onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                    disabled={selectedCustomer === 'walk-in' || !customers.find(c => c.id === selectedCustomer)?.email}
                  />
                  <Label htmlFor="send-email" className="flex items-center gap-2 text-sm cursor-pointer">
                    <Mail className="h-4 w-4 text-blue-600" />
                    Send via Email
                    {selectedCustomer !== 'walk-in' && customers.find(c => c.id === selectedCustomer)?.email && (
                      <span className="text-xs text-muted-foreground">
                        ({customers.find(c => c.id === selectedCustomer)?.email})
                      </span>
                    )}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send-sms"
                    checked={sendSMS}
                    onCheckedChange={(checked) => setSendSMS(checked as boolean)}
                    disabled={!walkInCustomerPhone && selectedCustomer === 'walk-in' || (selectedCustomer !== 'walk-in' && !customers.find(c => c.id === selectedCustomer)?.phone)}
                  />
                  <Label htmlFor="send-sms" className="flex items-center gap-2 text-sm cursor-pointer">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                    Send via SMS
                    {((selectedCustomer !== 'walk-in' && customers.find(c => c.id === selectedCustomer)?.phone) || walkInCustomerPhone) && (
                      <span className="text-xs text-muted-foreground">
                        ({customers.find(c => c.id === selectedCustomer)?.phone || walkInCustomerPhone})
                      </span>
                    )}
                  </Label>
                </div>
              </div>

              {/* Status Messages */}
              {sendEmail && selectedCustomer !== 'walk-in' && !customers.find(c => c.id === selectedCustomer)?.email && (
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  ❌ Selected customer doesn't have an email address.
                </p>
              )}

              {sendSMS && selectedCustomer === 'walk-in' && !walkInCustomerPhone && (
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  ❌ No phone number available for SMS.
                </p>
              )}

              {sendSMS && selectedCustomer !== 'walk-in' && !customers.find(c => c.id === selectedCustomer)?.phone && (
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  ❌ Selected customer doesn't have a phone number.
                </p>
              )}

              {selectedCustomer === 'walk-in' && !walkInCustomerPhone && sendSMS && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  💡 Add customer phone number above to send SMS invoice
                </p>
              )}

              {(sendEmail || sendSMS) && (
                <div className="bg-green-50 p-2 rounded">
                  <p className="text-xs text-green-700 font-medium">✅ Invoice will be sent via:</p>
                  <div className="text-xs text-green-600 mt-1">
                    {sendEmail && selectedCustomer !== 'walk-in' && customers.find(c => c.id === selectedCustomer)?.email && (
                      <p>📧 Email: {customers.find(c => c.id === selectedCustomer)?.email}</p>
                    )}
                    {sendSMS && ((selectedCustomer !== 'walk-in' && customers.find(c => c.id === selectedCustomer)?.phone) || walkInCustomerPhone) && (
                      <p>📱 SMS: {customers.find(c => c.id === selectedCustomer)?.phone || walkInCustomerPhone}</p>
                    )}
                  </div>
                </div>
              )}

              {!sendEmail && !sendSMS && (
                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  ℹ️ No sending method selected. Invoice will be processed without sending.
                </p>
              )}
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
      </TabsContent>

      <TabsContent value="mobile-recharge" className="mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mobile Recharge Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Mobile Recharge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  value={mobileRecharge.mobile_number}
                  onChange={(e) => setMobileRecharge({...mobileRecharge, mobile_number: e.target.value})}
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                />
              </div>

              <div>
                <Label htmlFor="operator">Operator *</Label>
                <Select value={mobileRecharge.operator} onValueChange={(value) => setMobileRecharge({...mobileRecharge, operator: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map(operator => (
                      <SelectItem key={operator} value={operator}>{operator}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="planType">Plan Type *</Label>
                <Select value={mobileRecharge.plan_type} onValueChange={(value: 'prepaid' | 'postpaid') => setMobileRecharge({...mobileRecharge, plan_type: value, recharge_amount: 0})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prepaid">Prepaid</SelectItem>
                    <SelectItem value="postpaid">Postpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Recharge Plan *</Label>
                <Select value={mobileRecharge.recharge_amount.toString()} onValueChange={(value) => setMobileRecharge({...mobileRecharge, recharge_amount: Number(value)})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recharge plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECHARGE_PLANS[mobileRecharge.plan_type].map(plan => (
                      <SelectItem key={plan.amount} value={plan.amount.toString()}>
                        ₹{plan.amount} - {plan.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={mobileRecharge.customer_name}
                  onChange={(e) => setMobileRecharge({...mobileRecharge, customer_name: e.target.value})}
                  placeholder="Customer name (optional)"
                />
              </div>

              <div>
                <Label htmlFor="customerPhone">Customer Phone</Label>
                <Input
                  id="customerPhone"
                  value={mobileRecharge.customer_phone}
                  onChange={(e) => setMobileRecharge({...mobileRecharge, customer_phone: e.target.value})}
                  placeholder="Customer phone (optional)"
                />
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select value={mobileRecharge.payment_method} onValueChange={(value) => setMobileRecharge({...mobileRecharge, payment_method: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={mobileRecharge.notes}
                  onChange={(e) => setMobileRecharge({...mobileRecharge, notes: e.target.value})}
                  placeholder="Additional notes (optional)"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Recharge Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Recharge Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mobileRecharge.mobile_number && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Recharge Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Mobile Number:</span>
                      <span className="font-medium">{mobileRecharge.mobile_number}</span>
                    </div>
                    {mobileRecharge.operator && (
                      <div className="flex justify-between">
                        <span>Operator:</span>
                        <span className="font-medium">{mobileRecharge.operator}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Plan Type:</span>
                      <span className="font-medium capitalize">{mobileRecharge.plan_type}</span>
                    </div>
                    {mobileRecharge.recharge_amount > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span>Plan Details:</span>
                          <span className="font-medium">
                            {RECHARGE_PLANS[mobileRecharge.plan_type].find(p => p.amount === mobileRecharge.recharge_amount)?.description}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Validity:</span>
                          <span className="font-medium">
                            {RECHARGE_PLANS[mobileRecharge.plan_type].find(p => p.amount === mobileRecharge.recharge_amount)?.validity}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {mobileRecharge.recharge_amount > 0 && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-green-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-600">₹{mobileRecharge.recharge_amount}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-green-700">Payment Method:</span>
                    <span className="text-sm font-medium text-green-800 capitalize">{mobileRecharge.payment_method}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={processMobileRecharge}
                disabled={loading || !mobileRecharge.mobile_number || !mobileRecharge.operator || !mobileRecharge.recharge_amount}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  'Processing Recharge...'
                ) : (
                  <>
                    <Smartphone className="h-4 w-4 mr-2" />
                    Process Recharge - ₹{mobileRecharge.recharge_amount}
                  </>
                )}
              </Button>

              {mobileRecharge.recharge_amount > 0 && (
                <div className="text-xs text-muted-foreground text-center">
                  <p>⚡ Instant recharge processing</p>
                  <p>📱 SMS confirmation will be sent</p>
                  <p>🔒 Secure payment processing</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="mobile-repair" className="mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mobile Repair Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Mobile Repair Service
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="repair-customer-name">Customer Name *</Label>
                  <Input
                    id="repair-customer-name"
                    value={mobileRepair.customer_name}
                    onChange={(e) => setMobileRepair({...mobileRepair, customer_name: e.target.value})}
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="repair-customer-phone">Customer Phone *</Label>
                  <Input
                    id="repair-customer-phone"
                    value={mobileRepair.customer_phone}
                    onChange={(e) => setMobileRepair({...mobileRepair, customer_phone: e.target.value})}
                    placeholder="Enter phone number"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="repair-device-brand">Device Brand *</Label>
                  <Select value={mobileRepair.device_brand} onValueChange={(value) => setMobileRepair({...mobileRepair, device_brand: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEVICE_BRANDS.map(brand => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="repair-device-model">Device Model *</Label>
                  <Input
                    id="repair-device-model"
                    value={mobileRepair.device_model}
                    onChange={(e) => setMobileRepair({...mobileRepair, device_model: e.target.value})}
                    placeholder="Enter device model"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="repair-type">Repair Type *</Label>
                <Select value={mobileRepair.repair_type} onValueChange={(value) => setMobileRepair({...mobileRepair, repair_type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select repair type" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPAIR_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="repair-issue">Issue Description *</Label>
                <Textarea
                  id="repair-issue"
                  value={mobileRepair.issue_description}
                  onChange={(e) => setMobileRepair({...mobileRepair, issue_description: e.target.value})}
                  placeholder="Describe the issue in detail"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="repair-cost">Estimated Cost *</Label>
                  <Input
                    id="repair-cost"
                    type="number"
                    value={mobileRepair.estimated_cost}
                    onChange={(e) => setMobileRepair({...mobileRepair, estimated_cost: Number(e.target.value)})}
                    placeholder="Enter estimated cost"
                  />
                </div>
                <div>
                  <Label htmlFor="repair-advance">Advance Payment</Label>
                  <Input
                    id="repair-advance"
                    type="number"
                    value={mobileRepair.advance_payment}
                    onChange={(e) => setMobileRepair({...mobileRepair, advance_payment: Number(e.target.value)})}
                    placeholder="Enter advance payment"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="repair-technician">Technician Name</Label>
                  <Input
                    id="repair-technician"
                    value={mobileRepair.technician_name}
                    onChange={(e) => setMobileRepair({...mobileRepair, technician_name: e.target.value})}
                    placeholder="Assign technician"
                  />
                </div>
                <div>
                  <Label htmlFor="repair-delivery">Expected Delivery</Label>
                  <Input
                    id="repair-delivery"
                    type="date"
                    value={mobileRepair.expected_delivery_date}
                    onChange={(e) => setMobileRepair({...mobileRepair, expected_delivery_date: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="repair-warranty">Warranty Period (Days)</Label>
                <Input
                  id="repair-warranty"
                  type="number"
                  value={mobileRepair.warranty_period}
                  onChange={(e) => setMobileRepair({...mobileRepair, warranty_period: Number(e.target.value)})}
                  placeholder="30"
                />
              </div>

              <div>
                <Label htmlFor="repair-notes">Additional Notes</Label>
                <Textarea
                  id="repair-notes"
                  value={mobileRepair.notes}
                  onChange={(e) => setMobileRepair({...mobileRepair, notes: e.target.value})}
                  placeholder="Any additional notes or special instructions"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Mobile Repair Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Service Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(mobileRepair.customer_name || mobileRepair.device_brand || mobileRepair.device_model) && (
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h3 className="font-semibold text-orange-900 mb-2">Service Details</h3>
                  <div className="space-y-2 text-sm">
                    {mobileRepair.customer_name && (
                      <div className="flex justify-between">
                        <span>Customer:</span>
                        <span className="font-medium">{mobileRepair.customer_name}</span>
                      </div>
                    )}
                    {mobileRepair.customer_phone && (
                      <div className="flex justify-between">
                        <span>Phone:</span>
                        <span className="font-medium">{mobileRepair.customer_phone}</span>
                      </div>
                    )}
                    {mobileRepair.device_brand && mobileRepair.device_model && (
                      <div className="flex justify-between">
                        <span>Device:</span>
                        <span className="font-medium">{mobileRepair.device_brand} {mobileRepair.device_model}</span>
                      </div>
                    )}
                    {mobileRepair.repair_type && (
                      <div className="flex justify-between">
                        <span>Service:</span>
                        <span className="font-medium">{mobileRepair.repair_type}</span>
                      </div>
                    )}
                    {mobileRepair.technician_name && (
                      <div className="flex justify-between">
                        <span>Technician:</span>
                        <span className="font-medium">{mobileRepair.technician_name}</span>
                      </div>
                    )}
                    {mobileRepair.expected_delivery_date && (
                      <div className="flex justify-between">
                        <span>Expected Delivery:</span>
                        <span className="font-medium">{new Date(mobileRepair.expected_delivery_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {mobileRepair.estimated_cost > 0 && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-green-900">Estimated Cost:</span>
                    <span className="text-2xl font-bold text-green-600">₹{mobileRepair.estimated_cost}</span>
                  </div>
                  {mobileRepair.advance_payment > 0 && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-green-700">Advance Payment:</span>
                      <span className="text-sm font-medium text-green-800">₹{mobileRepair.advance_payment}</span>
                    </div>
                  )}
                  {mobileRepair.advance_payment > 0 && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-green-700">Remaining:</span>
                      <span className="text-sm font-medium text-green-800">₹{mobileRepair.estimated_cost - mobileRepair.advance_payment}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-green-700">Warranty:</span>
                    <span className="text-sm font-medium text-green-800">{mobileRepair.warranty_period} days</span>
                  </div>
                </div>
              )}

              <Button
                onClick={processMobileRepair}
                disabled={loading || !mobileRepair.customer_name || !mobileRepair.customer_phone || !mobileRepair.device_brand || !mobileRepair.device_model || !mobileRepair.issue_description || !mobileRepair.repair_type || !mobileRepair.estimated_cost}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  'Registering Service...'
                ) : (
                  <>
                    <Wrench className="h-4 w-4 mr-2" />
                    Register Repair Service - ₹{mobileRepair.estimated_cost}
                  </>
                )}
              </Button>

              {mobileRepair.estimated_cost > 0 && (
                <div className="text-xs text-muted-foreground text-center">
                  <p>🔧 Expert technician service</p>
                  <p>📱 SMS updates on progress</p>
                  <p>🛡️ Warranty included</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}