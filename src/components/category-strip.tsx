import Link from 'next/link';

const CLOTHING_CATEGORIES = [
  { name: 'Kurta Sets', image: '/categories/kurta-sets.jpg', href: '/products?category=kurta-sets' },
  { name: 'Sarees', image: '/categories/sarees.jpg', href: '/products?category=sarees' },
  { name: 'Lehenga', image: '/categories/lehenga.jpg', href: '/products?category=lehenga' },
  { name: 'Western Wear', image: '/categories/western-wear.jpg', href: '/products?category=western-wear' },
  { name: 'Dresses', image: '/categories/dresses.jpg', href: '/products?category=dresses' },
  { name: 'Tops & Blouses', image: '/categories/tops.jpg', href: '/products?category=tops-blouses' },
];

export function CategoryStrip() {
  return (
    <section className="max-w-[1200px] mx-auto px-3 sm:px-4 mt-3">
      <div className="bg-white rounded shadow-sm">
        <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-gray-100">
          <h2 className="text-[12px] sm:text-[14px] font-bold text-gray-800 uppercase tracking-wide">
            Categories
          </h2>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 py-3 sm:py-4 gap-2 px-3 sm:px-4">
          {CLOTHING_CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="flex flex-col items-center gap-1.5 sm:gap-2 py-2 hover:bg-orange-50 rounded-lg transition-colors group"
            >
              <div className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] rounded-lg overflow-hidden border border-gray-100 group-hover:border-orange-300 transition-all group-hover:shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-gray-600 text-center leading-tight group-hover:text-[#F85606]">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
