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
