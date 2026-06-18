import express from 'express';
import cors from 'cors';
import { initDb, testConnection } from './db.js';
import playersRouter from './routes/players.js';
import { getEventStatus } from './eventWindow.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    const db = await testConnection();
    res.json({ ok: true, database: 'connected', time: db.now });
  } catch (err) {
    res.status(503).json({ ok: false, database: 'disconnected', error: err.message });
  }
});

app.use('/api/players', playersRouter);

async function start() {
  try {
    await initDb();
    await testConnection();
    console.log('PostgreSQL connected');
  } catch (err) {
    console.error('PostgreSQL connection failed:', err.message);
    console.error('Server starting anyway — API calls will fail until DB is reachable.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    const event = getEventStatus();
    console.log(`Gamethon API running on http://localhost:${PORT}`);
    if (event.bypass) {
      console.log('EVENT_BYPASS=true — time window disabled (open anytime)');
    } else {
      console.log(`Event window: ${event.startLabel} – ${event.endLabel} (${event.dateLabel}, ${event.timeZone})`);
    }
  });
}

start();
