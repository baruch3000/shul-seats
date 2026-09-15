-- Shul Seats Database Schema

CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  total_seats INT NOT NULL
);

CREATE TABLE IF NOT EXISTS benches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id TEXT NOT NULL REFERENCES sections(id),
  row_number INT NOT NULL
);

CREATE TABLE IF NOT EXISTS seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id TEXT NOT NULL REFERENCES sections(id),
  bench_id UUID NOT NULL REFERENCES benches(id),
  seat_number INT NOT NULL,
  pos_x FLOAT NOT NULL,
  pos_y FLOAT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'blocked')),
  UNIQUE(section_id, seat_number)
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  google_id TEXT UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_id UUID UNIQUE NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reserved_name TEXT NOT NULL,
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reserved_by TEXT NOT NULL DEFAULT 'user' CHECK (reserved_by IN ('user', 'admin'))
);

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id TEXT NOT NULL REFERENCES sections(id),
  cx FLOAT NOT NULL,
  cy FLOAT NOT NULL,
  radius FLOAT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

INSERT INTO settings (key, value) VALUES ('booking_open', 'true')
ON CONFLICT (key) DO NOTHING;

INSERT INTO sections (id, display_name, total_seats) VALUES
  ('men', 'עזרת גברים', 112),
  ('women', 'עזרת נשים', 68)
ON CONFLICT (id) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seats_section ON seats(section_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- RLS for public read (realtime + map)
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_seats" ON seats FOR SELECT USING (true);
CREATE POLICY "public_read_reservations" ON reservations FOR SELECT USING (true);

-- Enable Realtime (ignore if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE seats;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
