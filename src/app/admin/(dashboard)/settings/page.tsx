'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Store, Truck, CreditCard, Phone, Upload, X, QrCode } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface SettingsMap { [key: string]: string; }

const DEFAULT_SETTINGS: SettingsMap = {
  store_name: 'Sasto Bazar',
  store_tagline: "Nepal's Fashion Destination",
  store_phone: '+977-XXXXXXXXXX',
  store_email: 'info@sastobazar.com',
  store_address: 'Biratnagar, Hatkhola Chowk, Nepal',
  delivery_charge: '110',
  free_delivery_min: '2000',
  show_free_delivery: 'false',
  delivery_areas: 'Nationwide (Nepal)',
  payment_methods: 'eSewa QR, Khalti, Bank Transfer, Cash on Delivery',
  esewa_id: '',
  khalti_id: '',
  bank_name: '',
  bank_account: '',
  qr_image_url: '',
  qr_label: 'Kumari Bank Limited',
  announcement_text: 'Sasto Bazar | Biratnagar & Nationwide Delivery',
  flash_sale_hours: '24',
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsMap>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const qrFileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => { fetchSettings(); }, []);

  async function fetchSettings() {
    setLoading(true);
    const { data } = await supabase.from('store_settings').select('key, value');
    if (data) {
      const map: SettingsMap = { ...DEFAULT_SETTINGS };
      data.forEach((row: { key: string; value: string }) => { map[row.key] = row.value; });
      setSettings(map);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const upserts = Object.entries(settings).map(([key, value]) => ({
      key, value, updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('store_settings').upsert(upserts, { onConflict: 'key' });
    setSaving(false);
    if (!error) {
      setSaved(true);
      toast.success('Settings saved!');
      setTimeout(() => setSaved(false), 3000);
    } else {
      toast.error('Failed to save settings');
    }
  }

  async function handleQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingQr(true);

    const ext = file.name.split('.').pop();
    const fileName = `qr-${Date.now()}.${ext}`;

    // Delete old QR if exists
    if (settings.qr_image_url) {
      const oldKey = settings.qr_image_url.split('/qr-code/')[1] || settings.qr_image_url.split('/payment-qr/')[1];
      if (oldKey) {
        await supabase.storage.from('qr-code').remove([oldKey]);
        await supabase.storage.from('payment-qr').remove([oldKey]);
      }
    }

    const { error } = await supabase.storage.from('qr-code').upload(fileName, file);
    if (error) {
      toast.error('Failed to upload QR code: ' + error.message);
      setUploadingQr(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('qr-code').getPublicUrl(fileName);
    update('qr_image_url', urlData.publicUrl);
    setUploadingQr(false);
    toast.success('QR code uploaded! Click "Save All" to apply.');
    if (qrFileRef.current) qrFileRef.current.value = '';
  }

  function removeQr() {
    update('qr_image_url', '');
    toast.success('QR removed. Click "Save All" to apply.');
  }

  function update(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage store, delivery, payment & QR codes</p>
        </div>
        <Button variant="primary" rounded onClick={handleSave} isLoading={saving}>
          <Save className="w-4 h-4" />
          {saved ? 'Saved ✓' : 'Save All'}
        </Button>
      </div>

      {/* Store Info */}
      <Section title="Store Information" icon={<Store className="w-4 h-4" />}>
        <Input label="Store Name" value={settings.store_name} onChange={(e) => update('store_name', e.target.value)} />
        <Input label="Tagline" value={settings.store_tagline} onChange={(e) => update('store_tagline', e.target.value)} />
        <Input label="Announcement Bar" value={settings.announcement_text} onChange={(e) => update('announcement_text', e.target.value)} hint="Shows on top of the website" />
      </Section>

      {/* Contact */}
      <Section title="Contact" icon={<Phone className="w-4 h-4" />}>
        <Input label="Phone Number" value={settings.store_phone} onChange={(e) => update('store_phone', e.target.value)} />
        <Input label="Email" value={settings.store_email} onChange={(e) => update('store_email', e.target.value)} />
        <Input label="Address" value={settings.store_address} onChange={(e) => update('store_address', e.target.value)} />
      </Section>

      {/* Delivery */}
      <Section title="Delivery" icon={<Truck className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Delivery Charge (Rs.)" type="number" value={settings.delivery_charge} onChange={(e) => update('delivery_charge', e.target.value)} />
          <Input label="Free Delivery Min (Rs.)" type="number" value={settings.free_delivery_min} onChange={(e) => update('free_delivery_min', e.target.value)} />
        </div>
        <Input label="Delivery Areas" value={settings.delivery_areas} onChange={(e) => update('delivery_areas', e.target.value)} />

        {/* Free Delivery Toggle */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 mt-2">
          <div>
            <p className="text-sm font-semibold text-gray-800">Show "Free Delivery" badge</p>
            <p className="text-xs text-gray-500">Display on product cards when order qualifies</p>
          </div>
          <button
            type="button"
            onClick={() => update('show_free_delivery', settings.show_free_delivery === 'true' ? 'false' : 'true')}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              settings.show_free_delivery === 'true' ? 'bg-[#F85606]' : 'bg-gray-300'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              settings.show_free_delivery === 'true' ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </Section>

      {/* QR Code — Main feature */}
      <Section title="Payment QR Code" icon={<QrCode className="w-4 h-4" />}>
        <div className="flex items-start gap-4">
          {settings.qr_image_url ? (
            <div className="relative">
              <div className="w-40 h-40 rounded-xl border-2 border-gray-200 overflow-hidden bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={settings.qr_image_url} alt="Payment QR" className="w-full h-full object-contain p-2" />
              </div>
              <button
                type="button"
                onClick={removeQr}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="w-40 h-40 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <QrCode className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-[10px] text-gray-400 mt-1">No QR uploaded</p>
              </div>
            </div>
          )}

          <div className="flex-1 space-y-3">
            <button
              type="button"
              onClick={() => qrFileRef.current?.click()}
              disabled={uploadingQr}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:border-[#F85606] hover:text-[#F85606] transition-colors w-full justify-center"
            >
              {uploadingQr ? (
                <div className="w-4 h-4 border-2 border-[#F85606] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {settings.qr_image_url ? 'Change QR Code' : 'Upload QR Code'}
            </button>
            <input ref={qrFileRef} type="file" accept="image/*" className="hidden" onChange={handleQrUpload} />

            <Input label="QR Label" value={settings.qr_label} onChange={(e) => update('qr_label', e.target.value)} placeholder="e.g. Kumari Bank Limited" hint="Shows below QR on checkout" />

            <p className="text-[10px] text-gray-400">Upload your bank/eSewa/Khalti QR code. Customers will see this on the checkout page to scan and pay.</p>
          </div>
        </div>
      </Section>

      {/* Payment Methods */}
      <Section title="Payment Methods" icon={<CreditCard className="w-4 h-4" />}>
        <Input label="Accepted Methods" value={settings.payment_methods} onChange={(e) => update('payment_methods', e.target.value)} hint="Comma-separated" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="eSewa ID" value={settings.esewa_id} onChange={(e) => update('esewa_id', e.target.value)} placeholder="9XXXXXXXXX" />
          <Input label="Khalti ID" value={settings.khalti_id} onChange={(e) => update('khalti_id', e.target.value)} placeholder="9XXXXXXXXX" />
        </div>
        <Input label="Bank Name" value={settings.bank_name} onChange={(e) => update('bank_name', e.target.value)} />
        <Input label="Bank Account Number" value={settings.bank_account} onChange={(e) => update('bank_account', e.target.value)} />
      </Section>

      {/* Flash Sale */}
      <Section title="Flash Sale" icon={<span className="text-sm">⚡</span>}>
        <Input label="Flash Sale Duration (hours)" type="number" value={settings.flash_sale_hours} onChange={(e) => update('flash_sale_hours', e.target.value)} />
      </Section>

      <div className="pb-8">
        <Button variant="primary" rounded fullWidth onClick={handleSave} isLoading={saving} size="lg">
          <Save className="w-4 h-4" />
          {saved ? 'All Settings Saved ✓' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border p-5 space-y-4">
      <div className="flex items-center gap-2 text-gray-700">
        {icon}
        <h2 className="text-sm font-bold uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </div>
  );
}
