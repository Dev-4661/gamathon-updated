import { normalizeEmpId } from './seedAllowedEmployees.js';

/** Employees who may play anytime and replay without the one-game limit. */
const TEST_EMP_IDS = new Set(['IIHL10230']);

export function isTestEmployee(empId) {
  return TEST_EMP_IDS.has(normalizeEmpId(empId));
}
