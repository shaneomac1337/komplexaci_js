const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/analytics.db');

console.log('🔧 Adding monthly_games_minutes column to user_stats table...');

// First check if the column already exists
db.all('PRAGMA table_info(user_stats)', (err, columns) => {
  if (err) {
    console.error('Error checking table structure:', err);
    return;
  }
  
  const hasMonthlyGamesMinutes = columns.some(col => col.name === 'monthly_games_minutes');
  
  if (hasMonthlyGamesMinutes) {
    console.log('✅ monthly_games_minutes column already exists');
    db.close();
    return;
  }
  
  console.log('📊 Current columns:', columns.map(col => col.name).join(', '));
  
  // Add the missing column
  db.run('ALTER TABLE user_stats ADD COLUMN monthly_games_minutes INTEGER DEFAULT 0', (err) => {
    if (err) {
      console.error('❌ Error adding column:', err);
      return;
    }
    
    console.log('✅ Successfully added monthly_games_minutes column');
    
    // Verify the column was added
    db.all('PRAGMA table_info(user_stats)', (err, newColumns) => {
      if (err) {
        console.error('Error verifying table structure:', err);
        return;
      }
      
      console.log('📊 Updated columns:', newColumns.map(col => col.name).join(', '));
      
      // Check ZanderOconner's data
      db.get('SELECT monthly_games_minutes, monthly_online_minutes FROM user_stats WHERE user_id = "239823014126944257"', (err, user) => {
        if (err) {
          console.error('Error checking user data:', err);
          return;
        }
        
        console.log('🎮 ZanderOconner monthly counters:');
        console.log('  - Monthly game minutes:', user.monthly_games_minutes);
        console.log('  - Monthly online minutes:', user.monthly_online_minutes);
        
        db.close();
      });
    });
  });
});