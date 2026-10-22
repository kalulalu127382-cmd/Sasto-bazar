'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCartStore } from '@/lib/store/cart-store';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice, cn } from '@/lib/utils';
import {
  ShoppingBag, Upload, CheckCircle, AlertCircle,
  Tag, X, ChevronLeft, ImageIcon, Zap, Clock, Truck
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface PromoResult {
  valid: boolean;
  error?: string;
  promo_code_id?: string;
  code?: string;
  type?: 'FLAT' | 'PERCENT';
  value?: number;
  discount?: number;
  applies_to_delivery?: boolean;
}

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const clearCart = useCartStore((s) => s.clearCart);
  const supabase = createClient();

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  // Promo state
  const [promoCode, setPromoCode] = useState(searchParams.get('ref') || '');
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'half_pay'>('cod');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrLabel, setQrLabel] = useState<string>('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Computed
  const deliveryCharge = 110;
  const originalDeliveryCharge = 150;
  const discountAmount = promoResult?.valid ? (promoResult.discount || 0) : 0;
  const halfPayAmount = paymentMethod === 'half_pay' ? Math.ceil(subtotal / 2) : 0;
  const amountToPay = paymentMethod === 'cod' ? deliveryCharge : halfPayAmount + deliveryCharge;
  const total = Math.max(0, subtotal + deliveryCharge - discountAmount);
  const remainingOnDelivery = paymentMethod === 'half_pay'
    ? total - amountToPay + (discountAmount > 0 ? discountAmount : 0)
    : subtotal - discountAmount;

  // Auto-apply ref code
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && !promoResult) {
      setPromoCode(ref);
      handleApplyPromo(ref);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch QR image, label
  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase
        .from('store_settings')
        .select('key, value')
        .in('key', ['qr_image_url', 'qr_label', 'delivery_charge']);
      
      data?.forEach((s) => {
        if (s.key === 'qr_image_url' && s.value) setQrImageUrl(s.value);
        if (s.key === 'qr_label' && s.value) setQrLabel(s.value);
      });
    }
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        if (useCartStore.getState().items.length === 0) {
          router.push('/');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [items.length, router]);

  async function handleApplyPromo(code?: string) {
    const codeToApply = (code || promoCode).trim();
    if (!codeToApply) return;

    setPromoLoading(true);
    try {
      const { data, error } = await supabase.rpc('validate_promo_code', {
        p_code: codeToApply,
        p_subtotal: subtotal,
      });

      if (error) throw error;
      setPromoResult(data as unknown as PromoResult);
      if ((data as unknown as PromoResult).valid) {
        toast.success(`Code "${codeToApply.toUpperCase()}" applied!`);
      }
    } catch {
      setPromoResult({ valid: false, error: 'Unable to validate code' });
    } finally {
      setPromoLoading(false);
    }
  }

  function handleRemovePromo() {
    setPromoCode('');
    setPromoResult(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WebP image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Name is required';
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^(98|97|96)\d{8}$/.test(phone.replace(/\D/g, '')))
      newErrors.phone = 'Enter a valid Nepali phone number';
    if (!address.trim()) newErrors.address = 'Address is required';
    if (!city.trim()) newErrors.city = 'City is required';
    if (!screenshotFile) newErrors.screenshot = 'Payment screenshot is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // 1. Upload payment screenshot
      let screenshotUrl = '';
      if (screenshotFile) {
        const ext = screenshotFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('payment-screenshots')
          .upload(fileName, screenshotFile);

        if (uploadError) throw new Error('Failed to upload payment screenshot');
        screenshotUrl = fileName;
      }

      // 2. Place order via server function
      const orderItems = items.map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id || '',
        product_name_snapshot: item.name,
        size_snapshot: item.size || '',
        color_snapshot: item.color || '',
        unit_price: item.price,
        quantity: item.quantity,
        line_total: item.price * item.quantity,
      }));

      const utmSource = searchParams.get('utm_source') || undefined;
      const utmMedium = searchParams.get('utm_medium') || undefined;
      const utmCampaign = searchParams.get('utm_campaign') || undefined;

      const { data, error } = await supabase.rpc('place_order', {
        p_customer_name: name.trim(),
        p_phone: phone.replace(/\D/g, ''),
        p_address: address.trim(),
        p_city: city.trim(),
        p_subtotal: subtotal,
        p_delivery_charge: deliveryCharge,
        p_promo_code_id: promoResult?.valid ? promoResult.promo_code_id : undefined,
        p_discount_amount: discountAmount,
        p_total: total,
        p_payment_screenshot_url: screenshotUrl || undefined,
        p_utm_source: utmSource,
        p_utm_medium: utmMedium,
        p_utm_campaign: utmCampaign,
        p_items: orderItems,
        p_payment_method: paymentMethod,
        p_amount_paid: amountToPay,
        p_amount_remaining: Math.max(0, remainingOnDelivery),
      });

      if (error) {
        console.error('RPC error:', error);
        throw error;
      }

      const result = data as { success: boolean; order_number: string; tracking_token: string };

      // 3. Clear cart and redirect
      clearCart();
      router.push(`/order-confirmed?order=${result.order_number}&token=${result.tracking_token}`);
    } catch (err: any) {
      console.error('Order placement error:', err);
      toast.error(err?.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="content-container section-gap text-center">
        <ShoppingBag className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <h1 className="font-serif text-2xl font-bold">Your cart is empty</h1>
        <p className="text-text-muted mt-2">Add some items before checking out</p>
        <Link href="/products">
          <Button variant="primary" rounded className="mt-6">Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="content-container py-6 pb-12">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to shop
      </Link>

      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-text mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ——— ORDER SUMMARY ——— */}
        <section className="bg-white rounded-2xl border border-border-light p-5 space-y-4">
          <h2 className="font-sans text-sm font-bold text-text uppercase tracking-wider">Order Summary</h2>
          <div className="divide-y divide-border-light">
            {items.map((item) => (
              <div key={`${item.product_id}-${item.variant_id}`} className="flex gap-3 py-3">
                <div className="w-14 h-18 rounded-xl bg-bg-warm overflow-hidden shrink-0 relative flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-text-muted/30 absolute" />
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
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm font-medium text-text truncate">{item.name}</p>
                  <p className="font-sans text-xs text-text-muted mt-0.5">
                    {[item.size, item.color].filter(Boolean).join(' · ')} × {item.quantity}
                  </p>
                </div>
                <p className="font-sans text-sm font-semibold text-text shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ——— DELIVERY DETAILS ——— */}
        <section className="bg-white rounded-2xl border border-border-light p-5 space-y-4">
          <h2 className="font-sans text-sm font-bold text-text uppercase tracking-wider">Delivery Details</h2>
          <div className="grid gap-4">
            <Input
              label="Full Name"
              required
              placeholder="e.g. Sita Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
            <Input
              label="Phone Number"
              required
              type="tel"
              placeholder="98XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={errors.phone}
              hint="We'll use this for delivery updates"
            />
            <Input
              label="Delivery Address"
              required
              placeholder="Street, landmark, house no."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              error={errors.address}
            />
            <Input
              label="City / Area"
              required
              placeholder="e.g. Biratnagar, Kathmandu"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              error={errors.city}
            />
          </div>
        </section>

        {/* ——— PROMO CODE ——— */}
        <section className="bg-white rounded-2xl border border-border-light p-5 space-y-4">
          <h2 className="font-sans text-sm font-bold text-text uppercase tracking-wider">Promo Code</h2>

          {promoResult?.valid ? (
            <div className="flex items-center justify-between bg-success/5 border border-success/20 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="font-sans text-sm font-semibold text-success">
                  {promoResult.code} — {formatPrice(discountAmount)} off
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemovePromo}
                className="p-1 hover:bg-black/5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Enter code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-white text-sm font-sans font-medium uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleApplyPromo()}
                isLoading={promoLoading}
                disabled={!promoCode.trim()}
              >
                Apply
              </Button>
            </div>
          )}

          {promoResult && !promoResult.valid && (
            <div className="flex items-center gap-2 text-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="font-sans text-xs font-medium">{promoResult.error}</p>
            </div>
          )}
        </section>

        {/* ——— PAYMENT METHOD SELECTION ——— */}
        <section className="bg-white rounded-2xl border border-border-light p-5 space-y-5">
          <h2 className="font-sans text-sm font-bold text-text uppercase tracking-wider">Choose Payment Method</h2>

          <div className="grid gap-3">
            {/* Option 1: Cash on Delivery */}
            <button
              type="button"
              onClick={() => { setPaymentMethod('cod'); setScreenshotFile(null); setScreenshotPreview(null); }}
              className={cn(
                'w-full text-left rounded-xl border-2 p-4 transition-all',
                paymentMethod === 'cod'
                  ? 'border-[#F85606] bg-orange-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center',
                  paymentMethod === 'cod' ? 'border-[#F85606]' : 'border-gray-300'
                )}>
                  {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-[#F85606]" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#F85606]" />
                    <span className="font-bold text-sm text-gray-900">Cash on Delivery</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Pay <span className="font-bold text-[#F85606]">Rs.110</span> delivery charge via QR</p>
                  <div className="flex items-center gap-1.5 mt-2 bg-blue-50 px-2.5 py-1 rounded-lg w-fit">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[11px] font-semibold text-blue-700">Delivery within 7 days</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Option 2: Half Pay + Delivery */}
            <button
              type="button"
              onClick={() => setPaymentMethod('half_pay')}
              className={cn(
                'w-full text-left rounded-xl border-2 p-4 transition-all',
                paymentMethod === 'half_pay'
                  ? 'border-[#F85606] bg-orange-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center',
                  paymentMethod === 'half_pay' ? 'border-[#F85606]' : 'border-gray-300'
                )}>
                  {paymentMethod === 'half_pay' && <div className="w-2.5 h-2.5 rounded-full bg-[#F85606]" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#F85606]" />
                    <span className="font-bold text-sm text-gray-900">Half Pay + Delivery</span>
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded">FAST</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Pay <span className="font-bold text-[#F85606]">{formatPrice(halfPayAmount > 0 ? halfPayAmount + deliveryCharge : Math.ceil(subtotal / 2) + deliveryCharge)}</span> now (half price + Rs.110 delivery)</p>
                  <div className="flex items-center gap-1.5 mt-2 bg-green-50 px-2.5 py-1 rounded-lg w-fit">
                    <Zap className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-[11px] font-semibold text-green-700">Priority delivery within 24 hours</span>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* ——— PAYMENT SUMMARY ——— */}
        <section className="bg-white rounded-2xl border border-border-light p-5 space-y-5">
          <h2 className="font-sans text-sm font-bold text-text uppercase tracking-wider">Payment Summary</h2>

          {/* Price breakdown */}
          <div className="space-y-2.5">
            <div className="flex justify-between font-sans text-sm">
              <span className="text-text-secondary">Subtotal</span>
              <span className="font-medium text-text">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between font-sans text-sm">
              <span className="text-text-secondary">Delivery Charge</span>
              <span className="font-medium text-text">
                <span className="line-through text-gray-400 text-xs mr-1.5">Rs.{originalDeliveryCharge}</span>
                <span className="text-green-600">{formatPrice(deliveryCharge)}</span>
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between font-sans text-sm">
                <span className="text-success">Discount</span>
                <span className="font-medium text-success">-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-sans text-sm pt-2 border-t border-border-light">
              <span className="text-text-secondary">Order Total</span>
              <span className="font-medium text-text">{formatPrice(total)}</span>
            </div>

            {/* Pay Now vs Pay on Delivery */}
            <div className="bg-orange-50 rounded-xl p-3 space-y-2">
              <div className="flex justify-between font-sans text-sm">
                <span className="font-semibold text-[#F85606]">💰 Pay Now</span>
                <span className="font-bold text-[#F85606] text-base">{formatPrice(amountToPay)}</span>
              </div>
              <div className="flex justify-between font-sans text-xs text-gray-500">
                <span>{paymentMethod === 'cod' ? 'Pay on delivery' : 'Remaining on delivery'}</span>
                <span className="font-medium">{formatPrice(Math.max(0, remainingOnDelivery))}</span>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5 text-center space-y-3">
            <p className="font-sans text-base font-bold text-gray-900">
              {paymentMethod === 'cod' ? '🚚' : '💳'} Pay <span className="text-[#F85606] text-lg">{formatPrice(amountToPay)}</span> {paymentMethod === 'cod' ? 'Delivery Charge' : 'using QR'}
            </p>
            {paymentMethod === 'cod' && (
              <p className="text-[11px] text-gray-500">Pay delivery charge to confirm your order</p>
            )}
            {qrImageUrl ? (
              <div className={cn(
                "relative mx-auto bg-white rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm",
                paymentMethod === 'cod' ? 'w-44 h-44' : 'w-52 h-52'
              )}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrImageUrl} alt="Payment QR Code" className="w-full h-full object-contain p-2" />
              </div>
            ) : (
              <div className={cn(
                "mx-auto bg-white rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center",
                paymentMethod === 'cod' ? 'w-44 h-44' : 'w-52 h-52'
              )}>
                <p className="text-xs text-gray-400">QR code not configured yet</p>
              </div>
            )}
            {qrLabel && (
              <p className="text-xs font-semibold text-gray-600">{qrLabel}</p>
            )}
            <p className="text-[11px] text-gray-500">Scan with eSewa, Khalti, or your banking app</p>
          </div>

          {/* Screenshot Upload */}
          <div className="space-y-2">
            <label className="font-sans text-sm font-semibold text-text block">
              Upload Payment Screenshot <span className="text-error">*</span>
            </label>
            {screenshotPreview ? (
              <div className="relative w-full max-w-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={screenshotPreview} alt="Payment screenshot" className="w-full max-h-[400px] rounded-xl border border-border object-contain" />
                <button type="button" onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); }} className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className={cn('flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed transition-colors cursor-pointer', errors.screenshot ? 'border-error/40 bg-error/5' : 'border-border hover:border-primary/40 hover:bg-primary/5')}>
                <Upload className="w-8 h-8 text-text-muted mb-2" />
                <span className="font-sans text-sm font-medium text-text">Tap to upload</span>
                <span className="font-sans text-xs text-text-muted mt-1">JPG, PNG or WebP (max 5MB)</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
              </label>
            )}
            {errors.screenshot && (
              <p className="text-xs text-error font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.screenshot}
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
            <p className="text-xs text-blue-700 font-medium">💰 Pay remaining <span className="font-bold">{formatPrice(Math.max(0, remainingOnDelivery))}</span> when your order arrives</p>
          </div>
        </section>

        {/* ——— SUBMIT ——— */}
        <Button
          type="submit"
          variant="primary"
          fullWidth
          rounded
          size="xl"
          isLoading={submitting}
          disabled={items.length === 0}
        >
          {paymentMethod === 'cod' ? `Place Order — Cash on Delivery` : `Pay ${formatPrice(amountToPay)} & Place Order`}
        </Button>
      </form>
    </div>
  );
}
