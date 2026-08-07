CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  height NUMERIC(6,2) NOT NULL,
  weight NUMERIC(6,2) NOT NULL,
  activity_level TEXT NOT NULL,
  goal TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meal_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  variant1 TEXT NOT NULL,
  variant2 TEXT NOT NULL,
  calories NUMERIC(8,2) NOT NULL,
  protein NUMERIC(8,2) NOT NULL,
  carbs NUMERIC(8,2) NOT NULL,
  fat NUMERIC(8,2) NOT NULL,
  fiber NUMERIC(8,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);
