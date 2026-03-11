const express = require("express");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const { prepare: db } = require("../db");

const router = express.Router();

router.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

  const existing = db("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ error: "An account with this email already exists" });

  const hash = bcrypt.hashSync(password, 10);
  const result = db("INSERT INTO users (email, password) VALUES (?, ?)").run(email.toLowerCase().trim(), hash);
  const token = signToken({ id: result.lastInsertRowid, email });
  res.status(201).json({ token, email });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  const user = db("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const token = signToken({ id: user.id, email: user.email });
  res.json({ token, email: user.email });
});

const signToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "30d" });

module.exports = router;
