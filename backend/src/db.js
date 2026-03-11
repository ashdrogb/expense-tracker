
const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../data/expense.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

let db = null;

const save = () => {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
};

const init = async () => {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      email      TEXT    NOT NULL UNIQUE,
      password   TEXT    NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id          TEXT    PRIMARY KEY,
      user_id     INTEGER NOT NULL,
      type        TEXT    NOT NULL,
      amount      REAL    NOT NULL,
      category    TEXT    NOT NULL,
      description TEXT    NOT NULL,
      date        TEXT    NOT NULL,
      created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_txn_user ON transactions(user_id);
  `);
  save();
  return db;
};

const prepare = (sql) => ({
  get: (...params) => {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const row = stmt.step() ? stmt.getAsObject() : undefined;
    stmt.free();
    return row;
  },
  all: (...params) => {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  },
  run: (...params) => {
    db.run(sql, params);
    save();
    const changes = db.getRowsModified();
    const idRow = db.exec("SELECT last_insert_rowid() AS id");
    const lastInsertRowid = idRow[0]?.values[0][0] ?? null;
    return { changes, lastInsertRowid };
  },
});

module.exports = { init, prepare, save };
