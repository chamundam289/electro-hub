import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { DataPagination } from '@/components/ui/data-pagination';
import { TableShimmer, StatsCardShimmer } from '@/components/ui/shimmer';
import { usePagination } from '@/hooks/usePagination';
import { useShipping, Shipment } from '@/hooks/useShipping';
import { 
  Truck, 
  Package, 
  MapPin, 
  Clock, 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  ExternalLink,
  Calendar,
  Weight,
  Ruler,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

export default function ShippingManagement() {
  const {
    shipments,
    providers,
    zones,
    loading,
    error,
    createShipment,
    updateShipmentStatus,
    updateShipment,
    deleteShipment,
    getOrdersWithoutShipments
  } = useShipping();

  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProvider, setFilterProvider] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [ordersWithoutShipments, setOrdersWithoutShipments] = useState<any[]>([]);

  // Form states for create/edit
  const [formData, setFormData] = useState({
    order_id: '',
    shipping_provider_id: '',
    shipping_zone_id: '',
    weight_kg: '',
    dimensions_length: '',
    dimensions_width: '',
    dimensions_height: '',
    pickup_address: '',
    delivery_address: '',
    special_instructions: ''
  });

  useEffect(() => {
    const fetchOrdersWithoutShipments = async () => {
      try {
        const orders = await getOrdersWithoutShipments();
        setOrdersWithoutShipments(orders);
      } catch (error) {
        console.error('Error fetching orders for shipping:', error);
        setOrdersWithoutShipments([]);
      }
    };
    
    // Fetch orders when component mounts or when shipments change
    fetchOrdersWithoutShipments();
  }, [shipments]); // Add shipments as dependency

  const filteredShipments = useMemo(() => {
    return shipments.filter(shipment => {
      const matchesSearch = 
        (shipment.tracking_number && shipment.tracking_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (shipment.orders?.order_number && shipment.orders.order_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (shipment.orders?.customer_name && shipment.orders.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = filterStatus === 'all' || shipment.status === filterStatus;
      const matchesProvider = filterProvider === 'all' || shipment.shipping_provider_id === filterProvider;

      let matchesDate = true;
      if (dateFrom || dateTo) {
        const shipmentDate = new Date(shipment.created_at).toISOString().split('T')[0];
        if (dateFrom && shipmentDate < dateFrom) matchesDate = false;
        if (dateTo && shipmentDate > dateTo) matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesProvider && matchesDate;
    });
  }, [shipments, searchTerm, filterStatus, filterProvider, dateFrom, dateTo]);

  const pagination = usePagination({
    totalItems: filteredShipments.length,
    itemsPerPage: 20,
  });

  const paginatedShipments = useMemo(() => {
    const startIndex = pagination.startIndex;
    const endIndex = pagination.endIndex;
    return filteredShipments.slice(startIndex, endIndex);
  }, [filteredShipments, pagination.startIndex, pagination.endIndex]);

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.order_id) {
      toast.error('Please select an order');
      return;
    }

    try {
      await createShipment({
        order_id: formData.order_id,
        shipping_provider_id: formData.shipping_provider_id || undefined,
        shipping_zone_id: formData.shipping_zone_id || undefined,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : undefined,
        dimensions_length: formData.dimensions_length ? parseFloat(formData.dimensions_length) : undefined,
        dimensions_width: formData.dimensions_width ? parseFloat(formData.dimensions_width) : undefined,
        dimensions_height: formData.dimensions_height ? parseFloat(formData.dimensions_height) : undefined,
        pickup_address: formData.pickup_address || undefined,
        delivery_address: formData.delivery_address || undefined,
        special_instructions: formData.special_instructions || undefined
      });

      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleUpdateStatus = async (shipmentId: string, status: string) => {
    const location = prompt('Enter location (optional):');
    const description = prompt('Enter description (optional):');
    
    try {
      await updateShipmentStatus(shipmentId, status, location || undefined, description || undefined);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleDeleteShipment = async (shipmentId: string, trackingNumber?: string) => {
    if (!confirm(`Are you sure you want to delete shipment ${trackingNumber || shipmentId.slice(0, 8)}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteShipment(shipmentId);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const resetForm = () => {
    setFormData({
      order_id: '',
      shipping_provider_id: '',
      shipping_zone_id: '',
      weight_kg: '',
      dimensions_length: '',
      dimensions_width: '',
      dimensions_height: '',
      pickup_address: '',
      delivery_address: '',
      special_instructions: ''
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'picked_up':
        return <Package className="h-4 w-4" />;
      case 'in_transit':
        return <Truck className="h-4 w-4" />;
      case 'out_for_delivery':
        return <MapPin className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'returned':
        return <RotateCcw className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'picked_up':
        return 'bg-blue-100 text-blue-800';
      case 'in_transit':
        return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Statistics
  const totalShipments = shipments.length;
  const pendingShipments = shipments.filter(s => s.status === 'pending').length;
  const inTransitShipments = shipments.filter(s => ['picked_up', 'in_transit', 'out_for_delivery'].includes(s.status)).length;
  const deliveredShipments = shipments.filter(s => s.status === 'delivered').length;
  const totalShippingCost = shipments.reduce((sum, s) => sum + (s.total_cost || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-shimmer"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-shimmer"></div>
        </div>

        {/* Statistics Shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCardShimmer key={i} />
          ))}
        </div>

        {/* Filters Shimmer */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-shimmer"></div>
                  <div className="h-10 w-full bg-gray-200 rounded animate-shimmer"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Table Shimmer */}
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-gray-200 rounded animate-shimmer"></div>
          </CardHeader>
          <CardContent>
            <TableShimmer rows={8} columns={8} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show setup message if shipping tables don't exist
  if (error && error.includes('not found')) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Shipping Management</h1>
        </div>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800 mb-4">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Database Setup Required</span>
            </div>
            <p className="text-yellow-700 mb-4">
              Shipping management tables are not set up in your database. Please run the database migration to enable shipping features.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-yellow-600">
                <strong>Steps to setup:</strong>
              </p>
              <ol className="list-decimal list-inside text-sm text-yellow-600 space-y-1">
                <li>Go to your Supabase Dashboard</li>
                <li>Navigate to SQL Editor</li>
                <li>Run the shipping_management_tables.sql script</li>
                <li>Refresh this page</li>
              </ol>
            </div>
            <div className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Shipping Management</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Shipment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <div className="p-4">
            <DialogHeader>
              <DialogTitle>Create New Shipment</DialogTitle>
              <DialogDescription>
                Create a new shipment for an order that needs to be shipped.
              </DialogDescription>
            </DialogHeader>

            {/* Debug Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-blue-800 mb-2">Debug Information:</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>Available Orders: {ordersWithoutShipments.length}</p>
                <p>Existing Shipments: {shipments.length}</p>
                <p>Shipping Providers: {providers.length}</p>
                <p>Shipping Zones: {zones.length}</p>
                {ordersWithoutShipments.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium">View Available Orders</summary>
                    <div className="mt-2 space-y-1">
                      {ordersWithoutShipments.map(order => (
                        <div key={order.id} className="text-xs bg-white p-2 rounded border">
                          {order.order_number} - {order.customer_name} - Status: {order.status} - ₹{order.total_amount}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
            <form onSubmit={handleCreateShipment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Order *</Label>
                  <Select value={formData.order_id} onValueChange={(value) => setFormData({...formData, order_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select order to ship" />
                    </SelectTrigger>
                    <SelectContent>
                      {ordersWithoutShipments.length === 0 ? (
                        <SelectItem value="" disabled>
                          No orders available for shipping
                        </SelectItem>
                      ) : (
                        ordersWithoutShipments.map((order) => (
                          <SelectItem key={order.id} value={order.id}>
                            {order.order_number} - {order.customer_name} (₹{order.total_amount}) - {order.status}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {ordersWithoutShipments.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      No orders with status 'pending', 'processing', or 'shipped' are available for shipping.
                    </p>
                  )}
                </div>
                <div>
                  <Label>Shipping Provider</Label>
                  <Select value={formData.shipping_provider_id} onValueChange={(value) => setFormData({...formData, shipping_provider_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.filter(p => p.is_active).map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Shipping Zone</Label>
                  <Select value={formData.shipping_zone_id} onValueChange={(value) => setFormData({...formData, shipping_zone_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.filter(z => z.is_active).map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({...formData, weight_kg: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Length (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={formData.dimensions_length}
                    onChange={(e) => setFormData({...formData, dimensions_length: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Width (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={formData.dimensions_width}
                    onChange={(e) => setFormData({...formData, dimensions_width: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Height (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={formData.dimensions_height}
                    onChange={(e) => setFormData({...formData, dimensions_height: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>Pickup Address</Label>
                <Textarea
                  placeholder="Enter pickup address"
                  value={formData.pickup_address}
                  onChange={(e) => setFormData({...formData, pickup_address: e.target.value})}
                />
              </div>
              <div>
                <Label>Delivery Address</Label>
                <Textarea
                  placeholder="Enter delivery address"
                  value={formData.delivery_address}
                  onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                />
              </div>
              <div>
                <Label>Special Instructions</Label>
                <Textarea
                  placeholder="Enter any special instructions"
                  value={formData.special_instructions}
                  onChange={(e) => setFormData({...formData, special_instructions: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Shipment
                </Button>
              </div>
            </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShipments}</div>
            <p className="text-xs text-muted-foreground">All shipments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Pickup</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingShipments}</div>
            <p className="text-xs text-muted-foreground">Awaiting pickup</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inTransitShipments}</div>
            <p className="text-xs text-muted-foreground">Being delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{deliveredShipments}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <Label>Search Shipments</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tracking, order, customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Provider</Label>
              <Select value={filterProvider} onValueChange={setFilterProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
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
                setFilterProvider('all');
                setDateFrom('');
                setDateTo('');
              }}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shipments ({filteredShipments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Tracking</th>
                  <th className="text-left p-2">Order</th>
                  <th className="text-left p-2">Customer</th>
                  <th className="text-left p-2">Provider</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Cost</th>
                  <th className="text-left p-2">Delivery</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedShipments.map((shipment) => (
                  <tr key={shipment.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{shipment.tracking_number}</p>
                        <p className="text-xs text-gray-500">{new Date(shipment.created_at).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{shipment.orders?.order_number}</p>
                        <p className="text-xs text-gray-500">₹{shipment.orders?.total_amount.toFixed(2)}</p>
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{shipment.orders?.customer_name}</p>
                        <p className="text-xs text-gray-500">{shipment.orders?.customer_phone}</p>
                      </div>
                    </td>
                    <td className="p-2">
                      <p className="font-medium">{shipment.shipping_providers?.name || 'Not assigned'}</p>
                    </td>
                    <td className="p-2">
                      <Select
                        value={shipment.status}
                        onValueChange={(value) => handleUpdateStatus(shipment.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(shipment.status)}
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="picked_up">Picked Up</SelectItem>
                          <SelectItem value="in_transit">In Transit</SelectItem>
                          <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="returned">Returned</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <div>
                        <p className="font-medium">₹{shipment.total_cost.toFixed(2)}</p>
                        {shipment.weight_kg && (
                          <p className="text-xs text-gray-500">{shipment.weight_kg}kg</p>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        {shipment.estimated_delivery_date && (
                          <p className="text-sm">Est: {new Date(shipment.estimated_delivery_date).toLocaleDateString()}</p>
                        )}
                        {shipment.actual_delivery_date && (
                          <p className="text-xs text-green-600">Delivered: {new Date(shipment.actual_delivery_date).toLocaleDateString()}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedShipment(shipment);
                            setIsViewDialogOpen(true);
                          }}
                          title="View Details"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedShipment(shipment);
                            setIsEditDialogOpen(true);
                          }}
                          title="Edit Shipment"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {shipment.tracking_number && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(`https://www.google.com/search?q=${shipment.tracking_number}+tracking`, '_blank')}
                            title="Track Package"
                            className="text-green-600 hover:text-green-700"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteShipment(shipment.id, shipment.tracking_number)}
                          title="Delete Shipment"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredShipments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No shipments found matching your criteria.
              </div>
            )}
          </div>
          
          {filteredShipments.length > 0 && (
            <div className="mt-4">
              <DataPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={filteredShipments.length}
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
                itemsPerPageOptions={[10, 20, 50, 100]}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Shipment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <div className="p-4">
          <DialogHeader>
            <DialogTitle>Shipment Details</DialogTitle>
            <DialogDescription>
              Complete shipment information and tracking history.
            </DialogDescription>
          </DialogHeader>
          {selectedShipment && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tracking Number</Label>
                  <p className="font-medium">{selectedShipment.tracking_number}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedShipment.status)}>
                    {getStatusIcon(selectedShipment.status)}
                    <span className="ml-1 capitalize">{selectedShipment.status.replace('_', ' ')}</span>
                  </Badge>
                </div>
                <div>
                  <Label>Order Number</Label>
                  <p className="font-medium">{selectedShipment.orders?.order_number}</p>
                </div>
                <div>
                  <Label>Customer</Label>
                  <p className="font-medium">{selectedShipment.orders?.customer_name}</p>
                  <p className="text-sm text-gray-600">{selectedShipment.orders?.customer_phone}</p>
                </div>
                <div>
                  <Label>Shipping Provider</Label>
                  <p className="font-medium">{selectedShipment.shipping_providers?.name || 'Not assigned'}</p>
                </div>
                <div>
                  <Label>Shipping Zone</Label>
                  <p className="font-medium">{selectedShipment.shipping_zones?.name || 'Not assigned'}</p>
                </div>
              </div>

              {/* Package Details */}
              <div>
                <h3 className="font-semibold mb-3">Package Details</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label>Weight</Label>
                    <p className="font-medium">{selectedShipment.weight_kg ? `${selectedShipment.weight_kg} kg` : 'Not specified'}</p>
                  </div>
                  <div>
                    <Label>Length</Label>
                    <p className="font-medium">{selectedShipment.dimensions_length ? `${selectedShipment.dimensions_length} cm` : 'Not specified'}</p>
                  </div>
                  <div>
                    <Label>Width</Label>
                    <p className="font-medium">{selectedShipment.dimensions_width ? `${selectedShipment.dimensions_width} cm` : 'Not specified'}</p>
                  </div>
                  <div>
                    <Label>Height</Label>
                    <p className="font-medium">{selectedShipment.dimensions_height ? `${selectedShipment.dimensions_height} cm` : 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Pickup Address</Label>
                  <div className="mt-2 p-3 bg-gray-50 rounded">
                    <p>{selectedShipment.pickup_address || 'Not specified'}</p>
                  </div>
                </div>
                <div>
                  <Label>Delivery Address</Label>
                  <div className="mt-2 p-3 bg-gray-50 rounded">
                    <p>{selectedShipment.delivery_address || selectedShipment.orders?.shipping_address || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Dates and Costs */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Pickup Date</Label>
                  <p className="font-medium">{selectedShipment.pickup_date ? new Date(selectedShipment.pickup_date).toLocaleDateString() : 'Not scheduled'}</p>
                </div>
                <div>
                  <Label>Estimated Delivery</Label>
                  <p className="font-medium">{selectedShipment.estimated_delivery_date ? new Date(selectedShipment.estimated_delivery_date).toLocaleDateString() : 'Not estimated'}</p>
                </div>
                <div>
                  <Label>Actual Delivery</Label>
                  <p className="font-medium">{selectedShipment.actual_delivery_date ? new Date(selectedShipment.actual_delivery_date).toLocaleDateString() : 'Not delivered'}</p>
                </div>
                <div>
                  <Label>Shipping Cost</Label>
                  <p className="font-medium">₹{selectedShipment.shipping_cost.toFixed(2)}</p>
                </div>
                <div>
                  <Label>Insurance Cost</Label>
                  <p className="font-medium">₹{selectedShipment.insurance_cost.toFixed(2)}</p>
                </div>
                <div>
                  <Label>Total Cost</Label>
                  <p className="font-medium text-lg">₹{selectedShipment.total_cost.toFixed(2)}</p>
                </div>
              </div>

              {/* Special Instructions */}
              {selectedShipment.special_instructions && (
                <div>
                  <Label>Special Instructions</Label>
                  <div className="mt-2 p-3 bg-yellow-50 rounded border border-yellow-200">
                    <p>{selectedShipment.special_instructions}</p>
                  </div>
                </div>
              )}

              {/* Tracking History */}
              <div>
                <h3 className="font-semibold mb-3">Tracking History</h3>
                <div className="space-y-3">
                  {selectedShipment.shipping_tracking?.map((track, index) => (
                    <div key={track.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                      <div className="flex-shrink-0">
                        {getStatusIcon(track.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium capitalize">{track.status.replace('_', ' ')}</p>
                          <p className="text-sm text-gray-500">{new Date(track.timestamp).toLocaleString()}</p>
                        </div>
                        {track.location && (
                          <p className="text-sm text-gray-600">📍 {track.location}</p>
                        )}
                        {track.description && (
                          <p className="text-sm text-gray-600">{track.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                {selectedShipment.tracking_number && (
                  <Button 
                    variant="outline"
                    onClick={() => window.open(`https://www.google.com/search?q=${selectedShipment.tracking_number}+tracking`, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Track Online
                  </Button>
                )}
              </div>
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}