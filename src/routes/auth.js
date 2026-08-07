const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query } = require("../db");
const { authenticate } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/asyncHandler");

const router = express.Router();

function tokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 12
  };
}

router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email a heslo sú povinné." });
  }

  const userResult = await query("SELECT id, email, password, role FROM users WHERE email = $1", [
    email.toLowerCase().trim()
  ]);

  const user = userResult.rows[0];
  if (!user) {
    return res.status(401).json({ message: "Nesprávne prihlasovacie údaje." });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ message: "Nesprávne prihlasovacie údaje." });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "12h"
  });

  res.cookie("token", token, tokenCookieOptions());
  return res.json({
    message: "Prihlásenie úspešné.",
    user: { id: user.id, email: user.email, role: user.role }
  });
}));

router.post("/register", asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ message: "Zadaj platný email a heslo s aspoň 6 znakmi." });
  }

  const exists = await query("SELECT id FROM users WHERE email = $1", [email.toLowerCase().trim()]);
  if (exists.rows.length > 0) {
    return res.status(409).json({ message: "Používateľ s týmto emailom už existuje." });
  }

  const hash = await bcrypt.hash(password, 10);
  const inserted = await query(
    "INSERT INTO users (email, password, role) VALUES ($1, $2, 'user') RETURNING id, email, role",
    [email.toLowerCase().trim(), hash]
  );

  const created = inserted.rows[0];
  const token = jwt.sign(
    { id: created.id, email: created.email, role: created.role },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  res.cookie("token", token, tokenCookieOptions());
  return res.status(201).json({
    message: "Registrácia úspešná.",
    user: created
  });
}));

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ message: "Odhlásenie úspešné." });
});

router.get("/me", authenticate, asyncHandler(async (req, res) => {
  const userResult = await query("SELECT id, email, role FROM users WHERE id = $1", [req.user.id]);
  const user = userResult.rows[0];
  if (!user) {
    return res.status(404).json({ message: "Používateľ neexistuje." });
  }
  return res.json({ user });
}));

module.exports = router;
