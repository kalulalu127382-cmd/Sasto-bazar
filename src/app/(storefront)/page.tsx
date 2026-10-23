import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/product-card';
import Link from 'next/link';
import { BannerSlider } from '@/components/banner-slider';
import { FlashSaleTimer } from '@/components/flash-sale-timer';
import { CategoryStrip } from '@/components/category-strip';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sasto Bazar — Nepal\'s Affordable Fashion Destination',
  description: 'Shop kurtas, sarees, lehengas, western wear and more. Best prices, QR payment, nationwide delivery.',
};

export const revalidate = 60;

import { FALLBACK_PRODUCTS } from '@/lib/constants/fallback-data';

async function getHomeData() {
  try {
    const supabase = await createClient();

    const [
      { data: banners },
      { data: allProducts },
      { data: saleProducts },
      { data: newArrivals },
    ] = await Promise.all([
      supabase
        .from('banners')
        .select('*')
        .eq('active', true)
        .order('sort_order'),
      supabase
        .from('products')
        .select(`id, name, slug, price, sale_price, active,
          product_images (image_url, is_cover, sort_order)`)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(24),
      supabase
        .from('products')
        .select(`id, name, slug, price, sale_price, active,
          product_images (image_url, is_cover, sort_order)`)
        .eq('active', true)
        .not('sale_price', 'is', null)
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('products')
        .select(`id, name, slug, price, sale_price, active,
          product_images (image_url, is_cover, sort_order)`)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(8),
    ]);

    const hasProducts = allProducts && allProducts.length > 0;

    return {
      banners: banners || [],
      allProducts: hasProducts ? allProducts : (FALLBACK_PRODUCTS as any),
      saleProducts: (saleProducts && saleProducts.length > 0) ? saleProducts : (FALLBACK_PRODUCTS.slice(0, 4) as any),
      newArrivals: (newArrivals && newArrivals.length > 0) ? newArrivals : (FALLBACK_PRODUCTS.slice(0, 4) as any),
    };
  } catch (error) {
    // If Supabase is offline/paused, return instant fallback data so the page loads in 0.1s
    return {
      banners: [],
      allProducts: FALLBACK_PRODUCTS as any,
      saleProducts: FALLBACK_PRODUCTS.slice(0, 4) as any,
      newArrivals: FALLBACK_PRODUCTS.slice(0, 4) as any,
    };
  }
}

