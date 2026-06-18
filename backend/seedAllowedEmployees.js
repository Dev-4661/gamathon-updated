import { query } from './db.js';
import { ALLOWED_EMPLOYEES } from './data/allowed-employees.js';

export function normalizeEmpId(empId) {
  return String(empId || '').trim().toUpperCase();
}

export function normalizeEmpName(empName) {
  return String(empName || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export async function createAllowedEmployeesTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS gamethon_allowed_employees (
      emp_id VARCHAR(50) PRIMARY KEY,
      emp_name VARCHAR(255) NOT NULL,
      emp_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_gamethon_allowed_employees_status
    ON gamethon_allowed_employees (emp_status)
  `);
}

export async function seedAllowedEmployees({ force = false } = {}) {
  await createAllowedEmployeesTable();

  if (!force) {
    const count = await query('SELECT COUNT(*)::int AS count FROM gamethon_allowed_employees');
    if (count.rows[0].count > 0) {
      return { seeded: false, count: count.rows[0].count };
    }
  }

  for (const emp of ALLOWED_EMPLOYEES) {
    await query(
      `INSERT INTO gamethon_allowed_employees (emp_id, emp_name, emp_status, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (emp_id) DO UPDATE SET
         emp_name = EXCLUDED.emp_name,
         emp_status = EXCLUDED.emp_status,
         updated_at = NOW()`,
      [normalizeEmpId(emp.empId), emp.empName.trim(), emp.empStatus]
    );
  }

  return { seeded: true, count: ALLOWED_EMPLOYEES.length };
}

export async function validateAllowedEmployee(empId, empName) {
  const normalizedId = normalizeEmpId(empId);
  const result = await query(
    `SELECT emp_id, emp_name, emp_status
     FROM gamethon_allowed_employees
     WHERE UPPER(emp_id) = $1`,
    [normalizedId]
  );

  if (!result.rows.length) {
    const err = new Error('This Employee ID is not registered for the Gamethon.');
    err.code = 'NOT_ALLOWED';
    err.status = 403;
    throw err;
  }

  const row = result.rows[0];
  if (row.emp_status !== 'ACTIVE') {
    const err = new Error('Your employee account is not active.');
    err.code = 'INACTIVE';
    err.status = 403;
    throw err;
  }

  if (normalizeEmpName(empName) !== normalizeEmpName(row.emp_name)) {
    const err = new Error('Employee name does not match our records for this ID.');
    err.code = 'NAME_MISMATCH';
    err.status = 403;
    throw err;
  }

  return row;
}

export async function lookupAllowedEmployee(empId) {
  const normalizedId = normalizeEmpId(empId);
  if (!normalizedId) return null;

  const result = await query(
    `SELECT emp_id, emp_name, emp_status
     FROM gamethon_allowed_employees
     WHERE UPPER(emp_id) = $1`,
    [normalizedId]
  );

  return result.rows[0] || null;
}
