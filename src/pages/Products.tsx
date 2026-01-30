import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { useProducts } from '@/hooks/useProducts';
import { LazyWrapper } from '@/components/ui/LazyWrapper';
import { ProductsGridShimmer } from '@/components/ui/Shimmer';

const Products = () => {
  const { data: allProducts, isLoading } = useProducts();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<{ min: number | null; max: number | null }>({
    min: null,
    max: null
  });
  const [sortBy, setSortBy] = useState('newest');

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];

    let filtered = [...allProducts];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(search) ||
        product.short_description?.toLowerCase().includes(search) ||
        product.description?.toLowerCase().includes(search)
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category_id === selectedCategory);
    }

    // Price range filter
    if (priceRange.min !== null || priceRange.max !== null) {
      filtered = filtered.filter(product => {
        const price = product.offer_price || product.price;
        const minCheck = priceRange.min === null || price >= priceRange.min;
        const maxCheck = priceRange.max === null || price <= priceRange.max;
        return minCheck && maxCheck;
      });
    }

    // Sort products
    filtered.sort((a, b) => {
      const aPrice = a.offer_price || a.price;
      const bPrice = b.offer_price || b.price;

      switch (sortBy) {
        case 'price-low':
          return aPrice - bPrice;
        case 'price-high':
          return bPrice - aPrice;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [allProducts, searchTerm, selectedCategory, priceRange, sortBy]);

  const handlePriceRangeChange = (min: number | null, max: number | null) => {
    setPriceRange({ min, max });
  };

  return (
    <MainLayout>
      <div className="container-fluid py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">All Products</h1>
          <p className="text-muted-foreground">
            Browse our complete collection of {allProducts?.length || 0} products
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <ProductFilters
            onSearchChange={setSearchTerm}
            onCategoryChange={setSelectedCategory}
            onPriceRangeChange={handlePriceRangeChange}
            onSortChange={setSortBy}
            searchTerm={searchTerm}
            selectedCategory={selectedCategory}
            priceRange={priceRange}
            sortBy={sortBy}
          />
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredProducts.length} of {allProducts?.length || 0} products
          </p>
        </div>

        {/* Product Grid */}
        <LazyWrapper 
          delay={200}
          fallback={<ProductsGridShimmer count={12} />}
        >
          <ProductGrid products={filteredProducts} isLoading={isLoading} />
        </LazyWrapper>

        {/* No Results */}
        {!isLoading && filteredProducts.length === 0 && allProducts && allProducts.length > 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filter criteria
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory(null);
                setPriceRange({ min: null, max: null });
                setSortBy('newest');
              }}
              className="text-primary hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Products;