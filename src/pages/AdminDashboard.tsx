import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { scrollToTop, ScrollToTop } from '@/components/ui/ScrollToTop';
import { useAdminScrollFix } from '@/hooks/useAdminScrollFix';
import { 
  BarChart3, 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  DollarSign,
  FileText,
  ArrowUpDown,
  Receipt,
  CreditCard,
  UserPlus,
  Warehouse,
  Settings,
  TestTube,
  PieChart,
  Smartphone,
  Wrench,
  Truck,
  Coins,
  Share2,
  Gift,
  Instagram,
  Database,
  Clock
} from 'lucide-react';

// Import admin components
import DashboardOverview from '@/components/admin/DashboardOverview';
import POSSystem from '@/components/admin/POSSystem';
import ProductManagement from '@/components/admin/ProductManagement';
import OrderManagement from '@/components/admin/OrderManagement';
import ShippingManagement from '@/components/admin/ShippingManagement';
import CustomerManagement from '@/components/admin/CustomerManagement';
import InventoryManagement from '@/components/admin/InventoryManagement';
import SalesInvoices from '@/components/admin/SalesInvoices';
import SalesReturns from '@/components/admin/SalesReturns';
import PurchaseInvoices from '@/components/admin/PurchaseInvoices';
import PurchaseReturns from '@/components/admin/PurchaseReturns';
import ExpenseManagement from '@/components/admin/ExpenseManagement';
import PaymentManagement from '@/components/admin/PaymentManagement';
import LeadManagement from '@/components/admin/LeadManagement';
import SupplierManagement from '@/components/admin/SupplierManagement';
import WebsiteSettings from '@/components/admin/WebsiteSettings';
import DatabaseManagement from '@/pages/admin/DatabaseManagement';
import AdvancedReports from '@/components/admin/AdvancedReports';
import AdminTest from '@/components/admin/AdminTest';
import MobileRecharge from '@/components/admin/MobileRecharge';
import UnifiedMobileRepair from '@/components/admin/UnifiedMobileRepair';
import { RepairAnalytics } from '@/components/admin/RepairAnalytics';
import AffiliateManagement from '@/components/admin/AffiliateManagement';
import LoyaltyManagement from '@/components/admin/LoyaltyManagement';
import CouponManagement from '@/components/admin/CouponManagement';
import CouponDistribution from '@/components/admin/CouponDistribution';
import EmployeeManagement from '@/components/admin/EmployeeManagement';
import AttendanceManagement from '@/components/admin/AttendanceManagement';
import SalaryManagement from '@/components/admin/SalaryManagement';

