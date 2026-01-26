import { MainLayout } from '@/components/layout/MainLayout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useProducts } from '@/hooks/useProducts';

const Products = () => {
  const { data: products, isLoading } = useProducts();

  return (
    <MainLayout>
      <div className="container-fluid py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">All Products</h1>
          <p className="text-muted-foreground mt-1">Browse our complete collection</p>
        </div>
        <ProductGrid products={products || []} isLoading={isLoading} />
      </div>
    </MainLayout>
  );
};

export default Products;