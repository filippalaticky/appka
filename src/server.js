require("dotenv").config();

const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const { initDb, pool } = require("./db");
const { authenticatePage, requireRolePage } = require("./middleware/auth");
const { ensureCsrfToken } = require("./middleware/csrf");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const mealPlanRoutes = require("./routes/mealPlan");
const adminRoutes = require("./routes/admin");

const app = express();
const port = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";

if (!process.env.DATABASE_URL) {
  throw new Error("Chýba DATABASE_URL v .env");
}

if (!process.env.JWT_SECRET) {
  throw new Error("Chýba JWT_SECRET v .env");
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET musí mať aspoň 32 znakov.");
}

// Render beží za proxy - bez tohto by req.ip bola adresa proxy
// a rate-limit aj IP logovanie by boli k ničomu.
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Tailwind sa ťahá z CDN a za behu vkladá <style> - preto 'unsafe-inline'
        // pre štýly. Skripty ostávajú obmedzené na vlastnú doménu a CDN.
        scriptSrc: ["'self'", "https://cdn.tailwindcss.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: isProduction ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false,
    hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false
  })
);

// Frontend beží na rovnakej doméne ako API, takže whitelist je prázdny,
// pokiaľ sa cez ALLOWED_ORIGINS výslovne nepovolí iná doména.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Táto doména nemá povolený prístup."));
    },
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token"]
  })
);

// Strop na celé API - chráni pred zahltením inštancie na free tieri.
app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Priveľa požiadaviek. Skús to o chvíľu." }
  })
);

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(cookieParser());
app.use(ensureCsrfToken);
app.use("/static", express.static(path.join(__dirname, "..", "public")));

// Render free tier inštanciu uspáva - toto je lacný endpoint na prebudenie.
app.get("/healthz", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/meal-plan", mealPlanRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  return res.sendFile(path.join(__dirname, "..", "public", "login.html"));
});

app.get("/app", authenticatePage, (req, res) => {
  return res.sendFile(path.join(__dirname, "..", "public", "app.html"));
});

app.get("/admin", authenticatePage, requireRolePage("admin"), (req, res) => {
  return res.sendFile(path.join(__dirname, "..", "public", "admin.html"));
});

app.use((req, res) => {
  return res.status(404).json({ message: "Route neexistuje." });
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) {
    return next(error);
  }
  return res.status(500).json({ message: "Server error." });
});

async function startServer() {
  await initDb();
  const server = app.listen(port, () => {
    console.log(`Server beží na porte ${port}`);
  });

  // Render posiela SIGTERM pred uspaním aj pri redeploy - bez tohto
  // by sa spojenia trhali uprostred requestu.
  const shutdown = (signal) => async () => {
    console.log(`${signal} - ukončujem server.`);
    server.close(async () => {
      await pool.end().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 10000).unref();
  };

  process.on("SIGTERM", shutdown("SIGTERM"));
  process.on("SIGINT", shutdown("SIGINT"));
}

startServer().catch((error) => {
  console.error("Nepodarilo sa spustiť server:", error);
  process.exit(1);
});
