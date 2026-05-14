CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('myyja', 'johto')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales_entries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period         DATE NOT NULL,
  leads          INTEGER NOT NULL DEFAULT 0,
  first_meetings INTEGER NOT NULL DEFAULT 0,
  all_meetings   INTEGER NOT NULL DEFAULT 0,
  deals          INTEGER NOT NULL DEFAULT 0,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, period)
);

CREATE INDEX IF NOT EXISTS sales_entries_period_idx ON sales_entries (period DESC);
CREATE INDEX IF NOT EXISTS sales_entries_user_period_idx ON sales_entries (user_id, period DESC);
