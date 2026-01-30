import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  Users, 
  Gift, 
  Percent, 
  Calendar,
  TrendingUp,
  DollarSign,
  Target,
  Share2,
  Coins,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Coupon {
  id: string;
  coupon_code: string;
  coupon_title: string;
  description: string;
  discount_type: 'flat' | 'percentage';
  discount_value: number;
  max_discount_amount?: number;
  min_order_value: number;
  applicable_on: 'all' | 'products' | 'categories';
  is_user_specific: boolean;
  target_user_ids?: string[];
  is_affiliate_specific: boolean;
  affiliate_id?: string;
  coins_integration_type: 'none' | 'earn_extra' | 'purchasable' | 'required';
  bonus_coins_earned: number;
  coins_required_to_unlock: number;
  min_coins_required: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  total_usage_limit?: number;
  per_user_usage_limit: number;
  daily_usage_limit?: number;
  allow_stacking_with_coupons: boolean;
  allow_stacking_with_coins: boolean;
  total_usage_count: number;
  total_discount_given: number;
  total_revenue_generated: number;
  created_at: string;
}

interface CouponFormData {
  coupon_code: string;
  coupon_title: string;
  description: string;
  discount_type: 'flat' | 'percentage';
  discount_value: string;
  max_discount_amount: string;
  min_order_value: string;
  applicable_on: 'all' | 'products' | 'categories';
  is_user_specific: boolean;
  is_affiliate_specific: boolean;
  affiliate_id: string;
  coins_integration_type: 'none' | 'earn_extra' | 'purchasable' | 'required';
  bonus_coins_earned: string;
  coins_required_to_unlock: string;
  min_coins_required: string;
  start_date: string;
  end_date: string;
  total_usage_limit: string;
  per_user_usage_limit: string;
  daily_usage_limit: string;
  allow_stacking_with_coupons: boolean;
  allow_stacking_with_coins: boolean;
}

