'use client';

import { useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  images: {
    id: string;
    image_url: string;
    alt_text: string | null;
    is_cover: boolean;
  }[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
      setSelectedIndex(index);
    },
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Listen for scroll events
  if (emblaApi) {
    emblaApi.on('select', onSelect);
  }

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] bg-bg-warm rounded-2xl flex items-center justify-center">
        <svg className="w-16 h-16 text-text-muted/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Carousel */}
      <div className="overflow-hidden rounded-2xl bg-bg-warm" ref={emblaRef}>
        <div className="flex">
          {images.map((img, i) => (
            <div key={img.id} className="flex-[0_0_100%] min-w-0">
              <div className="relative aspect-[3/4] bg-bg-warm flex items-center justify-center">
                {failedImages[img.id] ? (
                  <div className="text-center text-text-muted/40">
                    <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={img.image_url}
                    alt={img.alt_text || `${productName} - Image ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading={i === 0 ? 'eager' : 'lazy'}
                    onError={() => setFailedImages((prev) => ({ ...prev, [img.id]: true }))}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={cn(
                'rounded-full transition-all duration-300',
                selectedIndex === i
                  ? 'w-6 h-2 bg-primary'
                  : 'w-2 h-2 bg-text-muted/30 hover:bg-text-muted/50'
              )}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar px-0.5">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => scrollTo(i)}
              className={cn(
                'relative w-16 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-200',
                selectedIndex === i
                  ? 'border-primary shadow-md'
                  : 'border-transparent opacity-60 hover:opacity-100'
              )}
            >
              {failedImages[img.id] ? (
                <div className="w-full h-full bg-bg-warm flex items-center justify-center text-text-muted/40">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={img.image_url}
                  alt={img.alt_text || ''}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={() => setFailedImages((prev) => ({ ...prev, [img.id]: true }))}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
