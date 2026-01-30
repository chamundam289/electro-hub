import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LazyWrapper } from '@/components/ui/LazyWrapper';
import { OrdersShimmer } from '@/components/ui/Shimmer';
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock,
  Eye,
  RotateCcw,
  MessageCircle,
  Lock,
  X,
  Edit
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders, Order } from '@/contexts/OrderContext';
import { toast } from 'sonner';

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders, loading, updateOrderStatus } = useOrders();

  const handleCancelOrder = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'cancelled');
      toast.success('Order cancelled successfully');
    } catch (error) {
      toast.error('Failed to cancel order');
    }
  };

  const handleEditOrder = (orderId: string) => {
    // For now, just show a message. In a real app, you'd navigate to an edit page
    toast.info('Order editing feature coming soon');
  };
  
  // Redirect to login if not authenticated
  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-6">
              Please login to view your orders and track their status.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <RotateCcw className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filterOrdersByStatus = (status?: string) => {
    if (!status) return orders;
    return orders.filter(order => order.status === status);
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">{order.order_number}</h3>
            <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</p>
          </div>
          <Badge className={getStatusColor(order.status)}>
            {getStatusIcon(order.status)}
            <span className="ml-1 capitalize">{order.status}</span>
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span>{item.product_name} x{item.quantity}</span>
              <span className="font-medium">₹{item.line_total.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div>
            <span className="text-lg font-bold">₹{order.total_amount.toFixed(2)}</span>
            {order.estimated_delivery && order.status !== 'delivered' && (
              <p className="text-xs text-gray-600">
                Est. delivery: {new Date(order.estimated_delivery).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            
            {/* Cancel button - only show for pending/processing orders */}
            {(order.status === 'pending' || order.status === 'processing') && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleCancelOrder(order.id)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
            
            {/* Edit button - only show for pending orders */}
            {order.status === 'pending' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleEditOrder(order.id)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
            
            {order.status === 'delivered' && (
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-1" />
                Reorder
              </Button>
            )}
            {(order.status === 'processing' || order.status === 'shipped') && (
              <Button variant="outline" size="sm">
                <MessageCircle className="h-4 w-4 mr-1" />
                Support
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b sticky top-16 z-40">
          <div className="container-fluid py-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-10 w-10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">My Orders</h1>
                <p className="text-sm text-muted-foreground">
                  {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container-fluid py-6">
          {loading ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold mb-2">Loading orders...</h2>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
              <Button asChild>
                <Link to="/products">Browse Products</Link>
              </Button>
              
              {/* Debug info */}
              {user && (
                <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left max-w-md mx-auto">
                  <p className="text-sm text-gray-600">
                    <strong>Debug Info:</strong><br/>
                    User Email: {user.email}<br/>
                    Looking for orders with customer_phone = {user.email}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="processing">Processing</TabsTrigger>
                <TabsTrigger value="shipped">Shipped</TabsTrigger>
                <TabsTrigger value="delivered">Delivered</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </TabsContent>

              <TabsContent value="processing">
                {filterOrdersByStatus('processing').map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
                {filterOrdersByStatus('processing').length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No processing orders</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="shipped">
                {filterOrdersByStatus('shipped').map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
                {filterOrdersByStatus('shipped').length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No shipped orders</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="delivered">
                {filterOrdersByStatus('delivered').map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
                {filterOrdersByStatus('delivered').length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No delivered orders</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cancelled">
                {filterOrdersByStatus('cancelled').map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
                {filterOrdersByStatus('cancelled').length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No cancelled orders</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Orders;