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
import { MultipleImageUpload } from '@/components/ui/MultipleImageUpload';
import { TableShimmer } from '@/components/ui/Shimmer';
import { usePagination } from '@/hooks/usePagination';
import { useProductImages } from '@/hooks/useProductImages';
import { useProductAffiliate } from '@/hooks/useProductAffiliate';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Star, Package, Coins, Users } from 'lucide-react';
import { toast } from 'sonner';

interface ProductImage {
  id?: string;
  image_url: string;
  image_alt?: string;
  display_order: number;
  is_primary: boolean;
  file_name?: string;
}

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
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const { saveImages } = useProductImages();
  const { updateProductAffiliateSettings, getProductAffiliateSettings, calculateCommission } = useProductAffiliate();

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
    category_id: '',
    is_visible: true,
    is_featured: false,
    coins_earned_per_purchase: 0,
    coins_required_to_buy: 0,
    is_coin_purchase_enabled: false,
    // Affiliate settings
    is_affiliate_enabled: false,
    affiliate_commission_type: 'percentage' as 'fixed' | 'percentage',
    affiliate_commission_value: 5
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

      if (error) {
        console.error('Products fetch error:', error);
        // Try without categories relationship if it fails
        const { data: productsOnly, error: productsError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (productsError) throw productsError;
        setProducts(productsOnly || []);
        return;
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate a unique slug
      const baseSlug = formData.name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, '-')         // Replace spaces with hyphens
        .replace(/-+/g, '-')          // Replace multiple hyphens with single
        .trim();                      // Remove leading/trailing spaces
      
      let uniqueSlug = baseSlug;
      
      // If editing, keep the same slug unless name changed significantly
      if (editingProduct && editingProduct.name === formData.name) {
        uniqueSlug = editingProduct.slug;
      } else {
        // Check if slug exists and make it unique
        try {
          const { data: existingProduct, error: slugError } = await supabase
            .from('products')
            .select('slug')
            .eq('slug', baseSlug)
            .maybeSingle(); // Use maybeSingle to avoid 406 errors
            
          if (!slugError && existingProduct && (!editingProduct || existingProduct.slug !== editingProduct.slug)) {
            uniqueSlug = `${baseSlug}-${Date.now()}`;
          }
        } catch (error) {
          // If error checking slug, use timestamp to ensure uniqueness
          console.warn('Slug validation error:', error);
          uniqueSlug = `${baseSlug}-${Date.now()}`;
        }
      }

      // Get primary image URL from productImages
      const primaryImage = productImages.find(img => img.is_primary);
      const primaryImageUrl = primaryImage?.image_url || '';

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
        image_url: primaryImageUrl, // Set primary image as main image_url
        category_id: formData.category_id || null,
        is_visible: formData.is_visible,
        is_featured: formData.is_featured,
        coins_earned_per_purchase: formData.coins_earned_per_purchase || 0,
        coins_required_to_buy: formData.coins_required_to_buy || 0,
        is_coin_purchase_enabled: formData.is_coin_purchase_enabled
      };

      console.log('Saving product data:', productData);

      let productId: string;

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        productId = editingProduct.id;
        toast.success('Product updated successfully');
      } else {
        // Generate unique SKU to avoid conflicts
        let finalSku = formData.sku;
        if (!finalSku) {
          finalSku = `PS${Date.now()}`;
        } else {
          // Check if SKU exists and make it unique
          try {
            const { data: existingSku } = await supabase
              .from('products')
              .select('sku')
              .eq('sku', finalSku)
              .maybeSingle();
              
            if (existingSku) {
              finalSku = `${formData.sku}-${Date.now()}`;
            }
          } catch (error) {
            console.warn('SKU validation error:', error);
            finalSku = `${formData.sku}-${Date.now()}`;
          }
        }
        
        // Update productData with unique SKU
        const finalProductData = { ...productData, sku: finalSku };
        
        const { data, error } = await supabase
          .from('products')
          .insert([finalProductData])
          .select('id')
          .single();

        if (error) {
          console.error('Insert error:', error);
          // If still getting SKU conflict, try with timestamp
          if (error.code === '23505' && error.message.includes('sku')) {
            const retryData = { ...finalProductData, sku: `${finalSku}-${Date.now()}` };
            const { data: retryResult, error: retryError } = await supabase
              .from('products')
              .insert([retryData])
              .select('id')
              .single();
              
            if (retryError) {
              throw retryError;
            }
            productId = retryResult.id;
          } else {
            throw error;
          }
        } else {
          productId = data.id;
        }
        toast.success('Product created successfully');
      }

      // Save multiple images to database
      if (productImages.length > 0) {
        try {
          await saveImages(productId, productImages);
        } catch (imageError) {
          console.error('Error saving images:', imageError);
          toast.error('Product saved but some images failed to save');
        }
      }

      // Create/Update loyalty settings - ALWAYS save loyalty settings for every product
      try {
        const loyaltySettings = {
          product_id: productId,
          coins_earned_per_purchase: formData.coins_earned_per_purchase || 0,
          coins_required_to_buy: formData.coins_required_to_buy || 0,
          is_coin_purchase_enabled: formData.is_coin_purchase_enabled || false,
          is_coin_earning_enabled: (formData.coins_earned_per_purchase || 0) > 0,
          updated_at: new Date().toISOString()
        };

        console.log('Creating loyalty settings:', loyaltySettings);

        // Use upsert to handle both insert and update
        const { error: loyaltyError } = await (supabase as any)
          .from('loyalty_product_settings')
          .upsert(loyaltySettings, { 
            onConflict: 'product_id',
            ignoreDuplicates: false 
          });

        if (loyaltyError) {
          console.error('Loyalty settings upsert error:', loyaltyError);
          toast.error(`Product saved but loyalty settings failed: ${loyaltyError.message}`);
        } else {
          console.log('Loyalty settings saved successfully');
        }
      } catch (loyaltyError) {
        console.error('Loyalty settings error:', loyaltyError);
        toast.error('Product saved but loyalty settings failed to save');
      }

      // Create/Update affiliate settings
      try {
        await updateProductAffiliateSettings(productId, {
          is_affiliate_enabled: formData.is_affiliate_enabled,
          commission_type: formData.affiliate_commission_type,
          commission_value: formData.affiliate_commission_value
        });
        console.log('Affiliate settings updated successfully');
      } catch (affiliateError) {
        console.error('Affiliate settings error:', affiliateError);
        toast.error('Product saved but affiliate settings failed to save');
      }

      setIsDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      
      // Fetch products with error handling
      try {
        await fetchProducts();
      } catch (fetchError) {
        console.error('Error refreshing products list:', fetchError);
        // Don't show error to user since product was saved successfully
        // Just log it for debugging
      }
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

  const handleEdit = async (product: Product) => {
    setEditingProduct(product);
    
    // Load existing images for this product
    try {
      const { data: existingImages, error } = await (supabase as any)
        .from('product_images')
        .select('*')
        .eq('product_id', product.id)
        .order('display_order', { ascending: true });

      if (!error && existingImages) {
        setProductImages(existingImages);
      } else {
        // If no images in product_images table, use the main image_url
        if (product.image_url) {
          setProductImages([{
            image_url: product.image_url,
            image_alt: product.name,
            display_order: 0,
            is_primary: true,
            file_name: 'existing-image'
          }]);
        } else {
          setProductImages([]);
        }
      }
    } catch (error) {
      console.log('Error loading product images:', error);
      setProductImages([]);
    }
    
    // Load loyalty settings from loyalty_product_settings table
    let loyaltySettings = null;
    try {
      const { data, error } = await (supabase as any)
        .from('loyalty_product_settings')
        .select('*')
        .eq('product_id', product.id)
        .single();
      
      if (!error && data) {
        loyaltySettings = data;
        console.log('Loaded loyalty settings:', loyaltySettings);
      } else if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for products without loyalty settings
        console.warn('Error loading loyalty settings:', error);
      }
    } catch (error) {
      console.log('No loyalty settings found for product:', product.id);
    }

    // Load affiliate settings from product_affiliate_settings table
    let affiliateSettings = null;
    try {
      const affiliateData = await getProductAffiliateSettings(product.id);
      if (affiliateData) {
        affiliateSettings = affiliateData;
        console.log('Loaded affiliate settings:', affiliateSettings);
      }
    } catch (error) {
      console.log('No affiliate settings found for product:', product.id);
    }

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
      category_id: product.category_id || '',
      is_visible: product.is_visible,
      is_featured: product.is_featured,
      // Use loyalty settings from loyalty_product_settings table if available, otherwise fallback to product table
      coins_earned_per_purchase: loyaltySettings?.coins_earned_per_purchase || (product as any).coins_earned_per_purchase || 0,
      coins_required_to_buy: loyaltySettings?.coins_required_to_buy || (product as any).coins_required_to_buy || 0,
      is_coin_purchase_enabled: loyaltySettings?.is_coin_purchase_enabled || (product as any).is_coin_purchase_enabled || false,
      // Affiliate settings
      is_affiliate_enabled: affiliateSettings?.is_affiliate_enabled || false,
      affiliate_commission_type: affiliateSettings?.commission_type || 'percentage',
      affiliate_commission_value: affiliateSettings?.commission_value || 5
    });
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
      category_id: '',
      is_visible: true,
      is_featured: false,
      coins_earned_per_purchase: 0,
      coins_required_to_buy: 0,
      is_coin_purchase_enabled: false,
      // Affiliate settings
      is_affiliate_enabled: false,
      affiliate_commission_type: 'percentage' as 'fixed' | 'percentage',
      affiliate_commission_value: 5
    });
    setProductImages([]);
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0 pb-4 border-b">
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update product information and settings.' : 'Create a new product with details, pricing, and inventory settings.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto dialog-scroll-container px-1">
              <form onSubmit={handleSubmit} className="product-form space-y-6 py-4">
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
                <Label>Product Images</Label>
                <MultipleImageUpload
                  productId={editingProduct?.id}
                  images={productImages}
                  onImagesChange={setProductImages}
                  maxImages={10}
                  folder="products"
                  maxSize={5}
                  allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
                />
              </div>

              {/* Loyalty Coins Configuration */}
              <div className="space-y-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-3">
                  <Coins className="h-5 w-5 text-yellow-600" />
                  <Label className="text-base font-semibold text-yellow-800">Loyalty Coins Settings</Label>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="coins_earned_per_purchase">Coins Earned per Purchase</Label>
                    <Input
                      id="coins_earned_per_purchase"
                      type="number"
                      min="0"
                      value={formData.coins_earned_per_purchase}
                      onChange={(e) => setFormData({ ...formData, coins_earned_per_purchase: Number(e.target.value) })}
                      placeholder="e.g., 10"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Coins user will earn when purchasing this product
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="coins_required_to_buy">Coins Required to Buy</Label>
                    <Input
                      id="coins_required_to_buy"
                      type="number"
                      min="0"
                      value={formData.coins_required_to_buy}
                      onChange={(e) => setFormData({ ...formData, coins_required_to_buy: Number(e.target.value) })}
                      placeholder="e.g., 100"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Coins needed to redeem this product for free
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_coin_purchase_enabled"
                    checked={formData.is_coin_purchase_enabled}
                    onChange={(e) => setFormData({ ...formData, is_coin_purchase_enabled: e.target.checked })}
                  />
                  <Label htmlFor="is_coin_purchase_enabled" className="text-sm">
                    Enable Coin Redemption for this Product
                  </Label>
                </div>
                
                {formData.coins_required_to_buy > 0 && (
                  <div className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                    <strong>Preview:</strong> Users with {formData.coins_required_to_buy} coins can redeem this product for free 
                    (≈ ₹{(formData.coins_required_to_buy * 0.1).toFixed(2)} value)
                  </div>
                )}
              </div>

              {/* Affiliate Marketing Settings */}
              <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-800">Affiliate Marketing Settings</h3>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_affiliate_enabled"
                    checked={formData.is_affiliate_enabled}
                    onChange={(e) => setFormData({ ...formData, is_affiliate_enabled: e.target.checked })}
                  />
                  <Label htmlFor="is_affiliate_enabled" className="text-sm">
                    Enable Affiliate Marketing for this Product
                  </Label>
                </div>

                {formData.is_affiliate_enabled && (
                  <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="affiliate_commission_type">Commission Type</Label>
                        <Select 
                          value={formData.affiliate_commission_type} 
                          onValueChange={(value: 'fixed' | 'percentage') => setFormData({ ...formData, affiliate_commission_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="affiliate_commission_value">
                          Commission Value {formData.affiliate_commission_type === 'percentage' ? '(%)' : '(₹)'}
                        </Label>
                        <Input
                          id="affiliate_commission_value"
                          type="number"
                          min="0"
                          step={formData.affiliate_commission_type === 'percentage' ? '0.1' : '1'}
                          max={formData.affiliate_commission_type === 'percentage' ? '100' : undefined}
                          value={formData.affiliate_commission_value}
                          onChange={(e) => setFormData({ ...formData, affiliate_commission_value: Number(e.target.value) })}
                          placeholder={formData.affiliate_commission_type === 'percentage' ? 'e.g., 5' : 'e.g., 50'}
                        />
                      </div>
                    </div>
                    
                    {formData.affiliate_commission_value > 0 && (
                      <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                        <strong>Preview:</strong> Affiliates will earn{' '}
                        {formData.affiliate_commission_type === 'percentage' 
                          ? `${formData.affiliate_commission_value}% commission (₹${(((formData.offer_price || formData.price) * formData.affiliate_commission_value) / 100).toFixed(2)} per sale)`
                          : `₹${formData.affiliate_commission_value} per sale`
                        }
                      </div>
                    )}
                  </div>
                )}
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
              </form>
            </div>
            
            {/* Fixed Footer with Action Buttons */}
            <div className="flex-shrink-0 flex justify-end space-x-2 pt-4 border-t bg-white">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                disabled={loading}
                onClick={() => {
                  const form = document.querySelector('.product-form');
                  if (form) {
                    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                    form.dispatchEvent(submitEvent);
                  }
                }}
              >
                {loading ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
              </Button>
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