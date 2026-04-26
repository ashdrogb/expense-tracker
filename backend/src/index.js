require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const { init } = require("./db");

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());
app.get("/health", (_, res) => res.json({ status: "ok" }));

init().then(() => {
  const authRoutes        = require("./routes/auth");
  const transactionRoutes = require("./routes/transactions");
  const authMiddleware    = require("./middleware/auth");

  app.use("/api/auth",         authRoutes);
  app.use("/api/transactions", authMiddleware, transactionRoutes);

  // Bind to 0.0.0.0 so Railway can reach it
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error("Failed to initialise database:", err);
  process.exit(1);
});
