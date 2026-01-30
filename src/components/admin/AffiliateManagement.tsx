import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataPagination } from '@/components/ui/data-pagination';
import { usePagination } from '@/hooks/usePagination';
import { useAffiliate, AffiliateUser } from '@/hooks/useAffiliate';
import { useProductAffiliate } from '@/hooks/useProductAffiliate';
import ClickAnalytics from '@/components/analytics/ClickAnalytics';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  ToggleLeft, 
  ToggleRight,
  Users,
  TrendingUp,
  DollarSign,
  MousePointer,
  ShoppingCart,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

export default function AffiliateManagement() {
  const {
    affiliates,
    clicks,
    orders,
    commissions,
    payouts,
    loading,
    fetchAffiliates,
    createAffiliate,
    updateAffiliate,
    deleteAffiliate,
    fetchAffiliateClicks,
    fetchAffiliateOrders,
    fetchAffiliateCommissions,
    fetchAffiliatePayouts,
    confirmAffiliateCommission,
    processPayout
  } = useAffiliate();

  const { getProductAffiliateStats } = useProductAffiliate();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [productStats, setProductStats] = useState<any[]>([]);

  // Form state for creating/editing affiliates
  const [formData, setFormData] = useState({
    name: '',
    mobile_number: '',
    password: '',
    affiliate_code: '',
    is_active: true
  });

  const filteredAffiliates = affiliates.filter(affiliate => {
    const matchesSearch = 
      affiliate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affiliate.mobile_number.includes(searchTerm) ||
      affiliate.affiliate_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && affiliate.is_active) ||
      (statusFilter === 'inactive' && !affiliate.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const pagination = usePagination({
    totalItems: filteredAffiliates.length,
    itemsPerPage: 20,
  });

  const paginatedAffiliates = filteredAffiliates.slice(
    pagination.startIndex,
    pagination.endIndex
  );

  useEffect(() => {
    fetchAffiliates();
    fetchAffiliateClicks();
    fetchAffiliateOrders();
    fetchAffiliateCommissions();
    fetchAffiliatePayouts();
    loadProductStats();
  }, []);

  const loadProductStats = async () => {
    try {
      const stats = await getProductAffiliateStats();
      setProductStats(stats);
    } catch (error) {
      console.error('Error loading product stats:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      mobile_number: '',
      password: '',
      affiliate_code: '',
      is_active: true
    });
  };

  const handleCreateAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createAffiliate(formData);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleToggleStatus = async (affiliate: AffiliateUser) => {
    try {
      await updateAffiliate(affiliate.id, { is_active: !affiliate.is_active });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDeleteAffiliate = async (affiliate: AffiliateUser) => {
    if (!confirm(`Are you sure you want to delete affiliate ${affiliate.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteAffiliate(affiliate.id);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleViewAffiliate = (affiliate: AffiliateUser) => {
    setSelectedAffiliate(affiliate);
    setIsViewDialogOpen(true);
  };

  const handleConfirmCommission = async (commissionId: string) => {
    try {
      await confirmAffiliateCommission(commissionId);
      toast.success('Commission confirmed successfully');
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleProcessPayout = async (payoutId: string, status: string) => {
    const transactionId = status === 'completed' ? `TXN${Date.now()}` : undefined;
    const notes = status === 'failed' ? 'Payment failed - please retry' : undefined;

    try {
      await processPayout(payoutId, status, transactionId, notes);
      toast.success(`Payout ${status} successfully`);
    } catch (error) {
      // Error handled in hook
    }
  };

  // Calculate overall stats
  const totalAffiliates = affiliates.length;
  const activeAffiliates = affiliates.filter(a => a.is_active).length;
  const totalClicks = clicks.length;
  const totalOrders = orders.filter(o => o.status === 'confirmed').length;
  const totalCommissions = commissions
    .filter(c => c.status === 'confirmed' && c.transaction_type === 'earned')
    .reduce((sum, c) => sum + c.amount, 0);
  const pendingCommissions = commissions
    .filter(c => c.status === 'pending' && c.transaction_type === 'earned')
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Affiliate Management</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Affiliate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0 pb-4 border-b">
              <DialogTitle>Add New Affiliate</DialogTitle>
              <DialogDescription>
                Create a new affiliate marketer account with login credentials.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto dialog-scroll-container px-1">
              <form onSubmit={handleCreateAffiliate} className="affiliate-form space-y-6 py-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter affiliate name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="mobile_number">Mobile Number *</Label>
                  <Input
                    id="mobile_number"
                    type="tel"
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Login password"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="affiliate_code">Affiliate Code (Optional)</Label>
                  <Input
                    id="affiliate_code"
                    value={formData.affiliate_code}
                    onChange={(e) => setFormData({ ...formData, affiliate_code: e.target.value.toUpperCase() })}
                    placeholder="Leave empty for auto-generation"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If empty, a unique code will be generated automatically
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Affiliate'}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAffiliates}</div>
            <p className="text-xs text-muted-foreground">
              {activeAffiliates} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks}</div>
            <p className="text-xs text-muted-foreground">
              All affiliate clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Confirmed orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalCommissions.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Confirmed commissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Commissions</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">₹{pendingCommissions.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalClicks > 0 ? ((totalOrders / totalClicks) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Click to order ratio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="affiliates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="analytics">Click Analytics</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="products">Product Stats</TabsTrigger>
        </TabsList>

        {/* Affiliates Tab */}
        <TabsContent value="affiliates">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Marketers</CardTitle>
              <CardDescription>
                Manage affiliate accounts and track their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search affiliates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={fetchAffiliates}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {/* Affiliates Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Affiliate</th>
                      <th className="text-left p-3">Code</th>
                      <th className="text-left p-3">Performance</th>
                      <th className="text-left p-3">Earnings</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAffiliates.map((affiliate) => (
                      <tr key={affiliate.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{affiliate.name}</p>
                            <p className="text-sm text-gray-500">{affiliate.mobile_number}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{affiliate.affiliate_code}</Badge>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <p>{affiliate.total_clicks} clicks</p>
                            <p>{affiliate.total_orders} orders</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <p className="font-medium text-green-600">₹{affiliate.total_earnings.toFixed(2)}</p>
                            <p className="text-gray-500">₹{affiliate.pending_commission.toFixed(2)} pending</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(affiliate)}
                          >
                            {affiliate.is_active ? (
                              <ToggleRight className="h-4 w-4 text-green-500" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </td>
                        <td className="p-3">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewAffiliate(affiliate)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteAffiliate(affiliate)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredAffiliates.length > 0 && (
                <div className="mt-6">
                  <DataPagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    totalItems={filteredAffiliates.length}
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
                    itemsPerPageOptions={[10, 20, 50]}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Click Analytics Tab */}
        <TabsContent value="analytics">
          <ClickAnalytics
            data={clicks}
            loading={loading}
            onRefresh={() => {
              fetchAffiliateClicks();
              fetchAffiliateOrders();
            }}
            showAffiliateFilter={true}
            title="Admin Click Analytics"
            description="Comprehensive click tracking and analysis for all affiliates"
          />
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Orders</CardTitle>
              <CardDescription>
                All orders generated through affiliate links
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{order.products?.name}</p>
                      <p className="text-sm text-gray-500">
                        Order: {order.orders?.order_number} • {order.orders?.customer_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Affiliate: {affiliates.find(a => a.id === order.affiliate_id)?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">₹{order.commission_amount.toFixed(2)}</p>
                      <Badge variant={order.status === 'confirmed' ? "default" : "secondary"}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No affiliate orders yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle>Commission Management</CardTitle>
              <CardDescription>
                Review and confirm affiliate commissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commissions.map((commission) => (
                  <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{commission.transaction_type}</p>
                      <p className="text-sm text-gray-500">{commission.description}</p>
                      <p className="text-sm text-gray-500">
                        Affiliate: {affiliates.find(a => a.id === commission.affiliate_id)?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(commission.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right flex items-center space-x-4">
                      <div>
                        <p className={`font-semibold ${
                          commission.transaction_type === 'earned' ? 'text-green-600' : 
                          commission.transaction_type === 'paid' ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {commission.transaction_type === 'reversed' ? '-' : '+'}₹{commission.amount.toFixed(2)}
                        </p>
                        <Badge variant={commission.status === 'confirmed' ? "default" : "secondary"}>
                          {commission.status}
                        </Badge>
                      </div>
                      {commission.status === 'pending' && commission.transaction_type === 'earned' && (
                        <Button
                          size="sm"
                          onClick={() => handleConfirmCommission(commission.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Confirm
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {commissions.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No commissions yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Payout Management</CardTitle>
              <CardDescription>
                Process affiliate payout requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payouts.map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Payout Request</p>
                      <p className="text-sm text-gray-500">
                        Affiliate: {affiliates.find(a => a.id === payout.affiliate_id)?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Method: {payout.payment_method.toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(payout.requested_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right flex items-center space-x-4">
                      <div>
                        <p className="font-semibold text-green-600">₹{payout.amount.toFixed(2)}</p>
                        <Badge variant={payout.status === 'completed' ? "default" : "secondary"}>
                          {payout.status}
                        </Badge>
                      </div>
                      {payout.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleProcessPayout(payout.id, 'completed')}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleProcessPayout(payout.id, 'failed')}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {payouts.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No payout requests yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Stats Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>
                Affiliate performance by product
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productStats.map((stat: any) => (
                  <div key={stat.product_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{stat.product_name}</p>
                      <p className="text-sm text-gray-500">₹{stat.product_price}</p>
                    </div>
                    <div className="text-right">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">{stat.total_orders}</p>
                          <p className="text-gray-500">Total Orders</p>
                        </div>
                        <div>
                          <p className="font-medium text-green-600">₹{stat.total_commission.toFixed(2)}</p>
                          <p className="text-gray-500">Total Commission</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {productStats.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No product stats available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Affiliate Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4 border-b">
            <DialogTitle>Affiliate Details</DialogTitle>
            <DialogDescription>
              Complete affiliate information and performance metrics
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto dialog-scroll-container px-1">
            {selectedAffiliate && (
              <div className="affiliate-details space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <p className="font-medium">{selectedAffiliate.name}</p>
                  </div>
                  <div>
                    <Label>Mobile Number</Label>
                    <p className="font-medium">{selectedAffiliate.mobile_number}</p>
                  </div>
                  <div>
                    <Label>Affiliate Code</Label>
                    <Badge variant="outline">{selectedAffiliate.affiliate_code}</Badge>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge variant={selectedAffiliate.is_active ? "default" : "secondary"}>
                      {selectedAffiliate.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Total Clicks</Label>
                    <p className="text-2xl font-bold">{selectedAffiliate.total_clicks}</p>
                  </div>
                  <div>
                    <Label>Total Orders</Label>
                    <p className="text-2xl font-bold text-green-600">{selectedAffiliate.total_orders}</p>
                  </div>
                  <div>
                    <Label>Total Earnings</Label>
                    <p className="text-2xl font-bold text-green-600">₹{selectedAffiliate.total_earnings.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label>Pending Commission</Label>
                    <p className="text-2xl font-bold text-yellow-600">₹{selectedAffiliate.pending_commission.toFixed(2)}</p>
                  </div>
                </div>

                <div>
                  <Label>Joined Date</Label>
                  <p className="font-medium">{new Date(selectedAffiliate.created_at).toLocaleDateString()}</p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}