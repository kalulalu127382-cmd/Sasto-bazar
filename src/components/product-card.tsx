'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getDiscountPercent } from '@/lib/utils';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    sale_price: number | null;
    product_images: {
      image_url: string;
      is_cover: boolean;
      sort_order: number;
    }[];
  };
  variant?: 'default' | 'compact';
}

export function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const coverImage = product.product_images?.find((i) => i.is_cover) ||
    product.product_images?.sort((a, b) => a.sort_order - b.sort_order)[0];
  const imageUrl = coverImage?.image_url;
  const displayPrice = product.sale_price ?? product.price;
  const discount = product.sale_price ? getDiscountPercent(product.price, product.sale_price) : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="block bg-white hover:shadow-lg transition-all duration-200 group relative"
    >
      {/* Image */}
      <div className="relative bg-[#FAFAFA] overflow-hidden aspect-square">
        {imageUrl && !imgError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-300">
              <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-[10px] mt-1">No Image</p>
            </div>
          </div>
        )}

        {/* Discount badge — Daraz style: top-right orange */}
        {discount > 0 && (
          <div className="absolute top-0 right-0 bg-[#F85606] text-white text-[11px] font-bold px-2 py-1 rounded-bl">
            -{discount}%
          </div>
        )}
      </div>

      {/* Info — Daraz style */}
      <div className="p-2.5">
        {/* Product name — 2 lines max */}
        <h3 className="text-[12px] text-gray-800 leading-[1.3] line-clamp-2 min-h-[32px]" style={{ fontFamily: 'Arial, sans-serif' }}>
          {product.name}
        </h3>

        {/* Price — Daraz style: orange, bold */}
        <p className="text-[16px] font-bold text-[#F85606] mt-1.5" style={{ fontFamily: 'Arial, sans-serif' }}>
          Rs.{displayPrice.toLocaleString()}
        </p>

        {/* Original price + discount */}
        {product.sale_price && (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[12px] text-gray-400 line-through" style={{ fontFamily: 'Arial, sans-serif' }}>
              Rs.{product.price.toLocaleString()}
            </span>
            <span className="text-[12px] text-gray-500">
              -{discount}%
            </span>
          </div>
        )}


      </div>
    </Link>
  );
}
