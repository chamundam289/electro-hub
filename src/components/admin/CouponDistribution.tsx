import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, 
  Users, 
  Gift, 
  Mail, 
  MessageSquare,
  UserCheck,
  Search,
  Filter,
  Calendar,
  Target,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { notificationService } from '@/services/notificationService';

interface User {
  id: string;
  email: string;
  phone?: string;
  full_name?: string;
  created_at: string;
  last_order_date?: string;
  total_orders?: number;
  total_spent?: number;
}

interface Coupon {
  id: string;
  coupon_code: string;
  coupon_title: string;
  description: string;
  discount_type: 'flat' | 'percentage';
  discount_value: number;
  min_order_value: number;
  is_active: boolean;
  end_date?: string;
}

interface DistributionData {
  coupon_id: string;
  user_selection: 'all' | 'specific' | 'filtered';
  selected_users: string[];
  filter_criteria: {
    min_orders?: number;
    min_spent?: number;
    inactive_days?: number;
    registration_days?: number;
  };
  assignment_reason: string;
  send_notification: boolean;
  notification_method: 'email' | 'sms' | 'both';
  custom_message: string;
  expires_in_days?: number;
}

const CouponDistribution = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDistributeDialog, setShowDistributeDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('users');

  const [distributionData, setDistributionData] = useState<DistributionData>({
    coupon_id: '',
    user_selection: 'specific',
    selected_users: [],
    filter_criteria: {},
    assignment_reason: '',
    send_notification: true,
    notification_method: 'email',
    custom_message: '',
    expires_in_days: 30
  });

  useEffect(() => {
    fetchUsers();
    fetchCoupons();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get users from user_profiles table
      const { data: usersData, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          user_id,
          email,
          phone,
          full_name,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get order statistics for each user
      const usersWithStats = await Promise.all(
        (usersData || []).map(async (user) => {
          const { data: orderStats } = await supabase
            .from('orders')
            .select('created_at, total_amount')
            .eq('customer_email', user.email);

          const totalOrders = orderStats?.length || 0;
          const totalSpent = orderStats?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
          const lastOrderDate = orderStats?.length > 0 
            ? orderStats.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
            : null;

          return {
            id: user.user_id, // Use user_id for consistency
            email: user.email,
            phone: user.phone,
            full_name: user.full_name,
            created_at: user.created_at,
            total_orders: totalOrders,
            total_spent: totalSpent,
            last_order_date: lastOrderDate
          };
        })
      );

      setUsers(usersWithStats);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to load coupons');
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.phone?.includes(searchTerm)
    );
  });

  const getFilteredUsers = () => {
    const { filter_criteria } = distributionData;
    
    return users.filter(user => {
      // Minimum orders filter
      if (filter_criteria.min_orders && (user.total_orders || 0) < filter_criteria.min_orders) {
        return false;
      }
      
      // Minimum spent filter
      if (filter_criteria.min_spent && (user.total_spent || 0) < filter_criteria.min_spent) {
        return false;
      }
      
      // Inactive days filter
      if (filter_criteria.inactive_days) {
        const daysSinceLastOrder = user.last_order_date 
          ? Math.floor((Date.now() - new Date(user.last_order_date).getTime()) / (1000 * 60 * 60 * 24))
          : Infinity;
        if (daysSinceLastOrder < filter_criteria.inactive_days) {
          return false;
        }
      }
      
      // Registration days filter
      if (filter_criteria.registration_days) {
        const daysSinceRegistration = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceRegistration < filter_criteria.registration_days) {
          return false;
        }
      }
      
      return true;
    });
  };

  const handleUserSelection = (userId: string, selected: boolean) => {
    if (selected) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleDistributeCoupons = async () => {
    if (!distributionData.coupon_id) {
      toast.error('Please select a coupon');
      return;
    }

    let targetUsers: string[] = [];
    
    switch (distributionData.user_selection) {
      case 'all':
        targetUsers = users.map(u => u.id);
        break;
      case 'specific':
        targetUsers = selectedUsers;
        break;
      case 'filtered':
        targetUsers = getFilteredUsers().map(u => u.id);
        break;
    }

    if (targetUsers.length === 0) {
      toast.error('No users selected for coupon distribution');
      return;
    }

    try {
      setLoading(true);
      
      // Calculate expiry date
      const expiresAt = distributionData.expires_in_days 
        ? new Date(Date.now() + distributionData.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
        : null;

      // Distribute coupons to selected users
      const userCoupons = targetUsers.map(userId => ({
        user_id: userId,
        coupon_id: distributionData.coupon_id,
        assignment_reason: distributionData.assignment_reason || 'Admin distribution',
        expires_at: expiresAt,
        assigned_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('user_coupons')
        .insert(userCoupons);

      if (insertError) throw insertError;

      // Send notifications if requested
      if (distributionData.send_notification) {
        await sendNotifications(targetUsers);
      }

      toast.success(`Coupons distributed to ${targetUsers.length} users successfully!`);
      setShowDistributeDialog(false);
      resetDistributionData();
      
    } catch (error) {
      console.error('Error distributing coupons:', error);
      toast.error('Failed to distribute coupons');
    } finally {
      setLoading(false);
    }
  };

  const sendNotifications = async (userIds: string[]) => {
    try {
      const selectedCoupon = coupons.find(c => c.id === distributionData.coupon_id);
      if (!selectedCoupon) return;

      // Get user details for notifications
      const { data: usersData } = await supabase
        .from('user_profiles')
        .select('user_id, email, phone, full_name')
        .in('user_id', userIds);

      if (!usersData || usersData.length === 0) return;

      // Prepare coupon data for notification
      const couponNotificationData = {
        couponCode: selectedCoupon.coupon_code,
        couponTitle: selectedCoupon.coupon_title,
        discountValue: selectedCoupon.discount_value,
        discountType: selectedCoupon.discount_type,
        minOrderValue: selectedCoupon.min_order_value,
        expiryDate: selectedCoupon.end_date,
        customMessage: distributionData.custom_message
      };

      // Prepare recipients
      const recipients = usersData.map(user => ({
        email: user.email,
        phone: user.phone,
        name: user.full_name
      }));

      // Send bulk notifications
      const result = await notificationService.sendBulkCouponNotifications(
        recipients,
        distributionData.notification_method,
        couponNotificationData
      );

      console.log('Notification results:', result);
      toast.success(`Notifications sent: ${result.success} successful, ${result.failed} failed`);
      
    } catch (error) {
      console.error('Error sending notifications:', error);
      toast.error('Failed to send some notifications');
    }
  };

  const resetDistributionData = () => {
    setDistributionData({
      coupon_id: '',
      user_selection: 'specific',
      selected_users: [],
      filter_criteria: {},
      assignment_reason: '',
      send_notification: true,
      notification_method: 'email',
      custom_message: '',
      expires_in_days: 30
    });
    setSelectedUsers([]);
  };

  const getUserStats = (user: User) => {
    const daysSinceRegistration = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceLastOrder = user.last_order_date 
      ? Math.floor((Date.now() - new Date(user.last_order_date).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return { daysSinceRegistration, daysSinceLastOrder };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🎁 Coupon Distribution</h2>
          <p className="text-muted-foreground">Send coupons to customers via email, SMS, or notifications</p>
        </div>
        <Dialog open={showDistributeDialog} onOpenChange={setShowDistributeDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowDistributeDialog(true)}>
              <Send className="h-4 w-4 mr-2" />
              Distribute Coupons
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Distribute Coupons to Customers</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="coupon" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="coupon">Select Coupon</TabsTrigger>
                <TabsTrigger value="users">Select Users</TabsTrigger>
                <TabsTrigger value="notification">Notification</TabsTrigger>
                <TabsTrigger value="review">Review & Send</TabsTrigger>
              </TabsList>

              <TabsContent value="coupon" className="space-y-4">
                <div>
                  <Label htmlFor="coupon_select">Select Coupon to Distribute</Label>
                  <Select 
                    value={distributionData.coupon_id} 
                    onValueChange={(value) => setDistributionData(prev => ({ ...prev, coupon_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a coupon" />
                    </SelectTrigger>
                    <SelectContent>
                      {coupons.map((coupon) => (
                        <SelectItem key={coupon.id} value={coupon.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{coupon.coupon_code}</span>
                            <span>-</span>
                            <span>{coupon.discount_type === 'flat' ? `₹${coupon.discount_value}` : `${coupon.discount_value}%`} OFF</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assignment_reason">Assignment Reason</Label>
                  <Input
                    id="assignment_reason"
                    value={distributionData.assignment_reason}
                    onChange={(e) => setDistributionData(prev => ({ ...prev, assignment_reason: e.target.value }))}
                    placeholder="e.g., Welcome bonus, Loyalty reward, Complaint resolution"
                  />
                </div>

                <div>
                  <Label htmlFor="expires_in_days">Expires in Days (Optional)</Label>
                  <Input
                    id="expires_in_days"
                    type="number"
                    value={distributionData.expires_in_days || ''}
                    onChange={(e) => setDistributionData(prev => ({ ...prev, expires_in_days: e.target.value ? Number(e.target.value) : undefined }))}
                    placeholder="30"
                  />
                </div>
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                <div>
                  <Label>User Selection Method</Label>
                  <Select 
                    value={distributionData.user_selection} 
                    onValueChange={(value: 'all' | 'specific' | 'filtered') => 
                      setDistributionData(prev => ({ ...prev, user_selection: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="specific">Specific Users</SelectItem>
                      <SelectItem value="filtered">Filtered Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {distributionData.user_selection === 'filtered' && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium">Filter Criteria</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Minimum Orders</Label>
                        <Input
                          type="number"
                          value={distributionData.filter_criteria.min_orders || ''}
                          onChange={(e) => setDistributionData(prev => ({
                            ...prev,
                            filter_criteria: { ...prev.filter_criteria, min_orders: e.target.value ? Number(e.target.value) : undefined }
                          }))}
                          placeholder="e.g., 5"
                        />
                      </div>
                      <div>
                        <Label>Minimum Spent (₹)</Label>
                        <Input
                          type="number"
                          value={distributionData.filter_criteria.min_spent || ''}
                          onChange={(e) => setDistributionData(prev => ({
                            ...prev,
                            filter_criteria: { ...prev.filter_criteria, min_spent: e.target.value ? Number(e.target.value) : undefined }
                          }))}
                          placeholder="e.g., 10000"
                        />
                      </div>
                      <div>
                        <Label>Inactive for Days</Label>
                        <Input
                          type="number"
                          value={distributionData.filter_criteria.inactive_days || ''}
                          onChange={(e) => setDistributionData(prev => ({
                            ...prev,
                            filter_criteria: { ...prev.filter_criteria, inactive_days: e.target.value ? Number(e.target.value) : undefined }
                          }))}
                          placeholder="e.g., 30"
                        />
                      </div>
                      <div>
                        <Label>Registered Since Days</Label>
                        <Input
                          type="number"
                          value={distributionData.filter_criteria.registration_days || ''}
                          onChange={(e) => setDistributionData(prev => ({
                            ...prev,
                            filter_criteria: { ...prev.filter_criteria, registration_days: e.target.value ? Number(e.target.value) : undefined }
                          }))}
                          placeholder="e.g., 7"
                        />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Filtered users: {getFilteredUsers().length}
                    </div>
                  </div>
                )}

                {distributionData.user_selection === 'specific' && (
                  <div className="space-y-4">
                    <div>
                      <Label>Search Users</Label>
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by email, name, or phone..."
                        className="mb-4"
                      />
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto border rounded-lg">
                      {filteredUsers.map((user) => {
                        const { daysSinceRegistration, daysSinceLastOrder } = getUserStats(user);
                        const isSelected = selectedUsers.includes(user.id);
                        
                        return (
                          <div key={user.id} className="flex items-center space-x-3 p-3 border-b hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleUserSelection(user.id, e.target.checked)}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{user.full_name || user.email}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {user.total_orders || 0} orders
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  ₹{user.total_spent || 0} spent
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {daysSinceRegistration}d old
                                </Badge>
                                {daysSinceLastOrder && (
                                  <Badge variant="outline" className="text-xs">
                                    {daysSinceLastOrder}d inactive
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Selected: {selectedUsers.length} users
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notification" className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="send_notification"
                    checked={distributionData.send_notification}
                    onChange={(e) => setDistributionData(prev => ({ ...prev, send_notification: e.target.checked }))}
                  />
                  <Label htmlFor="send_notification">Send notification to users</Label>
                </div>

                {distributionData.send_notification && (
                  <div className="space-y-4">
                    <div>
                      <Label>Notification Method</Label>
                      <Select 
                        value={distributionData.notification_method} 
                        onValueChange={(value: 'email' | 'sms' | 'both') => 
                          setDistributionData(prev => ({ ...prev, notification_method: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email Only</SelectItem>
                          <SelectItem value="sms">SMS Only</SelectItem>
                          <SelectItem value="both">Email + SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="custom_message">Custom Message (Optional)</Label>
                      <Textarea
                        id="custom_message"
                        value={distributionData.custom_message}
                        onChange={(e) => setDistributionData(prev => ({ ...prev, custom_message: e.target.value }))}
                        placeholder="Add a personal message to your customers..."
                        rows={4}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="review" className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Distribution Summary</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-800">Selected Coupon</div>
                      <div className="text-sm text-blue-600">
                        {coupons.find(c => c.id === distributionData.coupon_id)?.coupon_code || 'None selected'}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="font-medium text-green-800">Target Users</div>
                      <div className="text-sm text-green-600">
                        {distributionData.user_selection === 'all' ? users.length :
                         distributionData.user_selection === 'specific' ? selectedUsers.length :
                         getFilteredUsers().length} users
                      </div>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="font-medium text-purple-800">Notification</div>
                      <div className="text-sm text-purple-600">
                        {distributionData.send_notification ? distributionData.notification_method : 'No notification'}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="font-medium text-orange-800">Expiry</div>
                      <div className="text-sm text-orange-600">
                        {distributionData.expires_in_days ? `${distributionData.expires_in_days} days` : 'No expiry'}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowDistributeDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleDistributeCoupons} disabled={loading}>
                      {loading ? 'Distributing...' : 'Distribute Coupons'}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Coupons</p>
                <p className="text-2xl font-bold">{coupons.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Selected Users</p>
                <p className="text-2xl font-bold">{selectedUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Ready to Send</p>
                <p className="text-2xl font-bold">{distributionData.coupon_id && selectedUsers.length > 0 ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer List ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              {filteredUsers.map((user) => {
                const { daysSinceRegistration, daysSinceLastOrder } = getUserStats(user);
                const isSelected = selectedUsers.includes(user.id);
                
                return (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleUserSelection(user.id, e.target.checked)}
                      />
                      <div>
                        <div className="font-medium">{user.full_name || user.email}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        {user.phone && (
                          <div className="text-sm text-muted-foreground">{user.phone}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {user.total_orders || 0} orders
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        ₹{user.total_spent || 0}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {daysSinceRegistration}d old
                      </Badge>
                      {daysSinceLastOrder !== null && (
                        <Badge 
                          variant={daysSinceLastOrder > 30 ? "destructive" : "outline"} 
                          className="text-xs"
                        >
                          {daysSinceLastOrder}d inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CouponDistribution;