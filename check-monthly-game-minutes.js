const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/analytics.db');

console.log('🔍 Checking ZanderOconner monthly counters after API update...');

db.get('SELECT monthly_games_minutes, monthly_online_minutes, monthly_voice_minutes, monthly_spotify_minutes, last_monthly_reset FROM user_stats WHERE user_id = "239823014126944257"', (err, user) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('📊 ZanderOconner monthly counters:');
  console.log('  - Monthly game minutes:', user.monthly_games_minutes);
  console.log('  - Monthly online minutes:', user.monthly_online_minutes);
  console.log('  - Monthly voice minutes:', user.monthly_voice_minutes);
  console.log('  - Monthly spotify minutes:', user.monthly_spotify_minutes);
  console.log('  - Last monthly reset:', user.last_monthly_reset);
  
  console.log('\n✅ API should now show monthly game time as:', user.monthly_games_minutes, 'minutes');
  console.log('💡 This should match what the Discord Gateway has been accumulating since the reset');
  
  db.close();
});