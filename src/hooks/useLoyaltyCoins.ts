import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Type assertion helper for loyalty tables
const loyaltySupabase = supabase as any;

export interface LoyaltyWallet {
  id: string;
  user_id: string;
  total_coins_earned: number;
  total_coins_used: number;
  available_coins: number;
  last_updated: string;
  created_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  user_id: string;
  transaction_type: 'earned' | 'redeemed' | 'expired' | 'manual_add' | 'manual_remove';
  coins_amount: number;
  reference_type?: string;
  reference_id?: string;
  order_id?: string;
  product_id?: string;
  product_name?: string;
  description?: string;
  admin_notes?: string;
  expires_at?: string;
  created_at: string;
}

export interface LoyaltySystemSettings {
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

export interface ProductLoyaltySettings {
  product_id: string;
  coins_earned_per_purchase: number;
  coins_required_to_buy: number;
  is_coin_purchase_enabled: boolean;
  is_coin_earning_enabled: boolean;
}

export const useLoyaltyCoins = () => {
  const [wallet, setWallet] = useState<LoyaltyWallet | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [systemSettings, setSystemSettings] = useState<LoyaltySystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch user's loyalty wallet
  const fetchWallet = async () => {
    if (!user) {
      setWallet(null);
      return;
    }

    try {
      const { data, error } = await loyaltySupabase
        .from('loyalty_coins_wallet')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Handle table not found or permission errors gracefully
        if (error.code === 'PGRST116' || error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('permission')) {
          console.warn('Loyalty tables not yet created or accessible:', error.message);
          setWallet(null);
          return;
        }
        console.error('Error fetching wallet:', error);
        setError('Failed to fetch coin wallet');
        return;
      }

      setWallet(data as LoyaltyWallet || null);
    } catch (err) {
      console.error('Error in fetchWallet:', err);
      setError('Failed to fetch coin wallet');
    }
  };

  // Fetch user's loyalty transactions
  const fetchTransactions = async (limit = 50) => {
    if (!user) {
      setTransactions([]);
      return;
    }

    try {
      const { data, error } = await loyaltySupabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        // Handle table not found or permission errors gracefully
        if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('permission')) {
          console.warn('Loyalty tables not yet created or accessible:', error.message);
          setTransactions([]);
          return;
        }
        console.error('Error fetching transactions:', error);
        setError('Failed to fetch transaction history');
        return;
      }

