const Database = require('better-sqlite3');

try {
  const db = new Database('./analytics.db');
  
  console.log('📊 Checking database tables...\n');
  
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  
  console.log('Existing tables:');
  tables.forEach(table => {
    console.log(`  - ${table.name}`);
  });
  
  console.log(`\nTotal tables: ${tables.length}`);
  
  // Check if user_stats table exists
  const hasUserStats = tables.some(t => t.name === 'user_stats');
  console.log(`\nuser_stats table exists: ${hasUserStats}`);
  
  if (!hasUserStats) {
    console.log('\n⚠️ user_stats table is missing!');
    console.log('This table is needed for real-time monthly counter updates.');
    console.log('The database migration needs to be run to create this table.');
  }
  
  db.close();
} catch (error) {
  console.error('❌ Error checking database:', error);
}