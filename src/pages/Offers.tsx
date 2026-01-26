import { MainLayout } from '@/components/layout/MainLayout';
import { useOffers } from '@/hooks/useOffers';
import { Percent, Clock } from 'lucide-react';

const Offers = () => {
  const { data: offers, isLoading } = useOffers();

  return (
    <MainLayout>
      <div className="container-fluid py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Special Offers</h1>
          <p className="text-muted-foreground mt-1">Don't miss our exclusive deals</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading offers...</div>
        ) : offers && offers.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {offers.map((offer) => (
              <div key={offer.id} className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 p-8">
                <div className="flex items-center gap-2 mb-4">
                  {offer.discount_percentage && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      <Percent className="w-4 h-4" />
                      {offer.discount_percentage}% OFF
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">
                    <Clock className="w-4 h-4" />
                    Limited Time
                  </span>
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground mb-2">{offer.title}</h3>
                {offer.description && <p className="text-muted-foreground">{offer.description}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">No active offers at the moment. Check back soon!</div>
        )}
      </div>
    </MainLayout>
  );
};

export default Offers;