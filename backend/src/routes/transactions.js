const express = require("express");
const { prepare: db } = require("../db");

const router = express.Router();

// ─── GET all ──────────────────────────────────────────────────────────────────
router.get("/", (req, res) => {
  const transactions = db(
    "SELECT id, type, amount, category, description, date, created_at AS createdAt FROM transactions WHERE user_id = ? ORDER BY date DESC, created_at DESC"
  ).all(req.user.id);
  res.json(transactions);
});

// ─── POST single ──────────────────────────────────────────────────────────────
router.post("/", (req, res) => {
  const { id, type, amount, category, description, date, createdAt } = req.body;
  if (!id || !type || !amount || !category || !description || !date)
    return res.status(400).json({ error: "All fields are required" });
  db("INSERT INTO transactions (id, user_id, type, amount, category, description, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(id, req.user.id, type, amount, category, description, date, createdAt ?? Date.now());
  res.status(201).json({ id });
});

// ─── POST bulk ────────────────────────────────────────────────────────────────
router.post("/bulk", (req, res) => {
  const { transactions } = req.body;
  if (!Array.isArray(transactions) || transactions.length === 0)
    return res.status(400).json({ error: "transactions must be a non-empty array" });

  try {
    // Build one big INSERT with multiple value rows — single SQL statement
    // e.g. INSERT INTO transactions VALUES (?,?,?,...),(?,?,?,...),(?,?,?,...)
    const placeholders = transactions.map(() => "(?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
    const values = [];
    for (const t of transactions) {
      const { id, type, amount, category, description, date, createdAt } = t;
      if (!id || !type || !amount || !category || !description || !date) continue;
      values.push(id, req.user.id, type, amount, category, description, date, createdAt ?? Date.now());
    }

    if (values.length === 0)
      return res.status(400).json({ error: "No valid transactions found" });

    db(`INSERT OR IGNORE INTO transactions (id, user_id, type, amount, category, description, date, created_at) VALUES ${placeholders}`)
      .run(values);

    res.status(201).json({ inserted: transactions.length });
  } catch (err) {
    console.error("Bulk insert error:", err);
    res.status(500).json({ error: "Bulk insert failed: " + err.message });
  }
});

// ─── PUT edit ─────────────────────────────────────────────────────────────────
router.put("/:id", (req, res) => {
  const { type, amount, category, description, date } = req.body;
  const existing = db("SELECT id FROM transactions WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Transaction not found" });
  db("UPDATE transactions SET type = ?, amount = ?, category = ?, description = ?, date = ? WHERE id = ? AND user_id = ?")
    .run(type, amount, category, description, date, req.params.id, req.user.id);
  res.json({ id: req.params.id });
});

// ─── DELETE ───────────────────────────────────────────────────────────────────
router.delete("/:id", (req, res) => {
  const result = db("DELETE FROM transactions WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: "Transaction not found" });
  res.json({ id: req.params.id });
});

module.exports = router;