export default function AdminDashboard() {
  const { isAdmin, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const { resetScrollPosition } = useAdminScrollFix();

  // Utility function to scroll to top
  const handleScrollToTop = () => {
    scrollToTop();
  };

  // Scroll to top when navigating to different admin sections
  useEffect(() => {
    handleScrollToTop();
    resetScrollPosition();
  }, [activeTab, resetScrollPosition]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }



  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have admin privileges.</p>
          <p className="text-sm text-gray-500">User: {user.email}</p>
          <p className="text-sm text-gray-500">Admin Status: {isAdmin ? 'Yes' : 'No'}</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    // Core Operations
    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'pos', label: 'POS System', icon: ShoppingCart },
    
    // Product & Inventory Management
    { id: 'products', label: 'Products', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Warehouse },
    
    // Sales Management
    { id: 'orders', label: 'Orders', icon: FileText },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'sales-invoices', label: 'Sales Invoices', icon: Receipt },
    { id: 'sales-returns', label: 'Sales Returns', icon: ArrowUpDown },
    
    // Purchase Management
    { id: 'purchase-invoices', label: 'Purchase Invoices', icon: FileText },
    { id: 'purchase-returns', label: 'Purchase Returns', icon: ArrowUpDown },
    
    // Financial Management
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'expenses', label: 'Expenses', icon: DollarSign },
    { id: 'loyalty', label: 'Loyalty Coins', icon: Coins },
    { id: 'coupons', label: 'Coupons & Offers', icon: Gift },
    { id: 'coupon-distribution', label: 'Send Coupons', icon: Gift },
    { id: 'affiliates', label: 'Affiliate Marketing', icon: Share2 },
    { id: 'instagram', label: 'Instagram Marketing', icon: Instagram },
    { id: 'mobile-recharge', label: 'Mobile Recharge', icon: Smartphone },
    { id: 'mobile-repair', label: 'Mobile Repair Management', icon: Wrench },
    { id: 'repair-analytics', label: 'Repair Analytics', icon: BarChart3 },
    
    // Relationship Management
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'suppliers', label: 'Suppliers', icon: UserPlus },
    { id: 'leads', label: 'Lead Management', icon: TrendingUp },
    
    // Employee Management
    { id: 'employees', label: 'Employee Management', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'salaries', label: 'Salary Management', icon: DollarSign },
    
    // Reports & Analytics
    { id: 'reports', label: 'Advanced Reports', icon: PieChart },
    
    // System Management
    { id: 'website-settings', label: 'Website Settings', icon: Settings },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'test', label: 'System Test', icon: TestTube },
  ];

  return (
    <div className="admin-layout bg-gray-50 flex">
      {/* Sidebar - Fixed height, only nav scrolls */}
      <div className="admin-sidebar w-64 bg-white shadow-lg flex flex-col fixed left-0 top-0 z-30">
        {/* Fixed Header */}
        <div className="p-6 border-b flex-shrink-0 bg-white">
          <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
        </div>
        
        {/* Scrollable Navigation - Only this part scrolls */}
        <nav className="flex-1 overflow-y-auto admin-sidebar-nav">
          <div className="py-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const showSeparator = [1, 3, 7, 9, 11, 15, 16, 19].includes(index); // Add separators after logical groups
              
              return (
                <div key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-100 transition-all duration-200 ${
                      activeTab === item.id 
                        ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-600 font-medium' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="truncate text-sm">{item.label}</span>
                  </button>
                  {showSeparator && <div className="mx-4 my-2 border-t border-gray-200" />}
                </div>
              );
            })}
          </div>
        </nav>
        
        {/* Fixed Footer */}
        <div className="p-4 border-t bg-gray-50 flex-shrink-0">
          <div className="text-xs text-gray-500 text-center">
            <p>ElectroStore Admin</p>
            <p>v1.0.0</p>
          </div>
        </div>
      </div>

      {/* Main Content - Single scroll container */}
      <div className="admin-main-content flex-1 ml-64">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <ErrorBoundary>
              {activeTab === 'overview' && <DashboardOverview />}
              {activeTab === 'pos' && <POSSystem key="pos-system" />}
              {activeTab === 'products' && <ProductManagement />}
              {activeTab === 'inventory' && <InventoryManagement />}
              {activeTab === 'orders' && <OrderManagement />}
              {activeTab === 'shipping' && <ShippingManagement />}
              {activeTab === 'customers' && <CustomerManagement />}
              {activeTab === 'suppliers' && <SupplierManagement />}
              {activeTab === 'sales-invoices' && <SalesInvoices />}
              {activeTab === 'sales-returns' && <SalesReturns />}
              {activeTab === 'purchase-invoices' && <PurchaseInvoices />}
              {activeTab === 'purchase-returns' && <PurchaseReturns />}
              {activeTab === 'payments' && <PaymentManagement />}
              {activeTab === 'expenses' && <ExpenseManagement />}
              {activeTab === 'loyalty' && <LoyaltyManagement />}
              {activeTab === 'coupons' && <CouponManagement />}
              {activeTab === 'coupon-distribution' && <CouponDistribution />}
              {activeTab === 'affiliates' && <AffiliateManagement />}
              {activeTab === 'instagram' && <InstagramMarketing />}
              {activeTab === 'mobile-recharge' && <MobileRecharge />}
              {activeTab === 'mobile-repair' && <UnifiedMobileRepair />}
              {activeTab === 'repair-analytics' && <RepairAnalytics />}
              {activeTab === 'leads' && <LeadManagement />}
              {activeTab === 'employees' && <EmployeeManagement />}
              {activeTab === 'attendance' && <AttendanceManagement />}
              {activeTab === 'salaries' && <SalaryManagement />}
              {activeTab === 'reports' && <AdvancedReports />}
              {activeTab === 'website-settings' && <WebsiteSettings />}
              {activeTab === 'database' && <DatabaseManagement />}
              {activeTab === 'test' && <AdminTest />}
            </ErrorBoundary>
          </div>
        </div>
      </div>
      
      {/* Global Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
}