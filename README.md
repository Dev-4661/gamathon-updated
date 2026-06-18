# gamathon-updated

Bollywood edition puzzle game with **PostgreSQL-backed** player records and admin leaderboard.

## Project structure

```
Gamathon/
├── backend/              # Express API + PostgreSQL
│   ├── index.js
│   ├── db.js
│   ├── .env.example
│   ├── routes/
│   └── package.json
├── frontend/             # Vite web app
│   ├── index.html
│   ├── src/assets/       # Game images
│   ├── vite.config.ts
│   └── package.json
├── package.json          # Run both apps (root scripts only)
└── README.md
```

Only config and orchestration live at the root. Code, assets, and dependencies stay inside `backend/` and `frontend/`.

## Prerequisites

- Node.js 18+
- PostgreSQL (credentials in `backend/.env`)

## Setup

1. Install dependencies (only inside `backend/` and `frontend/` — no root `node_modules`):
   ```bash
   npm run install:all
   ```

2. Copy environment file and set your PostgreSQL credentials:
   ```bash
   copy backend\.env.example backend\.env
   ```

3. Run frontend + backend:
   ```bash
   npm run dev
   ```

   - **Frontend:** http://localhost:3000
   - **Backend API:** http://localhost:4000

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend + frontend |
| `npm run dev:backend` | Backend only (port 4000) |
| `npm run dev:frontend` | Frontend only (port 3000) |
| `npm start` | Production backend |
| `npm run build` | Build frontend to `frontend/dist/` |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Database connectivity check |
| POST | `/api/players/login` | Create player session |
| PUT | `/api/players/:empId/:sessionId` | Save progress / results |
| GET | `/api/players` | All player records (admin) |
| GET | `/api/players/leaderboard` | Top 10 leaderboard |
| DELETE | `/api/players` | Clear all records (admin) |

## Admin Panel

Click **Admin** (bottom-right). Password: `admin`, `admin123`, `indira`, or `indira123`.

Player data is stored in PostgreSQL table `gamethon_players` — shared across all devices on the same database.
