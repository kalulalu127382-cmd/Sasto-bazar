-- ============================================================
-- Create banners table and RLS policies
-- ============================================================

CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  cta_text TEXT NOT NULL DEFAULT 'SHOP NOW',
  cta_link TEXT NOT NULL DEFAULT '/products',
  bg_color TEXT NOT NULL DEFAULT '#F85606',
  bg_gradient TEXT DEFAULT 'linear-gradient(135deg, #F85606 0%, #FF2D00 50%, #D94400 100%)',
  text_color TEXT NOT NULL DEFAULT 'white',
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  show_timer BOOLEAN NOT NULL DEFAULT false,
  offer_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read banners" 
  ON public.banners 
  FOR SELECT 
  USING (true);

-- Allow authenticated users (admin) full access
CREATE POLICY "Admin manage banners" 
  ON public.banners 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Insert sample default banner
INSERT INTO public.banners (title, subtitle, description, cta_text, cta_link, bg_color, bg_gradient, text_color, active)
VALUES (
  'दशैं SALE',
  'UP TO 50% OFF',
  'on Kurtas, Sarees & Lehenga',
  'SHOP NOW',
  '/products?sale=true',
  '#F85606',
  'linear-gradient(135deg, #F85606 0%, #FF2D00 50%, #D94400 100%)',
  'white',
  true
)
ON CONFLICT DO NOTHING;
