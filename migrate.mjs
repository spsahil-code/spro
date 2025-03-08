import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { migrateAllData } = require('./lib/migrateToFirebase.js');

migrateAllData().then(() => {
  console.log('Migration completed');
}).catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});