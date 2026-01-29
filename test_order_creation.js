// Simple test to create an order directly in the database
// This is just for testing - run this in browser console after logging in

const testCreateOrder = async () => {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('Please login first');
    return;
  }

  console.log('Creating test order for user:', user.email);

  // Create a test order
  const orderNumber = `TEST-${Date.now()}`;
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      customer_name: 'Test Customer',
      customer_phone: user.email, // Use email for identification
      shipping_name: 'Test Customer',
      shipping_address: '123 Test Street',
      shipping_city: 'Test City',
      shipping_zipcode: '12345',
      subtotal: 99.99,
      total_amount: 99.99,
      payment_method: 'Cash on Delivery',
      estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Test order',
      status: 'pending',
      payment_status: 'pending'
    })
    .select()
    .single();

  if (orderError) {
    console.error('Error creating order:', orderError);
    return;
  }

  console.log('Created order:', order);

  // Create test order items
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert([
      {
        order_id: order.id,
        product_name: 'Test Product 1',
        quantity: 2,
        unit_price: 29.99,
        line_total: 59.98
      },
      {
        order_id: order.id,
        product_name: 'Test Product 2',
        quantity: 1,
        unit_price: 39.99,
        line_total: 39.99
      }
    ]);

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
    return;
  }

  console.log('Test order created successfully! Order number:', orderNumber);
  console.log('Now refresh the Orders page to see it');
};

// Run the test
testCreateOrder();