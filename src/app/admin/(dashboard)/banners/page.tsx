'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Upload, Clock, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cta_text: string;
  cta_link: string;
  bg_color: string;
  bg_gradient: string | null;
  text_color: string;
  image_url: string | null;
  sort_order: number;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  show_timer: boolean;
  offer_label: string | null;
}

const PRESET_GRADIENTS = [
  { name: 'Orange Fire', value: 'linear-gradient(135deg, #F85606 0%, #FF2D00 50%, #D94400 100%)' },
  { name: 'Deep Night', value: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)' },
  { name: 'Green Fresh', value: 'linear-gradient(135deg, #00A650 0%, #00C853 50%, #009624 100%)' },
  { name: 'Purple Dream', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Pink Passion', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: 'Gold Luxury', value: 'linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)' },
  { name: 'Ocean Blue', value: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)' },
  { name: 'Solid Orange', value: '' },
];

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const supabase = createClient();

  useEffect(() => { fetchBanners(); }, []);

  async function fetchBanners() {
    setLoading(true);
    const { data } = await supabase.from('banners').select('*').order('sort_order');
    setBanners((data || []) as Banner[]);
    setLoading(false);
  }

  async function toggleActive(banner: Banner) {
    await supabase.from('banners').update({ active: !banner.active }).eq('id', banner.id);
    toast.success(banner.active ? 'Banner hidden' : 'Banner visible');
    fetchBanners();
  }

  async function deleteBanner(banner: Banner) {
    if (!confirm(`Delete banner "${banner.title}"?`)) return;
    await supabase.from('banners').delete().eq('id', banner.id);
    toast.success('Banner deleted');
    fetchBanners();
  }

  function formatDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Banners</h1>
          <p className="text-sm text-gray-500 mt-1">Manage homepage carousel — upload images, schedule offers, add timers</p>
        </div>
        <Button variant="primary" rounded onClick={() => { setEditingBanner(null); setShowForm(true); }}>
          <Plus className="w-4 h-4" /> Add Banner
        </Button>
      </div>

      {showForm && (
        <BannerForm
          banner={editingBanner}
          onClose={() => { setShowForm(false); setEditingBanner(null); fetchBanners(); }}
        />
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-28 w-full rounded-2xl" />)}</div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold">No Banners</h2>
          <p className="text-sm text-gray-500 mt-1">Add your first banner to the homepage carousel</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => (
            <div key={banner.id} className={`bg-white rounded-2xl border p-4 flex gap-4 transition-all ${!banner.active ? 'opacity-50' : ''}`}>
              {/* Preview */}
              <div
                className="w-36 h-24 rounded-xl shrink-0 overflow-hidden relative flex items-center justify-center"
                style={{ background: banner.bg_gradient || banner.bg_color || '#F85606' }}
              >
                <span className="text-white text-xs font-bold text-center px-2 absolute z-0">{banner.title}</span>
                {banner.image_url && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-full object-cover relative z-10"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                )}
                {banner.show_timer && (
                  <span className="absolute top-1 right-1 z-20 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded font-bold">⏱ TIMER</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">{banner.title}</h3>
                <p className="text-xs text-gray-500 truncate">{banner.subtitle || 'No subtitle'}</p>
                {banner.offer_label && (
                  <span className="inline-block bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded mt-1">{banner.offer_label}</span>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-gray-400">
                  <span>CTA: {banner.cta_text}</span>
                  <span className={banner.active ? 'text-green-500' : 'text-gray-400'}>{banner.active ? '● Active' : '○ Hidden'}</span>
                  {banner.starts_at && <span>📅 From: {formatDate(banner.starts_at)}</span>}
                  {banner.ends_at && <span>📅 Until: {formatDate(banner.ends_at)}</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleActive(banner)} className="p-2 rounded-xl hover:bg-gray-50">
                  {banner.active ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                </button>
                <button onClick={() => { setEditingBanner(banner); setShowForm(true); }} className="p-2 rounded-xl hover:bg-gray-50">
                  <Pencil className="w-4 h-4 text-gray-400" />
                </button>
                <button onClick={() => deleteBanner(banner)} className="p-2 rounded-xl hover:bg-red-50">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ——— Banner Create/Edit Form with Image Upload + Timer + Scheduling ——— */
function BannerForm({ banner, onClose }: { banner: Banner | null; onClose: () => void }) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: banner?.title || '',
    subtitle: banner?.subtitle || '',
    description: banner?.description || '',
    cta_text: banner?.cta_text || 'SHOP NOW',
    cta_link: banner?.cta_link || '/products',
    bg_color: banner?.bg_color || '#F85606',
    bg_gradient: banner?.bg_gradient || PRESET_GRADIENTS[0].value,
    text_color: banner?.text_color || 'white',
    image_url: banner?.image_url || '',
    sort_order: banner?.sort_order?.toString() || '0',
    show_timer: banner?.show_timer || false,
    offer_label: banner?.offer_label || '',
    starts_at: banner?.starts_at ? banner.starts_at.slice(0, 16) : '',
    ends_at: banner?.ends_at ? banner.ends_at.slice(0, 16) : '',
  });

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const ext = file.name.split('.').pop();
    const fileName = `banner-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from('banners').upload(fileName, file);
    if (error) {
      toast.error('Failed to upload image');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('banners').getPublicUrl(fileName);
    setForm(p => ({ ...p, image_url: urlData.publicUrl }));
    setUploading(false);
    toast.success('Image uploaded!');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) { toast.error('Title is required'); return; }
    setSaving(true);

    const data: any = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      description: form.description.trim() || null,
      cta_text: form.cta_text.trim(),
      cta_link: form.cta_link.trim(),
      bg_color: form.bg_color,
      bg_gradient: form.bg_gradient || null,
      text_color: form.text_color,
      image_url: form.image_url || null,
      sort_order: parseInt(form.sort_order) || 0,
      show_timer: form.show_timer,
      offer_label: form.offer_label.trim() || null,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
    };

    if (banner) {
      const { error } = await supabase.from('banners').update(data).eq('id', banner.id);
      if (error) toast.error(error.message); else toast.success('Banner updated');
    } else {
      const { error } = await supabase.from('banners').insert(data);
      if (error) toast.error(error.message); else toast.success('Banner created');
    }
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-2 sm:pt-8 px-3 overflow-y-auto">
      <div className="bg-white rounded-2xl border w-full max-w-lg shadow-2xl mb-8">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-semibold">{banner ? 'Edit Banner' : 'New Banner'}</h2>
          <button onClick={onClose} className="p-2 -mr-2 rounded-xl hover:bg-gray-50"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Live Preview */}
          <div
            className="rounded-xl overflow-hidden relative min-h-[100px] flex items-center p-4"
            style={{
              background: form.image_url ? '#000' : (form.bg_gradient || form.bg_color),
              color: form.text_color,
            }}
          >
            {form.image_url && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.image_url} alt="Preview" className="w-full h-full object-cover absolute inset-0" />
                <div className="absolute inset-0 bg-black/30" />
              </>
            )}
            <div className="relative z-10">
              {form.offer_label && (
                <span className="inline-block bg-yellow-400 text-gray-900 text-[9px] font-bold px-2 py-0.5 rounded mb-1">{form.offer_label}</span>
              )}
              <p className="text-lg font-black">{form.title || 'Banner Title'}</p>
              {form.subtitle && <p className="text-sm font-bold opacity-90">{form.subtitle}</p>}
              {form.show_timer && <p className="text-[10px] mt-1 opacity-70">⏱ Countdown timer will show here</p>}
            </div>
          </div>

          {/* Image Upload from Gallery */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Banner Image (from Gallery)</label>
            <div className="flex items-center gap-3">
              {form.image_url ? (
                <div className="relative w-24 h-16 rounded-lg overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setForm(p => ({ ...p, image_url: '' }))}
                    className="absolute top-0.5 right-0.5 bg-red-500 rounded-full p-0.5">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-[#F85606] hover:text-[#F85606] transition-colors"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-[#F85606] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {form.image_url ? 'Change Image' : 'Upload from Gallery'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">If no image uploaded, gradient background will be used</p>
          </div>

          <Input label="Title *" required value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. दशैं MEGA SALE" />
          <Input label="Subtitle" value={form.subtitle} onChange={(e) => setForm(p => ({ ...p, subtitle: e.target.value }))} placeholder="e.g. UP TO 70% OFF" />
          <Input label="Description" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. on Kurtas, Sarees & Lehenga" />
          <Input label="Offer Label Badge" value={form.offer_label} onChange={(e) => setForm(p => ({ ...p, offer_label: e.target.value }))} placeholder="e.g. 🔥 LIMITED TIME, MEGA DEAL" hint="Shows as a badge on the banner" />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Button Text" value={form.cta_text} onChange={(e) => setForm(p => ({ ...p, cta_text: e.target.value }))} placeholder="SHOP NOW" />
            <Input label="Button Link" value={form.cta_link} onChange={(e) => setForm(p => ({ ...p, cta_link: e.target.value }))} placeholder="/products" />
          </div>

          {/* Gradient presets (when no image) */}
          {!form.image_url && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Background Gradient</label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_GRADIENTS.map((g) => (
                  <button
                    key={g.name}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, bg_gradient: g.value }))}
                    className={`h-10 rounded-lg border-2 transition-all ${form.bg_gradient === g.value ? 'border-blue-500 scale-105' : 'border-transparent'}`}
                    style={{ background: g.value || '#F85606' }}
                    title={g.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Schedule & Timer */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Schedule & Timer</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Starts At</label>
                <input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm(p => ({ ...p, starts_at: e.target.value }))}
                  className="w-full h-9 px-2.5 text-xs border border-gray-200 rounded-lg focus:border-[#F85606] outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Ends At</label>
                <input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => setForm(p => ({ ...p, ends_at: e.target.value }))}
                  className="w-full h-9 px-2.5 text-xs border border-gray-200 rounded-lg focus:border-[#F85606] outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.show_timer}
                onChange={(e) => setForm(p => ({ ...p, show_timer: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-[#F85606] focus:ring-[#F85606]"
              />
              <span className="text-xs font-medium text-gray-700">Show countdown timer on banner (Daraz-style)</span>
            </label>
            <p className="text-[10px] text-gray-400">Timer counts down to the "Ends At" date. Leave dates empty for always-on banners.</p>
          </div>

          <Input label="Sort Order" type="number" value={form.sort_order} onChange={(e) => setForm(p => ({ ...p, sort_order: e.target.value }))} placeholder="0" />

          <div className="flex gap-2 pt-2">
            <Button type="submit" variant="primary" rounded fullWidth isLoading={saving}>
              {banner ? 'Save Changes' : 'Create Banner'}
            </Button>
            <Button type="button" variant="ghost" rounded onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
