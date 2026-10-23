import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/product-card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop All',
  description: 'Browse our full collection of curated fashion — kurtas, sarees, and more.',
};

import { FALLBACK_PRODUCTS } from '@/lib/constants/fallback-data';

export const revalidate = 60;

async function getAllProducts() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        price,
        sale_price,
        product_images (
          image_url,
          alt_text,
          is_cover
        )
      `)
      .eq('active', true)
      .order('created_at', { ascending: false });

    return (data && data.length > 0) ? data : (FALLBACK_PRODUCTS as any);
  } catch {
    return FALLBACK_PRODUCTS as any;
  }
}

export default async function ProductsPage() {
  const products = await getAllProducts();

  return (
    <div className="content-container section-gap">
      {/* Page header */}
      <div className="mb-8">
        <span className="font-sans text-xs font-semibold text-accent uppercase tracking-widest">Browse</span>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-sans">All Products</h1>
        <p className="mt-1 text-sm text-gray-500 font-sans">
          Browse our clothing collection
        </p>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="font-sans text-sm text-gray-500">
          {products.length} {products.length === 1 ? 'item' : 'items'} found
        </p>
      </div>

      {/* Product Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-0 bg-white rounded-lg shadow-sm overflow-hidden">
          {products.map((product: any) => (
            <div key={product.id} className="border-r border-b border-gray-100">
              <ProductCard product={product as any} variant="compact" />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-full bg-bg-warm flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <h2 className="font-serif text-lg font-semibold text-text">Coming Soon</h2>
          <p className="text-sm text-text-muted mt-1">New products will be available shortly</p>
        </div>
      )}
    </div>
  );
}
