import { Router } from 'express';
import { query } from '../db.js';
import {
  assertEventOpen,
  getEventStatus,
  sessionExpiresAtForLogin,
} from '../eventWindow.js';
import { normalizeEmpId, validateAllowedEmployee } from '../seedAllowedEmployees.js';

const router = Router();

function rowToPlayer(row) {
  return {
    empId: row.emp_id,
    empName: row.emp_name,
    sessionId: Number(row.session_id),
    status: row.status,
    gamesCompleted: row.games_completed,
    timeTaken: row.time_taken,
    breakdown: row.breakdown || {},
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    sessionExpiresAt: row.session_expires_at ? Number(row.session_expires_at) : null,
  };
}

router.get('/event-status', (_req, res) => {
  try {
    res.json(getEventStatus());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/health', async (_req, res) => {
  try {
    const result = await query('SELECT COUNT(*)::int AS count FROM gamethon_players');
    res.json({ ok: true, playerCount: result.rows[0].count });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/', async (_req, res) => {
  try {
    const result = await query(
      `SELECT * FROM gamethon_players ORDER BY started_at DESC`
    );
    res.json({ players: result.rows.map(rowToPlayer) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/leaderboard', async (_req, res) => {
  try {
    const result = await query(`
      SELECT * FROM gamethon_players
      WHERE status != 'In Progress'
      ORDER BY COALESCE((breakdown->>'totalScore')::int, 0) DESC,
               games_completed DESC,
               time_taken ASC
      LIMIT 10
    `);
    res.json({ players: result.rows.map(rowToPlayer) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { empId, empName } = req.body || {};
  if (!empId?.trim() || !empName?.trim()) {
    return res.status(400).json({ error: 'Employee ID and name are required.' });
  }

  let eventStatus;
  try {
    eventStatus = assertEventOpen();
  } catch (err) {
    return res.status(err.status || 403).json({
      error: err.message,
      code: err.code,
      event: err.event || getEventStatus(),
    });
  }

  let allowedEmployee;
  try {
    allowedEmployee = await validateAllowedEmployee(empId, empName);
  } catch (err) {
    return res.status(err.status || 403).json({
      error: err.message,
      code: err.code,
    });
  }

  const canonicalEmpId = normalizeEmpId(allowedEmployee.emp_id);
  const canonicalEmpName = allowedEmployee.emp_name.trim();

  const sessionId = Date.now();
  const sessionExpiresAt = sessionExpiresAtForLogin(sessionId);
  const breakdown = {
    spot: 'pending',
    jumble: 'pending',
    match: 'pending',
    guess: 'pending',
    eye: 'pending',
  };

  try {
    const result = await query(
      `INSERT INTO gamethon_players (
        emp_id, emp_name, session_id, status, games_completed, time_taken,
        breakdown, session_expires_at
      ) VALUES ($1, $2, $3, 'In Progress', 0, 0, $4, $5)
      RETURNING *`,
      [canonicalEmpId, canonicalEmpName, sessionId, JSON.stringify(breakdown), sessionExpiresAt]
    );
    res.status(201).json({ player: rowToPlayer(result.rows[0]), event: eventStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:empId/:sessionId', async (req, res) => {
  const { empId, sessionId } = req.params;
  const {
    empName,
    status,
    gamesCompleted,
    timeTaken,
    breakdown,
    finishedAt,
    sessionExpiresAt,
  } = req.body || {};

  try {
    if (status === 'In Progress') {
      assertEventOpen();
    }

    const result = await query(
      `UPDATE gamethon_players SET
        emp_name = COALESCE($3, emp_name),
        status = COALESCE($4, status),
        games_completed = COALESCE($5, games_completed),
        time_taken = COALESCE($6, time_taken),
        breakdown = COALESCE($7, breakdown),
        finished_at = COALESCE($8, finished_at),
        session_expires_at = COALESCE($9, session_expires_at),
        updated_at = NOW()
      WHERE emp_id = $1 AND session_id = $2
      RETURNING *`,
      [
        empId,
        sessionId,
        empName ?? null,
        status ?? null,
        gamesCompleted ?? null,
        timeTaken ?? null,
        breakdown ? JSON.stringify(breakdown) : null,
        finishedAt ?? null,
        sessionExpiresAt ?? null,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Player session not found.' });
    }

    res.json({ player: rowToPlayer(result.rows[0]) });
  } catch (err) {
    if (err.code === 'EVENT_NOT_STARTED' || err.code === 'EVENT_ENDED') {
      return res.status(err.status || 403).json({
        error: err.message,
        code: err.code,
        event: err.event || getEventStatus(),
      });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete('/', async (_req, res) => {
  try {
    await query('DELETE FROM gamethon_players');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
