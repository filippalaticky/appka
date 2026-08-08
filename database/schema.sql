CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  banned BOOLEAN NOT NULL DEFAULT false,
  -- Zvýšením verzie sa okamžite zneplatnia všetky vydané tokeny používateľa.
  token_version INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS login_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  email TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  height NUMERIC(6,2) NOT NULL,
  weight NUMERIC(6,2) NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  activity_level TEXT NOT NULL,
  goal TEXT NOT NULL,
  -- Zoznam alergií / intolerancií, napr. ["laktoza","lepok"].
  allergies JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS meal_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  variant1 TEXT NOT NULL,
  variant2 TEXT NOT NULL,
  variant1_meal_id INTEGER,
  variant2_meal_id INTEGER,
  calories NUMERIC(8,2) NOT NULL,
  protein NUMERIC(8,2) NOT NULL,
  carbs NUMERIC(8,2) NOT NULL,
  fat NUMERIC(8,2) NOT NULL,
  fiber NUMERIC(8,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS meals (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  calories NUMERIC(8,2) NOT NULL,
  protein NUMERIC(8,2) NOT NULL,
  carbs NUMERIC(8,2) NOT NULL,
  fat NUMERIC(8,2) NOT NULL,
  fiber NUMERIC(8,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  meal_id INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  grams NUMERIC(8,2) NOT NULL,
  calories NUMERIC(8,2) NOT NULL,
  protein NUMERIC(8,2) NOT NULL,
  carbs NUMERIC(8,2) NOT NULL,
  fat NUMERIC(8,2) NOT NULL,
  fiber NUMERIC(8,2) NOT NULL
);

-- Na už existujúcej databáze CREATE TABLE IF NOT EXISTS vyššie nič neurobí,
-- takže nové stĺpce treba doplniť zvlášť - inak by referencie nižšie zlyhali.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allergies JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS variant1_meal_id INTEGER;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS variant2_meal_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'meal_plans' AND column_name = 'variant1_meal_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'meal_plans_variant1_meal_id_fkey'
      AND conrelid = 'meal_plans'::regclass
  ) THEN
    ALTER TABLE meal_plans
      ADD CONSTRAINT meal_plans_variant1_meal_id_fkey
      FOREIGN KEY (variant1_meal_id) REFERENCES meals(id) ON DELETE SET NULL;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'meal_plans' AND column_name = 'variant2_meal_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'meal_plans_variant2_meal_id_fkey'
      AND conrelid = 'meal_plans'::regclass
  ) THEN
    ALTER TABLE meal_plans
      ADD CONSTRAINT meal_plans_variant2_meal_id_fkey
      FOREIGN KEY (variant2_meal_id) REFERENCES meals(id) ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_meal_id ON ingredients(meal_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_timestamp ON login_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
-- Zamykanie účtu počíta neúspešné pokusy pre daný email v poslednom okne.
CREATE INDEX IF NOT EXISTS idx_login_logs_email_time ON login_logs(email, timestamp DESC);
