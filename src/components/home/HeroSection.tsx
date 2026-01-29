import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Truck, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container-fluid relative">
        <div className="py-12 lg:py-20">
          {/* Welcome Message */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <span className="text-2xl">👋</span>
              <span className="text-sm font-medium text-primary">Welcome Back</span>
            </div>
            
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-gray-900 mb-4">
              Find Your Perfect
              <span className="block text-primary">Mobile & Electronics</span>
            </h1>
            
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Discover the latest smartphones, laptops, and gadgets at unbeatable prices. 
              Quality products with fast delivery and exceptional service.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search products, store, or brand"
                className="pl-10 h-12 text-base rounded-xl border-gray-200 focus:border-primary"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 group h-12 px-8">
              <Link to="/products">
                Explore Products
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-50 h-12 px-8">
              <Link to="/offers">
                View Offers
              </Link>
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium text-gray-900">Free Delivery</p>
              <p className="text-sm text-gray-600">On orders above ₹50</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium text-gray-900">Warranty</p>
              <p className="text-sm text-gray-600">Manufacturer warranty</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium text-gray-900">24/7 Support</p>
              <p className="text-sm text-gray-600">Customer care</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}