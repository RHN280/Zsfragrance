-- ─────────────────────────────────────────────────────────
-- ZS Fragrance — Supabase Schema
-- Colle ce SQL dans : Supabase > SQL Editor > Run
-- ─────────────────────────────────────────────────────────

-- Table produits
CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  brand       TEXT NOT NULL,
  name        TEXT NOT NULL,
  volume      TEXT,
  price       NUMERIC NOT NULL,
  currency    TEXT DEFAULT 'CHF',
  flags       JSONB DEFAULT '[]',
  is_new      BOOLEAN DEFAULT false,
  stock       INTEGER DEFAULT 1,
  active      BOOLEAN DEFAULT true,
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Table commandes
CREATE TABLE IF NOT EXISTS orders (
  id              TEXT PRIMARY KEY,
  customer        JSONB NOT NULL,
  delivery        JSONB NOT NULL,
  payment         JSONB NOT NULL,
  items           JSONB NOT NULL,
  subtotal        NUMERIC NOT NULL,
  shipping_cost   NUMERIC DEFAULT 0,
  total           NUMERIC NOT NULL,
  status          TEXT DEFAULT 'pending',
  tracking_number TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Index pour trier les commandes par date
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);

-- Trigger updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
