import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DataPagination } from '@/components/ui/data-pagination';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { TableShimmer } from '@/components/ui/shimmer';
import { usePagination } from '@/hooks/usePagination';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Star, Package } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  offer_price?: number;
  cost_price?: number;
  stock_quantity: number;
  min_stock_level?: number;
  max_stock_level?: number;
  reorder_point?: number;
  sku?: string;
  unit?: string;
  tax_rate?: number;
  image_url?: string;
  category_id?: string;
  is_visible: boolean;
  is_featured: boolean;
  created_at: string;
  categories?: { name: string };
}

interface Category {
  id: string;
  name: string;
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [imageUrlValid, setImageUrlValid] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    offer_price: 0,
    cost_price: 0,
    stock_quantity: 0,
    min_stock_level: 0,
    max_stock_level: 0,
    reorder_point: 0,
    sku: '',
    unit: 'pcs',
    tax_rate: 18,
    image_url: '',
    category_id: '',
    is_visible: true,
    is_featured: false
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Helper function to validate image URL
  const isValidImageUrl = (url: string): boolean => {
    if (!url) return true; // Empty URL is valid (optional)
    
    try {
      const urlObj = new URL(url);
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      const pathname = urlObj.pathname.toLowerCase();
      
      return validExtensions.some(ext => pathname.endsWith(ext)) || 
             pathname.includes('/image/') || 
             urlObj.hostname.includes('imgur') ||
             urlObj.hostname.includes('cloudinary') ||
             urlObj.hostname.includes('supabase');
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate image URL if provided
      if (formData.image_url && !isValidImageUrl(formData.image_url)) {
        toast.error('Please enter a valid image URL');
        setLoading(false);
        return;
      }
      // Generate a unique slug
      const baseSlug = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      let uniqueSlug = baseSlug;
      
      // If editing, keep the same slug unless name changed significantly
      if (editingProduct && editingProduct.name === formData.name) {
        uniqueSlug = editingProduct.slug;
      } else {
        // Check if slug exists and make it unique
        const { data: existingProduct } = await supabase
          .from('products')
          .select('slug')
          .eq('slug', baseSlug)
          .single();
          
        if (existingProduct && (!editingProduct || existingProduct.slug !== editingProduct.slug)) {
          uniqueSlug = `${baseSlug}-${Date.now()}`;
        }
      }

      const productData = {
        name: formData.name,
        slug: uniqueSlug,
        description: formData.description,
        price: formData.price,
        offer_price: formData.offer_price || null,
        cost_price: formData.cost_price || null,
        stock_quantity: formData.stock_quantity,
        min_stock_level: formData.min_stock_level || null,
        max_stock_level: formData.max_stock_level || null,
        reorder_point: formData.reorder_point || null,
        sku: formData.sku || null,
        unit: formData.unit,
        tax_rate: formData.tax_rate,
        image_url: formData.image_url || null,
        category_id: formData.category_id || null,
        is_visible: formData.is_visible,
        is_featured: formData.is_featured
      };

      console.log('Saving product data:', productData);

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        toast.success('Product updated successfully');
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        toast.success('Product created successfully');
      }

      setIsDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      
      if (error.code === '23505') {
        // Unique constraint violation
        if (error.message.includes('slug')) {
          toast.error('Product name already exists. Please use a different name.');
        } else if (error.message.includes('sku')) {
          toast.error('SKU already exists. Please use a different SKU.');
        } else {
          toast.error('Duplicate entry. Please check your data.');
        }
      } else {
        toast.error(`Failed to save product: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      offer_price: product.offer_price || 0,
      cost_price: product.cost_price || 0,
      stock_quantity: product.stock_quantity,
      min_stock_level: product.min_stock_level || 0,
      max_stock_level: product.max_stock_level || 0,
      reorder_point: product.reorder_point || 0,
      sku: product.sku || '',
      unit: product.unit || 'pcs',
      tax_rate: product.tax_rate || 18,
      image_url: product.image_url || '',
      category_id: product.category_id || '',
      is_visible: product.is_visible,
      is_featured: product.is_featured
    });
    setImageUrlValid(isValidImageUrl(product.image_url || ''));
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      offer_price: 0,
      cost_price: 0,
      stock_quantity: 0,
      min_stock_level: 0,
      max_stock_level: 0,
      reorder_point: 0,
      sku: '',
      unit: 'pcs',
      tax_rate: 18,
      image_url: '',
      category_id: '',
      is_visible: true,
      is_featured: false
    });
    setImageUrlValid(true);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === 'all' || !filterCategory || product.category_id === filterCategory;
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && product.is_visible) ||
                           (filterStatus === 'inactive' && !product.is_visible) ||
                           (filterStatus === 'featured' && product.is_featured) ||
                           (filterStatus === 'low_stock' && product.stock_quantity <= (product.reorder_point || 10));
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, filterCategory, filterStatus]);

  const pagination = usePagination({
    totalItems: filteredProducts.length,
    itemsPerPage: 25,
  });

  const paginatedProducts = useMemo(() => {
    const startIndex = pagination.startIndex;
    const endIndex = pagination.endIndex;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, pagination.startIndex, pagination.endIndex]);

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) return { label: 'Out of Stock', color: 'destructive' };
    if (product.stock_quantity <= (product.reorder_point || 10)) return { label: 'Low Stock', color: 'secondary' };
    return { label: 'In Stock', color: 'default' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingProduct(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] dialog-content">
            <div className="max-h-[80vh] overflow-y-auto p-1">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update product information and settings.' : 'Create a new product with details, pricing, and inventory settings.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cost_price">Cost Price</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="price">Selling Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="offer_price">Offer Price</Label>
                  <Input
                    id="offer_price"
                    type="number"
                    step="0.01"
                    value={formData.offer_price}
                    onChange={(e) => setFormData({ ...formData, offer_price: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="stock_quantity">Stock Quantity</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="min_stock_level">Min Stock</Label>
                  <Input
                    id="min_stock_level"
                    type="number"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="max_stock_level">Max Stock</Label>
                  <Input
                    id="max_stock_level"
                    type="number"
                    value={formData.max_stock_level}
                    onChange={(e) => setFormData({ ...formData, max_stock_level: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="reorder_point">Reorder Point</Label>
                  <Input
                    id="reorder_point"
                    type="number"
                    value={formData.reorder_point}
                    onChange={(e) => setFormData({ ...formData, reorder_point: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">Pieces</SelectItem>
                      <SelectItem value="kg">Kilogram</SelectItem>
                      <SelectItem value="ltr">Liter</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                      <SelectItem value="set">Set</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    step="0.01"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="category_id">Category</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Product Image</Label>
                <div className="space-y-4">
                  {/* File Upload Option */}
                  <div>
                    <Label className="text-sm text-gray-600">Upload Image File</Label>
                    <ImageUpload
                      onImageUploaded={(imageUrl) => setFormData({ ...formData, image_url: imageUrl })}
                      currentImage={formData.image_url}
                      folder="products"
                      maxSize={5}
                      allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
                      showPreview={true}
                    />
                  </div>
                  
                  {/* Manual URL Input Option */}
                  <div>
                    <Label className="text-sm text-gray-600">Or Enter Image URL</Label>
                    <div className="relative">
                      <Input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={formData.image_url}
                        onChange={(e) => {
                          const url = e.target.value;
                          setFormData({ ...formData, image_url: url });
                          setImageUrlValid(isValidImageUrl(url));
                        }}
                        className={!imageUrlValid && formData.image_url ? 'border-red-500' : ''}
                      />
                      {formData.image_url && (
                        <div className="absolute right-2 top-2">
                          {imageUrlValid ? (
                            <div className="text-green-500 text-xs">✓ Valid</div>
                          ) : (
                            <div className="text-red-500 text-xs">✗ Invalid</div>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      You can either upload an image file above or enter a direct image URL here
                    </p>
                    {!imageUrlValid && formData.image_url && (
                      <p className="text-xs text-red-500 mt-1">
                        Please enter a valid image URL (jpg, png, gif, webp, svg)
                      </p>
                    )}
                  </div>
                  
                  {/* Image Preview */}
                  {formData.image_url && (
                    <div>
                      <Label className="text-sm text-gray-600">Current Image Preview</Label>
                      <div className="mt-2 border rounded-lg p-2 bg-gray-50">
                        <img
                          src={formData.image_url}
                          alt="Product preview"
                          className="max-w-full h-32 object-cover rounded"
                          onError={(e) => {
                            const target = e.currentTarget;
                            const errorDiv = target.nextElementSibling as HTMLElement;
                            target.style.display = 'none';
                            if (errorDiv) errorDiv.style.display = 'block';
                          }}
                        />
                        <div className="text-red-500 text-sm hidden">
                          Failed to load image. Please check the URL.
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => setFormData({ ...formData, image_url: '' })}
                      >
                        Remove Image
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_visible"
                    checked={formData.is_visible}
                    onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                  />
                  <Label htmlFor="is_visible">Visible</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  />
                  <Label htmlFor="is_featured">Featured</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-shimmer"></div>
                  <div className="h-10 w-full bg-gray-200 rounded animate-shimmer"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Search Products</Label>
                <Input
                  placeholder="Search by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('');
                  setFilterStatus('all');
                }}>
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Products ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-6 w-32 bg-gray-200 rounded animate-shimmer"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-shimmer"></div>
              </div>
              <TableShimmer rows={10} columns={7} />
            </div>
          ) : (
            <>
              <div className="w-full">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Product</th>
                      <th className="text-left p-2">SKU</th>
                      <th className="text-left p-2">Category</th>
                      <th className="text-left p-2">Price</th>
                      <th className="text-left p-2">Stock</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                {paginatedProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div className="flex items-center gap-3">
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <div className="flex gap-1">
                              {product.is_featured && (
                                <Badge variant="secondary" className="text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-2">{product.sku || '-'}</td>
                      <td className="p-2">{product.categories?.name || '-'}</td>
                      <td className="p-2">
                        <div>
                          <p className="font-medium">₹{product.price}</p>
                          {product.offer_price && product.offer_price > 0 && (
                            <p className="text-sm text-green-600">Offer: ₹{product.offer_price}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{product.stock_quantity} {product.unit}</p>
                          <Badge variant={stockStatus.color as any} className="text-xs">
                            {stockStatus.label}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant={product.is_visible ? 'default' : 'secondary'}>
                          {product.is_visible ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No products found matching your criteria.
              </div>
            )}
          </div>
          
            {filteredProducts.length > 0 && (
              <div className="mt-4">
                <DataPagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalItems={filteredProducts.length}
                  itemsPerPage={pagination.itemsPerPage}
                  startIndex={pagination.startIndex}
                  endIndex={pagination.endIndex}
                  hasNextPage={pagination.hasNextPage}
                  hasPreviousPage={pagination.hasPreviousPage}
                  onPageChange={pagination.goToPage}
                  onItemsPerPageChange={pagination.setItemsPerPage}
                  onFirstPage={pagination.goToFirstPage}
                  onLastPage={pagination.goToLastPage}
                  onNextPage={pagination.goToNextPage}
                  onPreviousPage={pagination.goToPreviousPage}
                  getPageNumbers={pagination.getPageNumbers}
                  itemsPerPageOptions={[10, 25, 50, 100]}
                />
              </div>
            )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}