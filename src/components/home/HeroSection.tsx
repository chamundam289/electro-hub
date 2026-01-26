import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden hero-gradient text-secondary-foreground">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container-fluid relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center py-16 lg:py-24">
          {/* Content */}
          <div className="space-y-8 animate-slide-in-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">New Arrivals Every Week</span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Premium Electronics
              <span className="block text-primary">For Modern Living</span>
            </h1>

            <p className="text-lg text-secondary-foreground/70 max-w-lg">
              Discover the latest gadgets and electronics at unbeatable prices. 
              Quality products, fast delivery, and exceptional customer service.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 group">
                <Link to="/products">
                  Shop Now
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10">
                <Link to="/offers">
                  View Offers
                </Link>
              </Button>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-secondary-foreground/70">
                <Truck className="w-5 h-5 text-primary" />
                <span>Free Shipping</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-secondary-foreground/70">
                <Shield className="w-5 h-5 text-primary" />
                <span>Warranty Included</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-secondary-foreground/70">
                <Zap className="w-5 h-5 text-primary" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>

          {/* Hero Image / Graphic */}
          <div className="relative animate-slide-in-right hidden lg:block">
            <div className="relative">
              {/* Decorative Elements */}
              <div className="absolute -top-10 -left-10 w-20 h-20 bg-primary/30 rounded-full blur-2xl animate-pulse-glow" />
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-accent/30 rounded-full blur-2xl" />
              
              {/* Main Visual */}
              <div className="relative bg-gradient-to-br from-secondary-foreground/10 to-secondary-foreground/5 rounded-3xl p-8 border border-secondary-foreground/10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-6 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-4xl font-bold text-primary">50%</span>
                      <p className="text-sm text-secondary-foreground/70">Off Deals</p>
                    </div>
                  </div>
                  <div className="aspect-square bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl p-6 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-4xl font-bold text-accent">1000+</span>
                      <p className="text-sm text-secondary-foreground/70">Products</p>
                    </div>
                  </div>
                  <div className="col-span-2 bg-gradient-to-r from-secondary-foreground/10 to-secondary-foreground/5 rounded-2xl p-6 flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-secondary-foreground">New Collection</span>
                      <p className="text-sm text-secondary-foreground/70">Latest Tech Gadgets</p>
                    </div>
                    <ArrowRight className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}