      setTransactions((data as LoyaltyTransaction[]) || []);
    } catch (err) {
      console.error('Error in fetchTransactions:', err);
      setError('Failed to fetch transaction history');
    }
  };

  // Fetch system settings
  const fetchSystemSettings = async () => {
    console.log('🔍 useLoyaltyCoins: Fetching system settings...');
    
    try {
      const { data, error } = await loyaltySupabase
        .from('loyalty_system_settings')
        .select('*')
        .limit(1)
        .single();

      console.log('📡 useLoyaltyCoins: System settings response:', { data, error });

      if (error) {
        // Handle table not found or permission errors gracefully
        if (error.code === 'PGRST116' || error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('permission')) {
          console.warn('⚠️ useLoyaltyCoins: Loyalty system settings not yet created or accessible:', error.message);
          // Set default settings when table doesn't exist
          const defaultSettings = {
            id: 'default',
            is_system_enabled: false, // Disable system when tables don't exist
            global_coins_multiplier: 1.00,
            default_coins_per_rupee: 0.10,
            min_coins_to_redeem: 10,
            festive_multiplier: 1.00
          } as LoyaltySystemSettings;
          console.log('🔧 useLoyaltyCoins: Using default settings:', defaultSettings);
          setSystemSettings(defaultSettings);
          return;
        }
        console.error('❌ useLoyaltyCoins: Error fetching system settings:', error);
        return;
      }

      const settings = data as LoyaltySystemSettings;
      console.log('✅ useLoyaltyCoins: System settings loaded:', {
        enabled: settings?.is_system_enabled,
        coins_per_rupee: settings?.default_coins_per_rupee
      });
      setSystemSettings(settings || null);
    } catch (err) {
      console.error('❌ useLoyaltyCoins: Error in fetchSystemSettings:', err);
    }
  };

  // Get product loyalty settings
  const getProductLoyaltySettings = async (productId: string): Promise<ProductLoyaltySettings | null> => {
    console.log('🔍 useLoyaltyCoins: Getting settings for product:', productId);
    
    try {
      const { data, error } = await loyaltySupabase
        .from('loyalty_product_settings')
        .select('*')
        .eq('product_id', productId)
        .single();

      console.log('📡 useLoyaltyCoins: Database response:', { data, error });

      if (error && error.code !== 'PGRST116') {
        console.error('❌ useLoyaltyCoins: Error fetching product loyalty settings:', error);
        return null;
      }

      const result = (data as ProductLoyaltySettings) || null;
      console.log('✅ useLoyaltyCoins: Returning settings:', result);
      return result;
    } catch (err) {
      console.error('❌ useLoyaltyCoins: Error in getProductLoyaltySettings:', err);
      return null;
    }
  };

  // Calculate coins that would be earned for a purchase amount
  const calculateCoinsEarned = (amount: number): number => {
    if (!systemSettings || !systemSettings.is_system_enabled) return 0;

    let coins = Math.floor(amount * systemSettings.default_coins_per_rupee);
    coins = Math.floor(coins * systemSettings.global_coins_multiplier);

    // Apply festive multiplier if active
    if (systemSettings.festive_start_date && systemSettings.festive_end_date) {
      const now = new Date();
      const festiveStart = new Date(systemSettings.festive_start_date);
      const festiveEnd = new Date(systemSettings.festive_end_date);
      
      if (now >= festiveStart && now <= festiveEnd) {
        coins = Math.floor(coins * systemSettings.festive_multiplier);
      }
    }

    // Apply max coins per order limit
    if (systemSettings.max_coins_per_order && coins > systemSettings.max_coins_per_order) {
      coins = systemSettings.max_coins_per_order;
    }

    return coins;
  };

  // Check if user can redeem coins for a product
  const canRedeemCoins = (coinsRequired: number): boolean => {
    if (!wallet || !systemSettings) return false;
    if (!systemSettings.is_system_enabled) return false;
    if (coinsRequired < systemSettings.min_coins_to_redeem) return false;
    return wallet.available_coins >= coinsRequired;
  };

  // Redeem coins for a purchase (to be called during checkout)
  const redeemCoins = async (coinsToRedeem: number, orderId: string, description: string): Promise<boolean> => {
    if (!user || !wallet) {
      toast.error('User not authenticated');
      return false;
    }

    if (!canRedeemCoins(coinsToRedeem)) {
      toast.error('Insufficient coins for redemption');
      return false;
    }

    try {
      // Create redemption transaction
      const { error: transactionError } = await loyaltySupabase
        .from('loyalty_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'redeemed',
          coins_amount: -coinsToRedeem, // Negative for redemption
          reference_type: 'order',
          reference_id: orderId,
          order_id: orderId,
          description: description
        });

      if (transactionError) {
        console.error('Error creating redemption transaction:', transactionError);
        toast.error('Failed to redeem coins');
        return false;
      }

      // Update wallet
      const { error: walletError } = await loyaltySupabase
        .from('loyalty_coins_wallet')
        .update({
          total_coins_used: wallet.total_coins_used + coinsToRedeem,
          available_coins: wallet.available_coins - coinsToRedeem,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (walletError) {
        console.error('Error updating wallet:', walletError);
        toast.error('Failed to update coin balance');
        return false;
      }

      // Refresh data
      await fetchWallet();
      await fetchTransactions();
      
      toast.success(`Successfully redeemed ${coinsToRedeem} coins!`);
      return true;
    } catch (err) {
      console.error('Error in redeemCoins:', err);
      toast.error('Failed to redeem coins');
      return false;
    }
  };

  // Initialize wallet if it doesn't exist
  const initializeWallet = async () => {
    if (!user || wallet) return;

    try {
      const { error } = await loyaltySupabase
        .from('loyalty_coins_wallet')
        .insert({
          user_id: user.id,
          total_coins_earned: 0,
          total_coins_used: 0,
          available_coins: 0
        });

      if (error) {
        // Handle table not found or permission errors gracefully
        if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('permission')) {
          console.warn('Loyalty tables not yet created or accessible, skipping wallet initialization');
          return;
        }
        if (error.code !== '23505') { // 23505 = unique violation (already exists)
          console.error('Error initializing wallet:', error);
          return;
        }
      }

      await fetchWallet();
    } catch (err) {
      console.error('Error in initializeWallet:', err);
    }
  };

  // Load all data with better error handling
  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try to fetch system settings first to check if tables exist
      const { data: settingsData, error: settingsError } = await loyaltySupabase
        .from('loyalty_system_settings')
        .select('*')
        .limit(1)
        .single();

      if (settingsError) {
        // Tables don't exist, set system as disabled
        console.warn('Loyalty system not set up yet:', settingsError.message);
        setSystemSettings({
          id: 'default',
          is_system_enabled: false,
          global_coins_multiplier: 1.00,
          default_coins_per_rupee: 0.10,
          min_coins_to_redeem: 10,
          festive_multiplier: 1.00
        } as LoyaltySystemSettings);
        setWallet(null);
        setTransactions([]);
        setLoading(false);
        return;
      }

      // If settings exist, try to load other data
      setSystemSettings(settingsData as LoyaltySystemSettings);
      
      if (settingsData?.is_system_enabled) {
        await Promise.all([
          fetchWallet(),
          fetchTransactions()
        ]);
      }
    } catch (err) {
      console.error('Error loading loyalty data:', err);
      setError('Failed to load loyalty data');
    } finally {
      setLoading(false);
    }
  };

  // Initialize wallet after data is loaded
  useEffect(() => {
    if (user && !loading && !wallet) {
      initializeWallet();
    }
  }, [user, loading, wallet]);

  // Effect to load data when user changes
  useEffect(() => {
    loadData();
  }, [user]);

  // Real-time subscription for wallet updates
  useEffect(() => {
    if (!user) return;

    const walletSubscription = loyaltySupabase
      .channel('loyalty_wallet_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loyalty_coins_wallet',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchWallet();
        }
      )
      .subscribe();

    const transactionSubscription = loyaltySupabase
      .channel('loyalty_transaction_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'loyalty_transactions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      walletSubscription.unsubscribe();
      transactionSubscription.unsubscribe();
    };
  }, [user]);

  return {
    // Data
    wallet,
    transactions,
    systemSettings,
    loading,
    error,

    // Functions
    fetchWallet,
    fetchTransactions,
    getProductLoyaltySettings,
    calculateCoinsEarned,
    canRedeemCoins,
    redeemCoins,
    initializeWallet,
    loadData,

    // Computed values
    isSystemEnabled: (() => {
      const enabled = systemSettings?.is_system_enabled || false;
      console.log('🔍 useLoyaltyCoins: isSystemEnabled =', enabled, 'systemSettings =', systemSettings);
      return enabled;
    })(),
    minCoinsToRedeem: systemSettings?.min_coins_to_redeem || 10,
    isFestiveActive: systemSettings?.festive_start_date && systemSettings?.festive_end_date 
      ? new Date() >= new Date(systemSettings.festive_start_date) && new Date() <= new Date(systemSettings.festive_end_date)
      : false
  };
};