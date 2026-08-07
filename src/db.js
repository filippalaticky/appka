const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

async function query(text, params = []) {
  return pool.query(text, params);
}

async function initDb() {
  const schemaPath = path.join(__dirname, "..", "database", "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  await pool.query(schemaSql);
  await pool.query("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age INTEGER");
  await pool.query("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT");
  await pool.query("UPDATE profiles SET age = 30 WHERE age IS NULL");
  await pool.query("UPDATE profiles SET gender = 'muz' WHERE gender IS NULL");
  await pool.query("ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS variant1_meal_id INTEGER");
  await pool.query("ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS variant2_meal_id INTEGER");
  await pool.query(
    `CREATE TABLE IF NOT EXISTS meals (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      calories NUMERIC(8,2) NOT NULL,
      protein NUMERIC(8,2) NOT NULL,
      carbs NUMERIC(8,2) NOT NULL,
      fat NUMERIC(8,2) NOT NULL,
      fiber NUMERIC(8,2) NOT NULL
    )`
  );
  await pool.query(
    `CREATE TABLE IF NOT EXISTS ingredients (
      id SERIAL PRIMARY KEY,
      meal_id INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
      ingredient_name TEXT NOT NULL,
      grams NUMERIC(8,2) NOT NULL,
      calories NUMERIC(8,2) NOT NULL,
      protein NUMERIC(8,2) NOT NULL,
      carbs NUMERIC(8,2) NOT NULL,
      fat NUMERIC(8,2) NOT NULL,
      fiber NUMERIC(8,2) NOT NULL
    )`
  );
  await pool.query("CREATE INDEX IF NOT EXISTS idx_ingredients_meal_id ON ingredients(meal_id)");
  await pool.query(
    `DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'meal_plans_variant1_meal_id_fkey') THEN
        ALTER TABLE meal_plans
          ADD CONSTRAINT meal_plans_variant1_meal_id_fkey
          FOREIGN KEY (variant1_meal_id) REFERENCES meals(id) ON DELETE SET NULL;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'meal_plans_variant2_meal_id_fkey') THEN
        ALTER TABLE meal_plans
          ADD CONSTRAINT meal_plans_variant2_meal_id_fkey
          FOREIGN KEY (variant2_meal_id) REFERENCES meals(id) ON DELETE SET NULL;
      END IF;
    END
    $$`
  );

  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  await pool.query(
    `INSERT INTO users (email, password, role)
     VALUES ($1, $2, 'admin')
     ON CONFLICT (email)
     DO UPDATE SET role = 'admin', password = EXCLUDED.password`,
    [adminEmail, adminPasswordHash]
  );

  const demoUserEmail = process.env.DEMO_USER_EMAIL || "user@example.com";
  const demoUserPassword = process.env.DEMO_USER_PASSWORD || "user123456";
  const demoPasswordHash = await bcrypt.hash(demoUserPassword, 10);

  await pool.query(
    `INSERT INTO users (email, password, role)
     VALUES ($1, $2, 'user')
     ON CONFLICT (email)
     DO UPDATE SET password = EXCLUDED.password`,
    [demoUserEmail, demoPasswordHash]
  );
}

module.exports = {
  pool,
  query,
  initDb
};
