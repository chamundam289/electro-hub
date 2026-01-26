import { Link } from 'react-router-dom';
import { ChevronRight, Smartphone, Laptop, Headphones, Camera, Tv, Watch, Gamepad2, Speaker } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';

const categoryIcons: Record<string, React.ElementType> = {
  smartphones: Smartphone,
  laptops: Laptop,
  headphones: Headphones,
  cameras: Camera,
  tvs: Tv,
  watches: Watch,
  gaming: Gamepad2,
  speakers: Speaker,
};

const defaultCategories = [
  { name: 'Smartphones', slug: 'smartphones', icon: Smartphone },
  { name: 'Laptops', slug: 'laptops', icon: Laptop },
  { name: 'Headphones', slug: 'headphones', icon: Headphones },
  { name: 'Cameras', slug: 'cameras', icon: Camera },
  { name: 'TVs', slug: 'tvs', icon: Tv },
  { name: 'Smart Watches', slug: 'watches', icon: Watch },
  { name: 'Gaming', slug: 'gaming', icon: Gamepad2 },
  { name: 'Speakers', slug: 'speakers', icon: Speaker },
];

export function CategoriesSection() {
  const { data: categories, isLoading } = useCategories();

  const displayCategories = categories && categories.length > 0
    ? categories.map(cat => ({
        ...cat,
        icon: categoryIcons[cat.slug] || Smartphone,
      }))
    : defaultCategories;

  return (
    <section className="py-16 bg-muted/30">
      <div className="container-fluid">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Shop by Category
            </h2>
            <p className="text-muted-foreground mt-1">
              Browse our wide range of electronics
            </p>
          </div>
          <Link
            to="/products"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {displayCategories.slice(0, 8).map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.slug}
                  to={`/products?category=${category.slug}`}
                  className="category-card group p-4 flex flex-col items-center justify-center text-center aspect-square"
                >
                  <div className="w-12 h-12 mb-3 flex items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}