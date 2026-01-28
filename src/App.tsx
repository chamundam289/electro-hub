import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AutoRedirect } from "@/components/auth/AutoRedirect";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Offers from "./pages/Offers";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminSetup from "./pages/admin/AdminSetup";
import AdminDashboard from "./pages/AdminDashboard";
import { AffiliateDashboard } from "./components/affiliate/AffiliateDashboard";
import { LoginForm } from "./components/auth/LoginForm";
import { AffiliateLogin } from "./pages/affiliate/AffiliateLogin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/services" element={<Services />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Auto redirect route for successful logins */}
            <Route path="/dashboard" element={<AutoRedirect />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/setup" element={<AdminSetup />} />
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            {/* Affiliate Routes */}
            <Route path="/affiliate/login" element={<AffiliateLogin />} />
            <Route path="/affiliate/dashboard" element={
              <ProtectedRoute requiredRole="affiliate">
                <AffiliateDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;