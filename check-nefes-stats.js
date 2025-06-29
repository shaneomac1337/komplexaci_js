const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/analytics.db');

console.log('🔍 Checking Nefes monthly game stats...');

// First find Nefes user ID
db.all('SELECT user_id, daily_online_minutes, monthly_online_minutes, daily_games_played, monthly_games_played, monthly_games_minutes FROM user_stats WHERE user_id = "978749599453945997"', (err, users) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('📊 Nefes user stats:');
  users.forEach(user => {
    console.log('User ID:', user.user_id);
    console.log('  - Daily online:', user.daily_online_minutes + 'm');
    console.log('  - Monthly online:', user.monthly_online_minutes + 'm');
    console.log('  - Daily games played:', user.daily_games_played);
    console.log('  - Monthly games played:', user.monthly_games_played);
    console.log('  - Monthly games minutes:', user.monthly_games_minutes + 'm');
  });
  
  // Check game sessions for Nefes
  const nefesId = '978749599453945997';
  db.all('SELECT game_name, duration_minutes, start_time, status FROM game_sessions WHERE user_id = ? ORDER BY start_time DESC', nefesId, (err, sessions) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    
    console.log('\n🎮 Nefes game sessions:');
    if (sessions.length === 0) {
      console.log('  No game sessions found for Nefes');
    } else {
      sessions.forEach(session => {
        console.log('  -', session.game_name + ':', session.duration_minutes + 'min', 'at', session.start_time, '(Status:', session.status + ')');
      });
    }
    
    // Also check last monthly reset time
    db.get('SELECT last_monthly_reset FROM user_stats WHERE user_id = ?', nefesId, (err, resetInfo) => {
      if (err) {
        console.error('Error:', err);
        return;
      }
      
      console.log('\n📅 Last monthly reset:', resetInfo?.last_monthly_reset || 'Never');
      
      db.close();
    });
  });
});