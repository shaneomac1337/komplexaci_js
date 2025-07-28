const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/analytics.db');

console.log('🔍 Checking correct Nefes (1282037953043894283) monthly stats...');

// Check user_stats for correct Nefes ID
db.get('SELECT * FROM user_stats WHERE user_id = ?', ['1282037953043894283'], (err, user) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  if (user) {
    console.log('📊 Nefes (1282037953043894283) user_stats:');
    console.log('  - Daily online:', user.daily_online_minutes + 'm');
    console.log('  - Monthly online:', user.monthly_online_minutes + 'm');
    console.log('  - Daily games played:', user.daily_games_played);
    console.log('  - Monthly games played:', user.monthly_games_played);
    console.log('  - Monthly games minutes:', user.monthly_games_minutes + 'm');
    console.log('  - Last monthly reset:', user.last_monthly_reset || 'Never');
    
    // Check game sessions
    db.all('SELECT game_name, duration_minutes, start_time, status FROM game_sessions WHERE user_id = ? AND DATE(start_time) = ?', ['1282037953043894283', '2025-06-29'], (err, sessions) => {
      if (err) {
        console.error('Error:', err);
        return;
      }
      
      console.log('\n🎮 Nefes game sessions TODAY:');
      let totalGameTime = 0;
      sessions.forEach(session => {
        console.log('  -', session.game_name + ':', session.duration_minutes + 'min', 'at', session.start_time, '(Status:', session.status + ')');
        if (session.status === 'completed') {
          totalGameTime += session.duration_minutes;
        }
      });
      
      console.log('\n🔍 SYNC ANALYSIS:');
      console.log('  - Game sessions today:', totalGameTime + 'min');
      console.log('  - Monthly counter:', user.monthly_games_minutes + 'm');
      console.log('  - Expected: Monthly should equal or exceed daily game time');
      
      if (user.monthly_games_minutes < totalGameTime) {
        console.log('\n❌ CONFIRMED PROBLEM: Monthly counter not synced!');
        console.log('💡 Discord Gateway is not accumulating game time into monthly_games_minutes');
      } else {
        console.log('\n✅ Monthly counter looks correct');
      }
      
      db.close();
    });
  } else {
    console.log('❌ Nefes not found in user_stats');
    db.close();
  }
});