# Expense Tracker

A full-stack expense tracking app with user authentication.

## Stack
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + sql.js (SQLite)
- Auth: JWT

## Run locally

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in JWT_SECRET
node src/index.js
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local   # set VITE_API_URL=http://localhost:3001
npm run dev
```
