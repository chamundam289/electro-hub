import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

import { ErrorBoundary } from '@/components/ErrorBoundary';
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
  TestTube
} from 'lucide-react';

// Import admin components
import DashboardOverview from '@/components/admin/DashboardOverview';
import POSSystem from '@/components/admin/POSSystem';
import ProductManagement from '@/components/admin/ProductManagement';
import OrderManagement from '@/components/admin/OrderManagement';
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
import AdminTest from '@/components/admin/AdminTest';

export default function AdminDashboard() {
  const { isAdmin, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Debug information
  console.log('AdminDashboard - User:', user);
  console.log('AdminDashboard - IsAdmin:', isAdmin);
  console.log('AdminDashboard - IsLoading:', isLoading);

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
    { id: 'sales-invoices', label: 'Sales Invoices', icon: Receipt },
    { id: 'sales-returns', label: 'Sales Returns', icon: ArrowUpDown },
    
    // Purchase Management
    { id: 'purchase-invoices', label: 'Purchase Invoices', icon: FileText },
    { id: 'purchase-returns', label: 'Purchase Returns', icon: ArrowUpDown },
    
    // Financial Management
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'expenses', label: 'Expenses', icon: DollarSign },
    
    // Relationship Management
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'suppliers', label: 'Suppliers', icon: UserPlus },
    { id: 'leads', label: 'Lead Management', icon: TrendingUp },
    
    // System Management
    { id: 'website-settings', label: 'Website Settings', icon: Settings },
    { id: 'test', label: 'System Test', icon: TestTube },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
          </div>
          <nav className="mt-6">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const showSeparator = [1, 3, 6, 8, 10, 14].includes(index); // Add separators after logical groups
              
              return (
                <div key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-100 transition-colors ${
                      activeTab === item.id ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </button>
                  {showSeparator && <div className="mx-4 my-2 border-t border-gray-200" />}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <ErrorBoundary>
              {activeTab === 'overview' && <DashboardOverview />}
              {activeTab === 'pos' && <POSSystem />}
              {activeTab === 'products' && <ProductManagement />}
              {activeTab === 'inventory' && <InventoryManagement />}
              {activeTab === 'orders' && <OrderManagement />}
              {activeTab === 'customers' && <CustomerManagement />}
              {activeTab === 'suppliers' && <SupplierManagement />}
              {activeTab === 'sales-invoices' && <SalesInvoices />}
              {activeTab === 'sales-returns' && <SalesReturns />}
              {activeTab === 'purchase-invoices' && <PurchaseInvoices />}
              {activeTab === 'purchase-returns' && <PurchaseReturns />}
              {activeTab === 'payments' && <PaymentManagement />}
              {activeTab === 'expenses' && <ExpenseManagement />}
              {activeTab === 'leads' && <LeadManagement />}
              {activeTab === 'website-settings' && <WebsiteSettings />}
              {activeTab === 'test' && <AdminTest />}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}