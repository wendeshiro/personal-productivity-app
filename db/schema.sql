-- TABLE: categories
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW ()
);

-- TABLE: activities
CREATE TABLE activities (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  category_id INTEGER NOT NULL DEFAULT 1 REFERENCES categories (id) ON DELETE SET DEFAULT,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  note TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN end_time IS NULL THEN NULL
      ELSE GREATEST(EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER, 0)
    END
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW (),
  -- end_time must be after start_time
  CONSTRAINT end_after_start CHECK (
    end_time IS NULL
    OR end_time >= start_time
  )
);

-- INDEXES
CREATE INDEX idx_activities_start_time ON activities (start_time);

CREATE INDEX idx_activities_category_id ON activities (category_id);

CREATE INDEX idx_activities_is_completed ON activities (is_completed);

-- PREVENT MULTIPLE ACTIVE TIMERS
CREATE UNIQUE INDEX only_one_running_timer ON activities ((true))
WHERE
  end_time IS NULL;
