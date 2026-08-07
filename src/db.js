const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV === "production";

// Render free tier uspáva inštanciu a Postgres má nízky limit spojení,
// preto malý pool s krátkym idle timeoutom - spojenia sa po nečinnosti uvoľnia.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: Number(process.env.PG_POOL_MAX) || 5,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 10000
});

pool.on("error", (error) => {
  console.error("Neočakávaná chyba spojenia s databázou:", error.message);
});

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 12;

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
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS banned BOOLEAN NOT NULL DEFAULT false");
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0");
  await pool.query(
    `CREATE TABLE IF NOT EXISTS login_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      email TEXT,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ip_address TEXT,
      user_agent TEXT,
      success BOOLEAN NOT NULL
    )`
  );
  await pool.query("CREATE INDEX IF NOT EXISTS idx_login_logs_timestamp ON login_logs(timestamp DESC)");
  await pool.query("CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id)");
  await pool.query("CREATE INDEX IF NOT EXISTS idx_login_logs_email_time ON login_logs(email, timestamp DESC)");
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

  await seedAdmin();
  await seedDemoUser();
}

// Prihlasovacie údaje nikdy nepochádzajú z kódu. V produkcii sa server radšej
// nespustí, než by nabehol s verejne známym heslom z repozitára.
async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    if (isProduction) {
      throw new Error("V produkcii musia byť nastavené ADMIN_EMAIL a ADMIN_PASSWORD.");
    }
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD nie sú nastavené - admin účet sa nevytvára.");
    return;
  }

  if (adminPassword.length < 12) {
    throw new Error("ADMIN_PASSWORD musí mať aspoň 12 znakov.");
  }

  const adminPasswordHash = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);

  const normalizedAdminEmail = adminEmail.toLowerCase().trim();

  // Zmena hesla zvýši token_version, takže staré prihlásenia okamžite prestanú platiť.
  await pool.query(
    `INSERT INTO users (email, password, role)
     VALUES ($1, $2, 'admin')
     ON CONFLICT (email)
     DO UPDATE SET role = 'admin',
                   password = EXCLUDED.password,
                   banned = false,
                   token_version = users.token_version + 1`,
    [normalizedAdminEmail, adminPasswordHash]
  );

  // Po zmene ADMIN_EMAIL by pôvodný admin účet ostal v databáze s admin právami
  // a starým heslom - čiže ako otvorené zadné dvierka. Admin práva má vždy
  // len účet, ktorý zodpovedá aktuálnemu ADMIN_EMAIL.
  const demoted = await pool.query(
    `UPDATE users
     SET role = 'user',
         token_version = token_version + 1
     WHERE role = 'admin' AND email <> $1
     RETURNING email`,
    [normalizedAdminEmail]
  );

  if (demoted.rows.length > 0) {
    console.warn(
      `Odobrané admin práva účtom mimo ADMIN_EMAIL: ${demoted.rows.map((row) => row.email).join(", ")}`
    );
  }
}

// Demo účet je vývojová pomôcka - v produkcii by bol otvorenými dverami.
async function seedDemoUser() {
  const demoEmail = process.env.DEMO_USER_EMAIL;
  const demoPassword = process.env.DEMO_USER_PASSWORD;

  if (isProduction || !demoEmail || !demoPassword) {
    return;
  }

  const demoPasswordHash = await bcrypt.hash(demoPassword, BCRYPT_ROUNDS);
  await pool.query(
    `INSERT INTO users (email, password, role)
     VALUES ($1, $2, 'user')
     ON CONFLICT (email)
     DO UPDATE SET password = EXCLUDED.password`,
    [demoEmail.toLowerCase().trim(), demoPasswordHash]
  );
}

module.exports = {
  pool,
  query,
  initDb,
  BCRYPT_ROUNDS
};
