ALTER TABLE items
  ADD COLUMN IF NOT EXISTS platform_only boolean DEFAULT false;