export default async function HomePage() {
  const { banners, allProducts, saleProducts, newArrivals } = await getHomeData();

  return (
    <div className="min-h-screen bg-[#EFEFEF]">
      {/* Banner Slider — from database */}
      <BannerSlider banners={banners as any} />

      {/* Category Strip */}
      <CategoryStrip />

      {/* ===== FLASH SALE ===== */}
      {saleProducts.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-3 sm:px-4 mt-3">
          <div className="bg-white rounded shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-[#F85606] text-base sm:text-lg">⚡</span>
                <h2 className="text-[14px] sm:text-[16px] font-bold text-gray-900" style={{ fontFamily: 'Arial, sans-serif' }}>
                  Flash Sale
                </h2>
                <FlashSaleTimer />
              </div>
              <Link href="/products?sale=true" className="text-[#F85606] text-[12px] sm:text-[13px] font-semibold hover:underline">
                SHOP ALL →
              </Link>
            </div>
            <div className="flex overflow-x-auto scrollbar-hide">
              {saleProducts.map((product: any) => (
                <div key={product.id} className="min-w-[140px] sm:min-w-[180px] md:min-w-[200px] border-r border-gray-100 last:border-r-0 shrink-0">
                  <ProductCard product={product as any} variant="compact" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== NEW ARRIVALS ===== */}
      {newArrivals.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-3 sm:px-4 mt-3">
          <div className="bg-white rounded shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-gray-100">
              <h2 className="text-[14px] sm:text-[16px] font-bold text-gray-900" style={{ fontFamily: 'Arial, sans-serif' }}>
                New Arrivals
              </h2>
              <Link href="/products?sort=newest" className="text-[#F85606] text-[12px] sm:text-[13px] font-semibold hover:underline">
                VIEW ALL →
              </Link>
            </div>
            <div className="flex overflow-x-auto scrollbar-hide">
              {newArrivals.map((product: any) => (
                <div key={product.id} className="min-w-[140px] sm:min-w-[180px] md:min-w-[200px] border-r border-gray-100 last:border-r-0 shrink-0">
                  <ProductCard product={product as any} variant="compact" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== TRUST & SOCIAL PROOF ===== */}
      <section className="max-w-[1200px] mx-auto px-3 sm:px-4 mt-3">
        {/* Live customers strip */}
        <div className="bg-gradient-to-r from-[#F85606] to-[#FF7A3D] rounded-t-lg px-4 py-2.5 flex items-center justify-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
          </span>
          <p className="text-white text-xs sm:text-sm font-medium">
            <span className="font-bold">127+ customers</span> shopping right now • <span className="font-bold">2,500+</span> orders delivered across Nepal
          </p>
        </div>
        {/* Trust badges */}
        <div className="bg-white rounded-b-lg shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
            <TrustItem icon="🔒" title="100% Secure" desc="Payment Protected" />
            <TrustItem icon="🚚" title="Nationwide" desc="All Nepal Delivery" />
            <TrustItem icon="↩️" title="Easy Returns" desc="7 Day Return Policy" />
            <TrustItem icon="⭐" title="4.8 Rating" desc="500+ Happy Customers" />
          </div>
        </div>
      </section>

      {/* ===== JUST FOR YOU ===== */}
      <section className="max-w-[1200px] mx-auto px-3 sm:px-4 mt-3 pb-8">
        <div className="bg-white rounded shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-gray-100">
            <h2 className="text-[14px] sm:text-[16px] font-bold text-gray-900" style={{ fontFamily: 'Arial, sans-serif' }}>
              Just For You
            </h2>
            <Link href="/products" className="text-[#F85606] text-[12px] sm:text-[13px] font-semibold hover:underline">
              VIEW ALL →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {allProducts.map((product: any) => (
              <div key={product.id} className="border-r border-b border-gray-100">
                <ProductCard product={product as any} variant="compact" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DELIVERY SPEED PROMO ===== */}
      <section className="max-w-[1200px] mx-auto px-3 sm:px-4 mt-3 pb-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-[14px] sm:text-[16px] font-bold text-gray-900" style={{ fontFamily: 'Arial, sans-serif' }}>
              🚀 Faster Delivery, Your Choice
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {/* COD option */}
            <div className="p-4 sm:p-6 border-b sm:border-b-0 sm:border-r border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-lg">🚚</div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Cash on Delivery</h3>
                  <p className="text-[10px] text-gray-500">Standard shipping</p>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 mb-3">
                <p className="text-2xl font-black text-blue-700">7 Days</p>
                <p className="text-xs text-blue-600 mt-0.5">Delivery time</p>
              </div>
              <ul className="space-y-1.5 text-xs text-gray-600">
                <li className="flex items-center gap-1.5">✅ Pay only <span className="font-bold text-[#F85606]">Rs.110</span> now</li>
                <li className="flex items-center gap-1.5">✅ Pay remaining on delivery</li>
                <li className="flex items-center gap-1.5">✅ <span className="line-through text-gray-400">Rs.150</span> → <span className="text-green-600 font-bold">Rs.110</span> delivery discount</li>
              </ul>
            </div>

            {/* Half Pay option */}
            <div className="p-4 sm:p-6 relative overflow-hidden">
              <div className="absolute top-2 right-2 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded">RECOMMENDED</div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-lg">⚡</div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Half Pay + Delivery</h3>
                  <p className="text-[10px] text-gray-500">Priority express</p>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 mb-3">
                <p className="text-2xl font-black text-green-700">24 Hours</p>
                <p className="text-xs text-green-600 mt-0.5">Express delivery! ⚡</p>
              </div>
              <ul className="space-y-1.5 text-xs text-gray-600">
                <li className="flex items-center gap-1.5">✅ Pay half price + <span className="font-bold text-[#F85606]">Rs.110</span> now</li>
                <li className="flex items-center gap-1.5">✅ Get your order in <span className="font-bold text-green-600">24 hours!</span></li>
                <li className="flex items-center gap-1.5">✅ Pay remaining on delivery</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function TrustItem({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center py-3 sm:py-4 gap-1">
      <span className="text-lg sm:text-xl">{icon}</span>
      <p className="text-[11px] sm:text-xs font-bold text-gray-800">{title}</p>
      <p className="text-[9px] sm:text-[10px] text-gray-500">{desc}</p>
    </div>
  );
}
