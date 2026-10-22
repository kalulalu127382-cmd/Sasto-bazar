'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCartStore, type CartItem } from '@/lib/store/cart-store';
import { formatPrice } from '@/lib/utils';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const totalItems = useCartStore((s) => s.totalItems());
  const subtotal = useCartStore((s) => s.subtotal());

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white z-[70] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="font-serif text-lg font-semibold">Your Cart</h2>
                <span className="badge badge-primary">{totalItems}</span>
              </div>
              <button
                onClick={closeCart}
                className="p-2 -mr-2 rounded-xl hover:bg-bg-warm transition-colors"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
                  <div className="w-16 h-16 rounded-full bg-bg-warm flex items-center justify-center">
                    <ShoppingBag className="w-7 h-7 text-text-muted" />
                  </div>
                  <div>
                    <p className="font-medium text-text">Your cart is empty</p>
                    <p className="text-sm text-text-muted mt-1">Browse our collection and add items</p>
                  </div>
                  <Button variant="primary" rounded onClick={closeCart}>
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                items.map((item) => (
                  <CartItemRow
                    key={`${item.product_id}-${item.variant_id}`}
                    item={item}
                    onRemove={() => removeItem(item.product_id, item.variant_id)}
                    onUpdateQty={(qty) => updateQuantity(item.product_id, item.variant_id, qty)}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border-light px-5 py-5 space-y-4 bg-white">
                <div className="flex justify-between items-center">
                  <span className="font-sans text-sm text-text-secondary">Subtotal</span>
                  <span className="font-sans text-lg font-bold text-text">{formatPrice(subtotal)}</span>
                </div>
                <p className="text-xs text-text-muted">Delivery charge calculated at checkout</p>
                <Link href="/checkout" onClick={closeCart}>
                  <Button variant="primary" fullWidth rounded size="lg">
                    Checkout · {formatPrice(subtotal)}
                  </Button>
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function CartItemRow({
  item,
  onRemove,
  onUpdateQty,
}: {
  item: CartItem;
  onRemove: () => void;
  onUpdateQty: (qty: number) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 60 }}
      className="flex gap-3"
    >
      {/* Thumbnail */}
      <div className="w-20 h-24 rounded-xl bg-bg-warm overflow-hidden shrink-0">
        {item.image_url && !imgError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-text-muted/30" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
        <div>
          <h4 className="font-sans text-sm font-medium text-text leading-snug truncate">
            {item.name}
          </h4>
          {(item.size || item.color) && (
            <p className="text-xs text-text-muted mt-0.5">
              {[item.size, item.color].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="font-sans text-sm font-semibold text-text">
            {formatPrice(item.price * item.quantity)}
          </span>

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onUpdateQty(item.quantity - 1)}
              className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-bg-warm transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-7 text-center text-xs font-semibold">{item.quantity}</span>
            <button
              onClick={() => onUpdateQty(item.quantity + 1)}
              disabled={item.quantity >= item.stock}
              className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-bg-warm transition-colors disabled:opacity-30"
              aria-label="Increase quantity"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              onClick={onRemove}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-error hover:bg-error/5 transition-colors ml-1"
              aria-label="Remove item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
