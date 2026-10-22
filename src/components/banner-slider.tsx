'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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
  starts_at: string | null;
  ends_at: string | null;
  show_timer: boolean;
  offer_label: string | null;
}

const FALLBACK_BANNERS: Banner[] = [
  {
    id: '1', title: 'दशैं SALE', subtitle: 'UP TO 50% OFF',
    description: 'on Kurtas, Sarees & Lehenga', cta_text: 'SHOP NOW',
    cta_link: '/products?sale=true', bg_color: '#F85606',
    bg_gradient: 'linear-gradient(135deg, #F85606 0%, #FF2D00 50%, #D94400 100%)',
    text_color: 'white', image_url: null,
    starts_at: null, ends_at: null, show_timer: false, offer_label: null,
  },
];

function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    function calc() {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0 };
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      };
    }
    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      {timeLeft.days > 0 && (
        <>
          <TimerBox value={pad(timeLeft.days)} label="Days" />
          <span className="text-white text-lg font-bold opacity-80">:</span>
        </>
      )}
      <TimerBox value={pad(timeLeft.hours)} label="Hrs" />
      <span className="text-white text-lg font-bold opacity-80">:</span>
      <TimerBox value={pad(timeLeft.mins)} label="Min" />
      <span className="text-white text-lg font-bold opacity-80">:</span>
      <TimerBox value={pad(timeLeft.secs)} label="Sec" />
    </div>
  );
}

function TimerBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-black/30 backdrop-blur-sm rounded px-1.5 sm:px-2 py-0.5 sm:py-1 min-w-[28px] sm:min-w-[36px] text-center">
        <span className="text-white text-sm sm:text-lg font-mono font-bold">{value}</span>
      </div>
      <span className="text-white/60 text-[8px] sm:text-[9px] mt-0.5">{label}</span>
    </div>
  );
}

export function BannerSlider({ banners: serverBanners }: { banners?: Banner[] }) {
  // Filter active banners (within schedule if set)
  const now = Date.now();
  const activeBanners = (serverBanners || []).filter(b => {
    // If starts_at is set and in the future, hide
    if (b.starts_at && new Date(b.starts_at).getTime() > now) return false;
    // If ends_at is set and in the past, hide — BUT only if it's meaningfully different from starts_at
    if (b.ends_at) {
      const endTime = new Date(b.ends_at).getTime();
      const startTime = b.starts_at ? new Date(b.starts_at).getTime() : 0;
      // If end equals start (user set same time by mistake), ignore the schedule
      if (endTime !== startTime && endTime < now) return false;
    }
    return true;
  });

  const banners = activeBanners.length > 0 ? activeBanners : FALLBACK_BANNERS;
  const [current, setCurrent] = useState(0);

  const [failedBannerImages, setFailedBannerImages] = useState<Record<string, boolean>>({});

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const banner = banners[current];
  const hasValidImage = banner.image_url && !failedBannerImages[banner.id];

  return (
    <div className="relative overflow-hidden">
      <div
        className="transition-all duration-700 ease-out relative"
        style={{
          background: hasValidImage ? undefined : (banner.bg_gradient || banner.bg_color || '#F85606'),
        }}
      >
        {/* Background image if uploaded */}
        {hasValidImage && (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={banner.image_url || ''}
              alt={banner.title}
              className="w-full h-full object-cover"
              onError={() => setFailedBannerImages((prev) => ({ ...prev, [banner.id]: true }))}
            />
            <div className="absolute inset-0 bg-black/30" />
          </div>
        )}

        <div className="max-w-[1200px] mx-auto px-3 sm:px-6 relative z-10">
          <div className="flex items-center min-h-[180px] sm:min-h-[240px] md:min-h-[320px] py-5 sm:py-8">
            <div className="max-w-[600px]" style={{ color: banner.text_color || 'white' }}>
              {/* Offer label badge */}
              {banner.offer_label && (
                <span className="inline-block bg-yellow-400 text-gray-900 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded mb-2 sm:mb-3 animate-pulse">
                  {banner.offer_label}
                </span>
              )}

              <h2
                className="text-2xl sm:text-4xl md:text-6xl font-black leading-none tracking-tight drop-shadow-lg"
                style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
              >
                {banner.title}
              </h2>

              {banner.subtitle && (
                <p className="text-base sm:text-xl md:text-3xl font-bold mt-1 sm:mt-2 opacity-95 drop-shadow">
                  {banner.subtitle}
                </p>
              )}

              {banner.description && (
                <p className="text-xs sm:text-sm md:text-base mt-1 opacity-80">
                  {banner.description}
                </p>
              )}

              {/* Countdown timer — Daraz style */}
              {banner.show_timer && banner.ends_at && (
                <div className="mt-3 sm:mt-4">
                  <p className="text-[10px] sm:text-xs font-semibold opacity-80 mb-1.5">ENDS IN</p>
                  <CountdownTimer endsAt={banner.ends_at} />
                </div>
              )}

              <Link
                href={banner.cta_link}
                className="inline-block mt-3 sm:mt-5 px-5 sm:px-8 py-2 sm:py-3 bg-white text-[#F85606] font-bold text-xs sm:text-sm rounded hover:bg-gray-100 transition-colors shadow-lg"
              >
                {banner.cta_text}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Nav arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center z-20"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
          </button>
          <button
            onClick={next}
            className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center z-20"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
          </button>
        </>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${
                i === current ? 'w-8 bg-white' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
