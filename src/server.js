require("dotenv").config();

const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");

const { initDb } = require("./db");
const { authenticatePage, requireRolePage } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const mealPlanRoutes = require("./routes/mealPlan");
const adminRoutes = require("./routes/admin");

const app = express();
const port = Number(process.env.PORT) || 3000;

if (!process.env.DATABASE_URL) {
  throw new Error("Chýba DATABASE_URL v .env");
}

if (!process.env.JWT_SECRET) {
  throw new Error("Chýba JWT_SECRET v .env");
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use("/static", express.static(path.join(__dirname, "..", "public")));

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
  app.listen(port, () => {
    console.log(`Server beží na porte ${port}`);
  });
}

startServer().catch((error) => {
  console.error("Nepodarilo sa spustiť server:", error);
  process.exit(1);
});
