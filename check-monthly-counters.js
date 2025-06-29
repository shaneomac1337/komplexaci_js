const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/analytics.db');

console.log('📊 Checking ZanderOconner monthly counters...');

db.get('SELECT * FROM user_stats WHERE user_id = "239823014126944257"', (err, user) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('📊 ZanderOconner user_stats:');
  console.log('  - Monthly online:', user.monthly_online_minutes, 'minutes');
  console.log('  - Monthly voice:', user.monthly_voice_minutes, 'minutes');
  console.log('  - Monthly games:', user.monthly_games_played, 'games');
  console.log('  - Monthly spotify:', user.monthly_spotify_minutes, 'minutes');
  console.log('  - Last monthly reset:', user.last_monthly_reset);
  
  db.close();
});