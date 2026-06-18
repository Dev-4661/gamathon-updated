import { seedAllowedEmployees } from '../seedAllowedEmployees.js';
import { testConnection } from '../db.js';

try {
  await testConnection();
  const result = await seedAllowedEmployees({ force: true });
  console.log(`Allowed employees table updated (${result.count} records).`);
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exit(1);
}
