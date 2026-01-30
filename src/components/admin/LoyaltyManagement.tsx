import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableShimmer, StatsCardShimmer } from '@/components/ui/Shimmer';
import { supabase } from '@/integrations/supabase/client';

// Type assertion helper for loyalty tables
const loyaltySupabase = supabase as any;
import { 
  Coins, 
  Settings, 
  Users, 
  TrendingUp, 
  Gift, 
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
  Star,
  Sparkles,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface LoyaltyStats {
  totalUsers: number;
  totalCoinsIssued: number;
  totalCoinsRedeemed: number;
  activeUsers: number;
  totalTransactions: number;
}

interface UserWallet {
  id: string;
  user_id: string;
  total_coins_earned: number;
  total_coins_used: number;
  available_coins: number;
  last_updated: string;
  users?: { email: string };
}

interface LoyaltyTransaction {
  id: string;
  user_id: string;
  transaction_type: string;
  coins_amount: number;
  description: string;
  created_at: string;
  users?: { email: string };
}

interface SystemSettings {
  id: string;
  is_system_enabled: boolean;
  global_coins_multiplier: number;
  default_coins_per_rupee: number;
  coin_expiry_days?: number;
  min_coins_to_redeem: number;
  max_coins_per_order?: number;
  festive_multiplier: number;
  festive_start_date?: string;
  festive_end_date?: string;
}

export default function LoyaltyManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<LoyaltyStats | null>(null);
  const [userWallets, setUserWallets] = useState<UserWallet[]>([]);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWallet | null>(null);
  const [manualAdjustment, setManualAdjustment] = useState({
    coins: 0,
    type: 'add' as 'add' | 'remove',
    reason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchUserWallets(),
        fetchTransactions(),
        fetchSystemSettings()
      ]);
    } catch (error) {
      console.error('Error loading loyalty data:', error);
      toast.error('Failed to load loyalty data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Initialize default stats
      let totalUsers = 0;
      let totalCoinsIssued = 0;
      let totalCoinsRedeemed = 0;
      let activeUsers = 0;
      let totalTransactions = 0;

      // Get total users with wallets (safe query)
      try {
        const { count } = await loyaltySupabase
          .from('loyalty_coins_wallet')
          .select('*', { count: 'exact', head: true });
        totalUsers = count || 0;
      } catch (error) {
        console.warn('Could not fetch wallet count:', error);
      }

      // Get total coins issued and redeemed (safe query)
      try {
        const { data: coinsData } = await loyaltySupabase
          .from('loyalty_coins_wallet')
          .select('total_coins_earned, total_coins_used');

        if (coinsData) {
          totalCoinsIssued = coinsData.reduce((sum: number, wallet: any) => sum + (wallet.total_coins_earned || 0), 0);
          totalCoinsRedeemed = coinsData.reduce((sum: number, wallet: any) => sum + (wallet.total_coins_used || 0), 0);
        }
      } catch (error) {
        console.warn('Could not fetch coins data:', error);
      }

      // Get active users (safe query)
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: activeUsersData } = await loyaltySupabase
          .from('loyalty_transactions')
          .select('user_id')
          .gte('created_at', thirtyDaysAgo.toISOString());

        if (activeUsersData) {
          activeUsers = new Set(activeUsersData.map((t: any) => t.user_id)).size;
        }
      } catch (error) {
        console.warn('Could not fetch active users:', error);
      }

      // Get total transactions (safe query)
      try {
        const { count } = await loyaltySupabase
          .from('loyalty_transactions')
          .select('*', { count: 'exact', head: true });
        totalTransactions = count || 0;
      } catch (error) {
        console.warn('Could not fetch transaction count:', error);
      }

      setStats({
        totalUsers,
        totalCoinsIssued,
        totalCoinsRedeemed,
        activeUsers,
        totalTransactions
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default stats on error
      setStats({
        totalUsers: 0,
        totalCoinsIssued: 0,
        totalCoinsRedeemed: 0,
        activeUsers: 0,
        totalTransactions: 0
      });
    }
  };

  const fetchUserWallets = async () => {
    try {
      // Simple approach - just get wallet data without user info for now
      const { data, error } = await loyaltySupabase
        .from('loyalty_coins_wallet')
        .select('*')
        .order('available_coins', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching user wallets:', error);
        setUserWallets([]);
        return;
      }

      // Add basic user info without complex joins
      const walletsWithBasicInfo = (data || []).map((wallet: any) => ({
        ...wallet,
        user_email: `User ${wallet.user_id.slice(0, 8)}`, // Simple user identifier
        user_name: `User ${wallet.user_id.slice(0, 8)}`
      }));

      setUserWallets(walletsWithBasicInfo as UserWallet[]);
    } catch (error) {
      console.error('Error fetching user wallets:', error);
      setUserWallets([]);
    }
  };

  const fetchTransactions = async () => {
    try {
      // Simple approach - just get transaction data without user info for now
      const { data, error } = await loyaltySupabase
        .from('loyalty_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching transactions:', error);
        setTransactions([]);
        return;
      }

      // Add basic user info without complex joins
      const transactionsWithBasicInfo = (data || []).map((transaction: any) => ({
        ...transaction,
        user_email: `User ${transaction.user_id.slice(0, 8)}`, // Simple user identifier
        user_name: `User ${transaction.user_id.slice(0, 8)}`
      }));

      setTransactions(transactionsWithBasicInfo as LoyaltyTransaction[]);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const { data, error } = await loyaltySupabase
        .from('loyalty_system_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        // Handle table not found (406) or no data found (PGRST116)
        if (error.code === 'PGRST116' || error.code === '42P01' || error.message?.includes('relation')) {
          console.warn('Loyalty system settings table not found or empty, creating default settings');
          
          // Create default settings
          const defaultSettings = {
            is_system_enabled: true,
            global_coins_multiplier: 1.00,
            default_coins_per_rupee: 0.10,
            min_coins_to_redeem: 10,
            festive_multiplier: 1.00
          };

          try {
            const { data: newSettings, error: createError } = await loyaltySupabase
              .from('loyalty_system_settings')
              .insert(defaultSettings)
              .select()
              .single();

            if (createError) {
              console.error('Failed to create default settings:', createError);
              setSystemSettings(null);
            } else {
              setSystemSettings(newSettings as SystemSettings);
            }
          } catch (createErr) {
            console.error('Error creating default settings:', createErr);
            setSystemSettings(null);
          }
          return;
        }
        throw error;
      }
      
      setSystemSettings(data as SystemSettings || null);
    } catch (error) {
      console.error('Error fetching system settings:', error);
      setSystemSettings(null);
    }
  };

  const updateSystemSettings = async (settings: Partial<SystemSettings>) => {
    try {
      const { error } = await loyaltySupabase
        .from('loyalty_system_settings')
        .upsert({
          id: systemSettings?.id,
          ...systemSettings,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      await fetchSystemSettings();
      toast.success('System settings updated successfully');
    } catch (error) {
      console.error('Error updating system settings:', error);
      toast.error('Failed to update system settings');
    }
  };

  const handleManualAdjustment = async () => {
    if (!selectedUser || !manualAdjustment.coins || !manualAdjustment.reason) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const coinsAmount = manualAdjustment.type === 'add' ? manualAdjustment.coins : -manualAdjustment.coins;
      
      // Create transaction record
      const { error: transactionError } = await loyaltySupabase
        .from('loyalty_transactions')
        .insert({
          user_id: selectedUser.user_id,
          transaction_type: manualAdjustment.type === 'add' ? 'manual_add' : 'manual_remove',
          coins_amount: coinsAmount,
          description: manualAdjustment.reason,
          admin_notes: `Manual adjustment by admin: ${manualAdjustment.reason}`
        });

      if (transactionError) throw transactionError;

      // Update user wallet
      const newAvailableCoins = selectedUser.available_coins + coinsAmount;
      const { error: walletError } = await loyaltySupabase
        .from('loyalty_coins_wallet')
        .update({
          total_coins_earned: manualAdjustment.type === 'add' 
            ? selectedUser.total_coins_earned + manualAdjustment.coins 
            : selectedUser.total_coins_earned,
          total_coins_used: manualAdjustment.type === 'remove' 
            ? selectedUser.total_coins_used + manualAdjustment.coins 
            : selectedUser.total_coins_used,
          available_coins: Math.max(0, newAvailableCoins),
          last_updated: new Date().toISOString()
        })
        .eq('user_id', selectedUser.user_id);

      if (walletError) throw walletError;

      toast.success(`Successfully ${manualAdjustment.type === 'add' ? 'added' : 'removed'} ${manualAdjustment.coins} coins`);
      setIsDialogOpen(false);
      setSelectedUser(null);
      setManualAdjustment({ coins: 0, type: 'add', reason: '' });
      await loadData();
    } catch (error) {
      console.error('Error processing manual adjustment:', error);
      toast.error('Failed to process manual adjustment');
    }
  };

  const filteredWallets = userWallets.filter(wallet =>
    wallet.users?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(transaction =>
    transaction.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <StatsCardShimmer key={i} />
          ))}
        </div>
        <TableShimmer />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="h-6 w-6 text-yellow-600" />
            Loyalty Management
          </h1>
          <p className="text-muted-foreground">Manage loyalty coins system and user rewards</p>
        </div>
        
        {systemSettings && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">System Status:</span>
            <Badge variant={systemSettings.is_system_enabled ? "default" : "secondary"}>
              {systemSettings.is_system_enabled ? "Active" : "Disabled"}
            </Badge>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Total Users</span>
              </div>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Coins Issued</span>
              </div>
              <div className="text-2xl font-bold">{stats.totalCoinsIssued.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-muted-foreground">Coins Redeemed</span>
              </div>
              <div className="text-2xl font-bold">{stats.totalCoinsRedeemed.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-muted-foreground">Active Users</span>
              </div>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-600" />
                <span className="text-sm text-muted-foreground">Transactions</span>
              </div>
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'users', label: 'User Wallets', icon: Users },
          { id: 'transactions', label: 'Transactions', icon: Calendar },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium text-sm">
                          {transaction.users?.email || 'Unknown User'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {transaction.description}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                        </div>
                      </div>
                      <div className={`font-bold ${transaction.coins_amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.coins_amount > 0 ? '+' : ''}{transaction.coins_amount}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Top Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Top Coin Holders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {userWallets.slice(0, 10).map((wallet, index) => (
                    <div key={wallet.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-xs font-bold text-yellow-700">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {wallet.users?.email || 'Unknown User'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Earned: {wallet.total_coins_earned} | Used: {wallet.total_coins_used}
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-yellow-600">
                        {wallet.available_coins} coins
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Wallets
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {filteredWallets.map((wallet) => (
                  <div key={wallet.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{wallet.users?.email || 'Unknown User'}</div>
                      <div className="text-sm text-muted-foreground">
                        Earned: {wallet.total_coins_earned} | Used: {wallet.total_coins_used}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last updated: {formatDistanceToNow(new Date(wallet.last_updated), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold text-yellow-600">{wallet.available_coins} coins</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(wallet);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {activeTab === 'transactions' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                All Transactions
              </CardTitle>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{transaction.users?.email || 'Unknown User'}</div>
                      <div className="text-sm text-muted-foreground">{transaction.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={transaction.transaction_type === 'earned' ? 'default' : 'secondary'}>
                        {transaction.transaction_type}
                      </Badge>
                      <div className={`font-bold ${transaction.coins_amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.coins_amount > 0 ? '+' : ''}{transaction.coins_amount}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {activeTab === 'settings' && systemSettings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Loyalty System</Label>
                  <p className="text-sm text-muted-foreground">Turn the entire loyalty system on/off</p>
                </div>
                <Switch
                  checked={systemSettings.is_system_enabled}
                  onCheckedChange={(checked) => updateSystemSettings({ is_system_enabled: checked })}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Coins per Rupee</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={systemSettings.default_coins_per_rupee}
                  onChange={(e) => updateSystemSettings({ default_coins_per_rupee: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-sm text-muted-foreground">How many coins users earn per rupee spent</p>
              </div>

              <div className="space-y-2">
                <Label>Global Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={systemSettings.global_coins_multiplier}
                  onChange={(e) => updateSystemSettings({ global_coins_multiplier: parseFloat(e.target.value) || 1 })}
                />
                <p className="text-sm text-muted-foreground">Global multiplier for all coin earnings</p>
              </div>

              <div className="space-y-2">
                <Label>Minimum Coins to Redeem</Label>
                <Input
                  type="number"
                  value={systemSettings.min_coins_to_redeem}
                  onChange={(e) => updateSystemSettings({ min_coins_to_redeem: parseInt(e.target.value) || 0 })}
                />
                <p className="text-sm text-muted-foreground">Minimum coins required for redemption</p>
              </div>

              <div className="space-y-2">
                <Label>Max Coins per Order</Label>
                <Input
                  type="number"
                  value={systemSettings.max_coins_per_order || ''}
                  onChange={(e) => updateSystemSettings({ max_coins_per_order: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="No limit"
                />
                <p className="text-sm text-muted-foreground">Maximum coins that can be earned per order</p>
              </div>
            </CardContent>
          </Card>

          {/* Festive Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Festive Bonus Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Festive Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={systemSettings.festive_multiplier}
                  onChange={(e) => updateSystemSettings({ festive_multiplier: parseFloat(e.target.value) || 1 })}
                />
                <p className="text-sm text-muted-foreground">Additional multiplier during festive period</p>
              </div>

              <div className="space-y-2">
                <Label>Festive Start Date</Label>
                <Input
                  type="datetime-local"
                  value={systemSettings.festive_start_date ? new Date(systemSettings.festive_start_date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => updateSystemSettings({ festive_start_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                />
              </div>

              <div className="space-y-2">
                <Label>Festive End Date</Label>
                <Input
                  type="datetime-local"
                  value={systemSettings.festive_end_date ? new Date(systemSettings.festive_end_date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => updateSystemSettings({ festive_end_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                />
              </div>

              {systemSettings.festive_start_date && systemSettings.festive_end_date && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-medium">Festive Period Active</span>
                  </div>
                  <p className="text-sm text-yellow-600 mt-1">
                    {systemSettings.festive_multiplier}x bonus coins during this period
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Manual Adjustment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual Coin Adjustment</DialogTitle>
            <DialogDescription>
              Manually add or remove coins for {selectedUser?.users?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={manualAdjustment.type} onValueChange={(value: 'add' | 'remove') => setManualAdjustment({ ...manualAdjustment, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Coins</SelectItem>
                  <SelectItem value="remove">Remove Coins</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Number of Coins</Label>
              <Input
                type="number"
                min="1"
                value={manualAdjustment.coins}
                onChange={(e) => setManualAdjustment({ ...manualAdjustment, coins: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={manualAdjustment.reason}
                onChange={(e) => setManualAdjustment({ ...manualAdjustment, reason: e.target.value })}
                placeholder="Enter reason for this adjustment..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleManualAdjustment}>
                {manualAdjustment.type === 'add' ? 'Add' : 'Remove'} Coins
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}