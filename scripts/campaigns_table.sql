-- ================================================================
-- Dar Zahmet Kotab — Promotional Campaigns Table (Optional SQL Mirror)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.campaigns (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  discount_percent NUMERIC(5, 2) NOT NULL CHECK (discount_percent > 0 AND discount_percent < 100),
  is_active        BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Allow public read of active campaign
CREATE POLICY "Public read active campaigns" ON public.campaigns
  FOR SELECT USING (true);

-- Allow admins to manage campaigns
CREATE POLICY "Admins manage campaigns" ON public.campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

