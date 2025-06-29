const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/analytics.db');

console.log('🔍 Testing Real-Time Monthly Counter Updates...');

// Test with Nefes who is currently playing
const nefesId = '1282037953043894283';

console.log('\n📊 BEFORE: Checking current monthly stats...');

db.get('SELECT daily_games_played, monthly_games_played, monthly_games_minutes, daily_spotify_songs, monthly_spotify_songs FROM user_stats WHERE user_id = ?', nefesId, (err, beforeStats) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  if (beforeStats) {
    console.log('  - Daily games played:', beforeStats.daily_games_played);
    console.log('  - Monthly games played:', beforeStats.monthly_games_played);
    console.log('  - Monthly games minutes:', beforeStats.monthly_games_minutes + 'm');
    console.log('  - Daily Spotify songs:', beforeStats.daily_spotify_songs);
    console.log('  - Monthly Spotify songs:', beforeStats.monthly_spotify_songs);
    
    // Check current active sessions
    db.all('SELECT game_name, duration_minutes, start_time, status FROM game_sessions WHERE user_id = ? AND status = "active"', nefesId, (err, activeSessions) => {
      if (err) {
        console.error('Error:', err);
        return;
      }
      
      console.log('\n🎮 ACTIVE SESSIONS:');
      if (activeSessions.length === 0) {
        console.log('  No active sessions found');
      } else {
        activeSessions.forEach(session => {
          console.log('  -', session.game_name + ':', session.duration_minutes + 'min', 'since', session.start_time);
        });
      }
      
      // Check today's total session time (including active)
      const today = new Date().toISOString().split('T')[0];
      db.all('SELECT game_name, duration_minutes, status FROM game_sessions WHERE user_id = ? AND DATE(start_time) = ? AND status IN ("active", "ended")', [nefesId, today], (err, todaySessions) => {
        if (err) {
          console.error('Error:', err);
          return;
        }
        
        console.log('\n📅 TODAY\'S SESSIONS (including active):');
        let totalGameTime = 0;
        let totalGames = 0;
        const uniqueGames = new Set();
        
        todaySessions.forEach(session => {
          console.log('  -', session.game_name + ':', session.duration_minutes + 'min', '(' + session.status + ')');
          totalGameTime += session.duration_minutes;
          uniqueGames.add(session.game_name);
        });
        
        totalGames = uniqueGames.size;
        
        console.log('\n📊 EXPECTED VALUES:');
        console.log('  - Expected daily games played:', totalGames);
        console.log('  - Expected daily game time:', totalGameTime + 'm');
        console.log('  - Expected monthly games minutes (should be >= daily):', Math.max(beforeStats.monthly_games_minutes, totalGameTime) + 'm');
        
        console.log('\n🔍 ANALYSIS:');
        if (beforeStats.monthly_games_minutes >= totalGameTime) {
          console.log('  ✅ Monthly counter looks correct (>= daily game time)');
        } else {
          console.log('  ❌ Monthly counter is behind daily game time!');
          console.log('  💡 This indicates real-time updates may not be working');
        }
        
        console.log('\n⏱️ REAL-TIME UPDATE TEST:');
        console.log('  The Discord Gateway should update these counters every minute.');
        console.log('  Monthly counters should use Math.max() logic to include active session progress.');
        console.log('  If Nefes continues playing, monthly_games_minutes should increase in real-time.');
        
        db.close();
      });
    });
  } else {
    console.log('❌ Nefes not found in user_stats');
    db.close();
  }
});