const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/analytics.db');

console.log('🔍 Investigating Nefes game time sync issue...');

// Check recent game sessions for Nefes
db.all('SELECT game_name, duration_minutes, start_time, status FROM game_sessions WHERE user_id = "978749599453945997" AND DATE(start_time) = "2025-06-29" ORDER BY start_time DESC', (err, sessions) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('🎮 Nefes game sessions TODAY (2025-06-29):');
  let totalGameTime = 0;
  sessions.forEach(session => {
    console.log('  -', session.game_name + ':', session.duration_minutes + 'min', 'at', session.start_time, '(Status:', session.status + ')');
    if (session.status === 'completed') {
      totalGameTime += session.duration_minutes;
    }
  });
  
  console.log('📊 Total completed game time today:', totalGameTime + 'min');
  
  // Check user_stats for Nefes
  db.get('SELECT daily_games_played, monthly_games_played, monthly_games_minutes, last_monthly_reset FROM user_stats WHERE user_id = "978749599453945997"', (err, user) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    
    if (user) {
      console.log('\n📊 Nefes user_stats:');
      console.log('  - Daily games played:', user.daily_games_played);
      console.log('  - Monthly games played:', user.monthly_games_played);
      console.log('  - Monthly games minutes:', user.monthly_games_minutes + 'm');
      console.log('  - Last monthly reset:', user.last_monthly_reset || 'Never');
      
      console.log('\n🔍 ANALYSIS:');
      console.log('  - Sessions show:', totalGameTime + 'min today');
      console.log('  - Monthly counter shows:', user.monthly_games_minutes + 'm');
      console.log('  - Expected: Monthly should be >= daily game time');
      
      if (user.monthly_games_minutes < totalGameTime) {
        console.log('\n❌ PROBLEM: Monthly counter is not being updated by Discord Gateway!');
        console.log('💡 SOLUTION: Discord Gateway needs to accumulate game time into monthly_games_minutes');
      } else {
        console.log('\n✅ Monthly counter looks correct');
      }
    } else {
      console.log('❌ Nefes not found in user_stats');
    }
    
    db.close();
  });
});