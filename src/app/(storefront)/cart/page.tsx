'use client';

import { useCartStore } from '@/lib/store/cart-store';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  if (items.length === 0) {
    return (
      <div className="content-container section-gap text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-full bg-bg-warm flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-7 h-7 text-text-muted" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-text">Your Cart is Empty</h1>
          <p className="text-sm text-text-muted mt-2">Browse our collection and add items you love</p>
          <Link href="/products">
            <Button variant="primary" rounded className="mt-6">Browse Collection</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="content-container py-6 pb-12">
      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-text mb-6">Your Cart</h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={`${item.product_id}-${item.variant_id}`}
            className="bg-white rounded-2xl border border-border-light p-4 flex gap-4"
          >
            {/* Thumbnail */}
            <div className="w-20 h-24 rounded-xl bg-bg-warm overflow-hidden shrink-0 relative flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-text-muted/30 absolute" />
              {item.image_url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover relative z-10"
                  onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
              <div>
                <Link href={`/products/${item.slug}`} className="font-sans text-sm font-medium text-text hover:text-primary transition-colors truncate block">
                  {item.name}
                </Link>
                {(item.size || item.color) && (
                  <p className="text-xs text-text-muted mt-0.5">
                    {[item.size, item.color].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between mt-3">
                <span className="font-sans text-sm font-bold text-text">
                  {formatPrice(item.price * item.quantity)}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-bg-warm transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-bg-warm transition-colors disabled:opacity-30"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeItem(item.product_id, item.variant_id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-error hover:bg-error/5 transition-colors ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-8 bg-white rounded-2xl border border-border-light p-5 space-y-4">
        <div className="flex justify-between font-sans text-sm">
          <span className="text-text-secondary">Subtotal</span>
          <span className="font-semibold text-text">{formatPrice(subtotal)}</span>
        </div>
        <p className="text-xs text-text-muted">Delivery charge calculated at checkout</p>
        <Link href="/checkout">
          <Button variant="primary" fullWidth rounded size="xl">
            Proceed to Checkout · {formatPrice(subtotal)}
          </Button>
        </Link>
      </div>
    </div>
  );
}
