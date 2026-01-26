import { MainLayout } from '@/components/layout/MainLayout';
import { useServices } from '@/hooks/useServices';
import { Wrench, Shield, Truck, Headphones } from 'lucide-react';

const defaultServices = [
  { id: '1', title: 'Product Repairs', description: 'Expert repair services for all electronics', icon: 'wrench' },
  { id: '2', title: 'Warranty Support', description: 'Comprehensive warranty coverage', icon: 'shield' },
  { id: '3', title: 'Home Delivery', description: 'Fast and secure delivery to your doorstep', icon: 'truck' },
  { id: '4', title: '24/7 Support', description: 'Round-the-clock customer assistance', icon: 'headphones' },
];

const iconMap: Record<string, React.ElementType> = { wrench: Wrench, shield: Shield, truck: Truck, headphones: Headphones };

const Services = () => {
  const { data: services } = useServices();
  const displayServices = services && services.length > 0 ? services : defaultServices;

  return (
    <MainLayout>
      <div className="container-fluid py-8">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground">Our Services</h1>
          <p className="text-muted-foreground mt-1">Quality services to support your electronics</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayServices.map((service) => {
            const Icon = iconMap[service.icon || 'wrench'] || Wrench;
            return (
              <div key={service.id} className="p-6 rounded-xl bg-card border border-border text-center hover:border-primary transition-colors">
                <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
};

export default Services;