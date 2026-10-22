'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { formatPrice, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Package, Eye, EyeOff, X, Upload, ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  material: string | null;
  price: number;
  sale_price: number | null;
  active: boolean;
  created_at: string;
  product_variants: { id: string; size: string; color: string; stock: number; active: boolean }[];
  product_images: { id: string; image_url: string; is_cover: boolean }[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const supabase = createClient();

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select(`
        id, name, slug, description, material, price, sale_price, active, created_at,
        product_variants (id, size, color, stock, active),
        product_images (id, image_url, is_cover)
      `)
      .order('created_at', { ascending: false });
    setProducts((data || []) as Product[]);
    setLoading(false);
  }

  async function toggleActive(product: Product) {
    const { error } = await supabase
      .from('products')
      .update({ active: !product.active })
      .eq('id', product.id);
    if (error) { toast.error('Failed to update product'); return; }
    toast.success(product.active ? 'Product hidden' : 'Product visible');
    fetchProducts();
  }

  async function deleteProduct(product: Product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) { toast.error('Failed to delete product'); return; }
    toast.success('Product deleted');
    fetchProducts();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} products</p>
        </div>
        <Button variant="primary" rounded onClick={() => { setEditingProduct(null); setShowForm(true); }}>
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => { setShowForm(false); setEditingProduct(null); fetchProducts(); }}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 w-full rounded-2xl" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold">No Products Yet</h2>
          <p className="text-sm text-gray-500 mt-1">Add your first product to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => {
            const cover = product.product_images?.find((i) => i.is_cover) || product.product_images?.[0];
            const totalStock = product.product_variants?.reduce((s, v) => s + v.stock, 0) || 0;
            return (
              <div
                key={product.id}
                className={cn(
                  'bg-white rounded-2xl border p-4 flex gap-4 transition-all',
                  product.active ? 'border-gray-200' : 'border-gray-200 opacity-60'
                )}
              >
                <div className="w-16 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0 relative flex items-center justify-center">
                  <Package className="w-5 h-5 text-gray-300 absolute" />
                  {cover?.image_url && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={cover.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover relative z-10"
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-[#F85606]">
                      {formatPrice(product.sale_price || product.price)}
                    </span>
                    {product.sale_price && (
                      <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{product.product_images?.length || 0} images</span>
                    <span>·</span>
                    <span>{product.product_variants?.length || 0} variants</span>
                    <span>·</span>
                    <span>{totalStock} in stock</span>
                    <span>·</span>
                    <span className={product.active ? 'text-green-500' : 'text-gray-400'}>
                      {product.active ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleActive(product)} className="p-2 rounded-xl hover:bg-gray-50" title={product.active ? 'Hide' : 'Show'}>
                    {product.active ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                  </button>
                  <button onClick={() => { setEditingProduct(product); setShowForm(true); }} className="p-2 rounded-xl hover:bg-gray-50" title="Edit">
                    <Pencil className="w-4 h-4 text-gray-400" />
                  </button>
                  <button onClick={() => deleteProduct(product)} className="p-2 rounded-xl hover:bg-red-50" title="Delete">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ——— Product Create/Edit Form with Image Upload ——— */
function ProductForm({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<{ id?: string; url: string; is_cover: boolean }[]>(
    product?.product_images?.map(img => ({ id: img.id, url: img.image_url, is_cover: img.is_cover })) || []
  );
  const [form, setForm] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    material: product?.material || '',
    price: product?.price?.toString() || '',
    sale_price: product?.sale_price?.toString() || '',
  });

  // Variant state
  const [variants, setVariants] = useState<{ id?: string; size: string; color: string; stock: string }[]>(
    product?.product_variants?.map(v => ({ id: v.id, size: v.size || '', color: v.color || '', stock: v.stock.toString() })) || []
  );

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
  }

  function handleNameChange(name: string) {
    setForm((prev) => ({ ...prev, name, slug: product ? prev.slug : generateSlug(name) }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = `products/${fileName}`;

      const { error } = await supabase.storage.from('product-images').upload(filePath, file);
      if (error) {
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
      setImages(prev => [...prev, { url: urlData.publicUrl, is_cover: prev.length === 0 }]);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeImage(index: number) {
    setImages(prev => {
      const next = prev.filter((_, i) => i !== index);
      // If removed was cover, make first remaining the cover
      if (prev[index].is_cover && next.length > 0) next[0].is_cover = true;
      return next;
    });
  }

  function setCover(index: number) {
    setImages(prev => prev.map((img, i) => ({ ...img, is_cover: i === index })));
  }

  function addVariant() {
    setVariants(prev => [...prev, { size: '', color: '', stock: '0' }]);
  }

  function removeVariant(index: number) {
    setVariants(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.slug || !form.price) {
      toast.error('Name, slug, and price are required');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        material: form.material.trim() || null,
        price: parseFloat(form.price),
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
      };

      let productId = product?.id;

      if (product) {
        const { error } = await supabase.from('products').update(data).eq('id', product.id);
        if (error) throw error;
      } else {
        const { data: newProduct, error } = await supabase.from('products').insert(data).select('id').single();
        if (error) throw error;
        productId = newProduct.id;
      }

      // Save images
      if (productId) {
        // Delete old images and insert new ones
        await supabase.from('product_images').delete().eq('product_id', productId);
        if (images.length > 0) {
          const imageInserts = images.map((img, i) => ({
            product_id: productId,
            image_url: img.url,
            is_cover: img.is_cover,
            sort_order: i,
          }));
          await supabase.from('product_images').insert(imageInserts);
        }

        // Save variants
        await supabase.from('product_variants').delete().eq('product_id', productId);
        const validVariants = variants.filter(v => v.size || v.color);
        if (validVariants.length > 0) {
          const variantInserts = validVariants.map(v => ({
            product_id: productId,
            size: v.size || null,
            color: v.color || null,
            stock: parseInt(v.stock) || 0,
          }));
          await supabase.from('product_variants').insert(variantInserts);
        }
      }

      toast.success(product ? 'Product updated' : 'Product created');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-4 sm:pt-8 px-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border w-full max-w-lg shadow-2xl mb-8">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-semibold">{product ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onClose} className="p-2 -mr-2 rounded-xl hover:bg-gray-50"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Input label="Product Name *" required value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Elegant Silk Kurta" />
          <Input label="URL Slug *" required value={form.slug} onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="elegant-silk-kurta" hint="Used in the product URL" />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (NPR) *" required type="number" min="0" step="1" value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} placeholder="2500" />
            <Input label="Sale Price" type="number" min="0" step="1" value={form.sale_price} onChange={(e) => setForm(p => ({ ...p, sale_price: e.target.value }))} placeholder="Optional" />
          </div>

          <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the product..." />
          <Input label="Material" value={form.material} onChange={(e) => setForm(p => ({ ...p, material: e.target.value }))} placeholder="e.g. Pure Silk" />

          {/* ===== IMAGE UPLOAD ===== */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Product Images</label>
            <div className="flex flex-wrap gap-2">
              {images.map((img, i) => (
                <div key={i} className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 ${img.is_cover ? 'border-[#F85606]' : 'border-gray-200'}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                    <button type="button" onClick={() => removeImage(i)} className="p-1 bg-red-500 rounded-full">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  {!img.is_cover && (
                    <button type="button" onClick={() => setCover(i)} className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] text-center py-0.5">
                      Set Cover
                    </button>
                  )}
                  {img.is_cover && (
                    <span className="absolute top-0 left-0 bg-[#F85606] text-white text-[8px] px-1 py-0.5">Cover</span>
                  )}
                </div>
              ))}

              {/* Upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-[#F85606] hover:bg-orange-50 transition-colors"
                disabled={uploading}
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-[#F85606] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className="text-[9px] text-gray-400 mt-1">Upload</span>
                  </>
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            </div>
          </div>

          {/* ===== VARIANTS ===== */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600">Variants (Size/Color)</label>
              <button type="button" onClick={addVariant} className="text-xs text-[#F85606] font-semibold hover:underline">
                + Add Variant
              </button>
            </div>
            {variants.length > 0 && (
              <div className="space-y-2">
                {variants.map((v, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      value={v.size} onChange={(e) => setVariants(prev => prev.map((vr, vi) => vi === i ? { ...vr, size: e.target.value } : vr))}
                      placeholder="Size (S, M, L...)" className="flex-1 h-9 px-3 text-xs border border-gray-200 rounded-lg focus:border-[#F85606] outline-none"
                    />
                    <input
                      value={v.color} onChange={(e) => setVariants(prev => prev.map((vr, vi) => vi === i ? { ...vr, color: e.target.value } : vr))}
                      placeholder="Color" className="flex-1 h-9 px-3 text-xs border border-gray-200 rounded-lg focus:border-[#F85606] outline-none"
                    />
                    <input
                      type="number" min="0" value={v.stock} onChange={(e) => setVariants(prev => prev.map((vr, vi) => vi === i ? { ...vr, stock: e.target.value } : vr))}
                      placeholder="Stock" className="w-20 h-9 px-3 text-xs border border-gray-200 rounded-lg focus:border-[#F85606] outline-none"
                    />
                    <button type="button" onClick={() => removeVariant(i)} className="p-1.5 hover:bg-red-50 rounded-lg">
                      <X className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" variant="primary" rounded fullWidth isLoading={saving}>
              {product ? 'Save Changes' : 'Create Product'}
            </Button>
            <Button type="button" variant="ghost" rounded onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