const CouponManagement = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [activeTab, setActiveTab] = useState('list');

  const [formData, setFormData] = useState<CouponFormData>({
    coupon_code: '',
    coupon_title: '',
    description: '',
    discount_type: 'flat',
    discount_value: '',
    max_discount_amount: '',
    min_order_value: '0',
    applicable_on: 'all',
    is_user_specific: false,
    is_affiliate_specific: false,
    affiliate_id: '',
    coins_integration_type: 'none',
    bonus_coins_earned: '0',
    coins_required_to_unlock: '0',
    min_coins_required: '0',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    total_usage_limit: '',
    per_user_usage_limit: '1',
    daily_usage_limit: '',
    allow_stacking_with_coupons: false,
    allow_stacking_with_coins: true
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const generateCouponCode = () => {
    const prefix = 'SAVE';
    const randomNum = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    setFormData(prev => ({ ...prev, coupon_code: `${prefix}${randomNum}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const couponData = {
        coupon_code: formData.coupon_code.toUpperCase(),
        coupon_title: formData.coupon_title,
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        min_order_value: parseFloat(formData.min_order_value),
        applicable_on: formData.applicable_on,
        is_user_specific: formData.is_user_specific,
        is_affiliate_specific: formData.is_affiliate_specific,
        affiliate_id: formData.affiliate_id || null,
        coins_integration_type: formData.coins_integration_type,
        bonus_coins_earned: parseInt(formData.bonus_coins_earned),
        coins_required_to_unlock: parseInt(formData.coins_required_to_unlock),
        min_coins_required: parseInt(formData.min_coins_required),
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        total_usage_limit: formData.total_usage_limit ? parseInt(formData.total_usage_limit) : null,
        per_user_usage_limit: parseInt(formData.per_user_usage_limit),
        daily_usage_limit: formData.daily_usage_limit ? parseInt(formData.daily_usage_limit) : null,
        allow_stacking_with_coupons: formData.allow_stacking_with_coupons,
        allow_stacking_with_coins: formData.allow_stacking_with_coins,
        is_active: true
      };

      let result;
      if (editingCoupon) {
        result = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);
      } else {
        result = await supabase
          .from('coupons')
          .insert([couponData]);
      }

      if (result.error) throw result.error;

      toast.success(editingCoupon ? 'Coupon updated successfully!' : 'Coupon created successfully!');
      setShowCreateDialog(false);
      setEditingCoupon(null);
      resetForm();
      fetchCoupons();
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast.error('Failed to save coupon');
    }
  };

  const resetForm = () => {
    setFormData({
      coupon_code: '',
      coupon_title: '',
      description: '',
      discount_type: 'flat',
      discount_value: '',
      max_discount_amount: '',
      min_order_value: '0',
      applicable_on: 'all',
      is_user_specific: false,
      is_affiliate_specific: false,
      affiliate_id: '',
      coins_integration_type: 'none',
      bonus_coins_earned: '0',
      coins_required_to_unlock: '0',
      min_coins_required: '0',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      total_usage_limit: '',
      per_user_usage_limit: '1',
      daily_usage_limit: '',
      allow_stacking_with_coupons: false,
      allow_stacking_with_coins: true
    });
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      coupon_code: coupon.coupon_code,
      coupon_title: coupon.coupon_title,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      max_discount_amount: coupon.max_discount_amount?.toString() || '',
      min_order_value: coupon.min_order_value.toString(),
      applicable_on: coupon.applicable_on,
      is_user_specific: coupon.is_user_specific,
      is_affiliate_specific: coupon.is_affiliate_specific,
      affiliate_id: coupon.affiliate_id || '',
      coins_integration_type: coupon.coins_integration_type,
      bonus_coins_earned: coupon.bonus_coins_earned.toString(),
      coins_required_to_unlock: coupon.coins_required_to_unlock.toString(),
      min_coins_required: coupon.min_coins_required.toString(),
      start_date: coupon.start_date.split('T')[0],
      end_date: coupon.end_date?.split('T')[0] || '',
      total_usage_limit: coupon.total_usage_limit?.toString() || '',
      per_user_usage_limit: coupon.per_user_usage_limit.toString(),
      daily_usage_limit: coupon.daily_usage_limit?.toString() || '',
      allow_stacking_with_coupons: coupon.allow_stacking_with_coupons,
      allow_stacking_with_coins: coupon.allow_stacking_with_coins
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId);

      if (error) throw error;

      toast.success('Coupon deleted successfully!');
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
    }
  };

  const toggleCouponStatus = async (couponId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !currentStatus })
        .eq('id', couponId);

      if (error) throw error;

      toast.success(`Coupon ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchCoupons();
    } catch (error) {
      console.error('Error updating coupon status:', error);
      toast.error('Failed to update coupon status');
    }
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Coupon code copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🎉 Coupon Management</h2>
          <p className="text-muted-foreground">Create and manage promotional coupons</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingCoupon(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Details</TabsTrigger>
                  <TabsTrigger value="targeting">Targeting</TabsTrigger>
                  <TabsTrigger value="loyalty">Loyalty Integration</TabsTrigger>
                  <TabsTrigger value="limits">Usage Limits</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="coupon_code">Coupon Code *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="coupon_code"
                          value={formData.coupon_code}
                          onChange={(e) => setFormData(prev => ({ ...prev, coupon_code: e.target.value.toUpperCase() }))}
                          placeholder="SAVE50"
                          required
                        />
                        <Button type="button" variant="outline" onClick={generateCouponCode}>
                          Generate
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="coupon_title">Coupon Title *</Label>
                      <Input
                        id="coupon_title"
                        value={formData.coupon_title}
                        onChange={(e) => setFormData(prev => ({ ...prev, coupon_title: e.target.value }))}
                        placeholder="Welcome Discount"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Get amazing discount on your order"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="discount_type">Discount Type *</Label>
                      <Select value={formData.discount_type} onValueChange={(value: 'flat' | 'percentage') => 
                        setFormData(prev => ({ ...prev, discount_type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="discount_value">
                        Discount Value * {formData.discount_type === 'flat' ? '(₹)' : '(%)'}
                      </Label>
                      <Input
                        id="discount_value"
                        type="number"
                        value={formData.discount_value}
                        onChange={(e) => setFormData(prev => ({ ...prev, discount_value: e.target.value }))}
                        placeholder={formData.discount_type === 'flat' ? '100' : '20'}
                        required
                      />
                    </div>
                    {formData.discount_type === 'percentage' && (
                      <div>
                        <Label htmlFor="max_discount_amount">Max Discount (₹)</Label>
                        <Input
                          id="max_discount_amount"
                          type="number"
                          value={formData.max_discount_amount}
                          onChange={(e) => setFormData(prev => ({ ...prev, max_discount_amount: e.target.value }))}
                          placeholder="500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min_order_value">Minimum Order Value (₹)</Label>
                      <Input
                        id="min_order_value"
                        type="number"
                        value={formData.min_order_value}
                        onChange={(e) => setFormData(prev => ({ ...prev, min_order_value: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="applicable_on">Applicable On</Label>
                      <Select value={formData.applicable_on} onValueChange={(value: 'all' | 'products' | 'categories') => 
                        setFormData(prev => ({ ...prev, applicable_on: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Products</SelectItem>
                          <SelectItem value="products">Selected Products</SelectItem>
                          <SelectItem value="categories">Selected Categories</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Start Date *</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">End Date (Optional)</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="targeting" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_user_specific"
                        checked={formData.is_user_specific}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_user_specific: checked }))}
                      />
                      <Label htmlFor="is_user_specific">User-Specific Coupon</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_affiliate_specific"
                        checked={formData.is_affiliate_specific}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_affiliate_specific: checked }))}
                      />
                      <Label htmlFor="is_affiliate_specific">Affiliate-Specific Coupon</Label>
                    </div>

                    {formData.is_affiliate_specific && (
                      <div>
                        <Label htmlFor="affiliate_id">Affiliate ID</Label>
                        <Input
                          id="affiliate_id"
                          value={formData.affiliate_id}
                          onChange={(e) => setFormData(prev => ({ ...prev, affiliate_id: e.target.value }))}
                          placeholder="Enter affiliate ID"
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="loyalty" className="space-y-4">
                  <div>
                    <Label htmlFor="coins_integration_type">Loyalty Coins Integration</Label>
                    <Select value={formData.coins_integration_type} onValueChange={(value: any) => 
                      setFormData(prev => ({ ...prev, coins_integration_type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Integration</SelectItem>
                        <SelectItem value="earn_extra">Earn Extra Coins</SelectItem>
                        <SelectItem value="purchasable">Purchasable with Coins</SelectItem>
                        <SelectItem value="required">Coins Required</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.coins_integration_type === 'earn_extra' && (
                    <div>
                      <Label htmlFor="bonus_coins_earned">Bonus Coins Earned</Label>
                      <Input
                        id="bonus_coins_earned"
                        type="number"
                        value={formData.bonus_coins_earned}
                        onChange={(e) => setFormData(prev => ({ ...prev, bonus_coins_earned: e.target.value }))}
                        placeholder="50"
                      />
                    </div>
                  )}

                  {formData.coins_integration_type === 'purchasable' && (
                    <div>
                      <Label htmlFor="coins_required_to_unlock">Coins Required to Unlock</Label>
                      <Input
                        id="coins_required_to_unlock"
                        type="number"
                        value={formData.coins_required_to_unlock}
                        onChange={(e) => setFormData(prev => ({ ...prev, coins_required_to_unlock: e.target.value }))}
                        placeholder="100"
                      />
                    </div>
                  )}

                  {formData.coins_integration_type === 'required' && (
                    <div>
                      <Label htmlFor="min_coins_required">Minimum Coins Required</Label>
                      <Input
                        id="min_coins_required"
                        type="number"
                        value={formData.min_coins_required}
                        onChange={(e) => setFormData(prev => ({ ...prev, min_coins_required: e.target.value }))}
                        placeholder="200"
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="limits" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="total_usage_limit">Total Usage Limit</Label>
                      <Input
                        id="total_usage_limit"
                        type="number"
                        value={formData.total_usage_limit}
                        onChange={(e) => setFormData(prev => ({ ...prev, total_usage_limit: e.target.value }))}
                        placeholder="1000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="per_user_usage_limit">Per User Limit *</Label>
                      <Input
                        id="per_user_usage_limit"
                        type="number"
                        value={formData.per_user_usage_limit}
                        onChange={(e) => setFormData(prev => ({ ...prev, per_user_usage_limit: e.target.value }))}
                        placeholder="1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="daily_usage_limit">Daily Usage Limit</Label>
                      <Input
                        id="daily_usage_limit"
                        type="number"
                        value={formData.daily_usage_limit}
                        onChange={(e) => setFormData(prev => ({ ...prev, daily_usage_limit: e.target.value }))}
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Stacking Rules</h4>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allow_stacking_with_coupons"
                        checked={formData.allow_stacking_with_coupons}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allow_stacking_with_coupons: checked }))}
                      />
                      <Label htmlFor="allow_stacking_with_coupons">Allow stacking with other coupons</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allow_stacking_with_coins"
                        checked={formData.allow_stacking_with_coins}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allow_stacking_with_coins: checked }))}
                      />
                      <Label htmlFor="allow_stacking_with_coins">Allow stacking with loyalty coins</Label>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Coupons</p>
                <p className="text-2xl font-bold">{coupons.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Coupons</p>
                <p className="text-2xl font-bold">{coupons.filter(c => c.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Discount Given</p>
                <p className="text-2xl font-bold">
                  ₹{coupons.reduce((sum, c) => sum + c.total_discount_given, 0).toFixed(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold">{coupons.reduce((sum, c) => sum + c.total_usage_count, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coupons List */}
      <Card>
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No coupons found</h3>
              <p className="text-muted-foreground mb-4">Create your first coupon to get started</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Coupon
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{coupon.coupon_title}</h3>
                        <Badge 
                          variant={coupon.is_active ? "default" : "secondary"}
                          className={coupon.is_active ? "bg-green-100 text-green-800" : ""}
                        >
                          {coupon.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {coupon.is_user_specific && (
                          <Badge variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            User Specific
                          </Badge>
                        )}
                        {coupon.is_affiliate_specific && (
                          <Badge variant="outline">
                            <Share2 className="h-3 w-3 mr-1" />
                            Affiliate
                          </Badge>
                        )}
                        {coupon.coins_integration_type !== 'none' && (
                          <Badge variant="outline">
                            <Coins className="h-3 w-3 mr-1" />
                            Coins
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {coupon.coupon_code}
                        </span>
                        <span>
                          {coupon.discount_type === 'flat' 
                            ? `₹${coupon.discount_value} OFF` 
                            : `${coupon.discount_value}% OFF`
                          }
                        </span>
                        <span>Min: ₹{coupon.min_order_value}</span>
                        <span>Used: {coupon.total_usage_count} times</span>
                        <span>Revenue: ₹{coupon.total_revenue_generated.toFixed(0)}</span>
                      </div>
                      
                      {coupon.description && (
                        <p className="text-sm text-muted-foreground">{coupon.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyCouponCode(coupon.coupon_code)}
                        title="Copy coupon code"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(coupon)}
                        title="Edit coupon"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleCouponStatus(coupon.id, coupon.is_active)}
                        title={coupon.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(coupon.id)}
                        title="Delete coupon"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CouponManagement;