const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/analytics.db');

console.log('🔍 Checking ZanderOconner recent game session...');

// Check the most recent completed game session
db.get('SELECT * FROM game_sessions WHERE user_id = "239823014126944257" AND status = "completed" ORDER BY end_time DESC LIMIT 1', (err, session) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  if (session) {
    console.log('🎮 Most recent completed game session:');
    console.log('  - Game:', session.game_name);
    console.log('  - Duration:', session.duration_minutes, 'minutes');
    console.log('  - Start:', session.start_time);
    console.log('  - End:', session.end_time);
    console.log('  - Status:', session.status);
    
    const resetTime = '2025-06-29T09:48:16.172Z';
    const sessionStart = new Date(session.start_time);
    const resetDate = new Date(resetTime);
    
    console.log('\n📅 Session vs Reset:');
    console.log('  - Reset time:', resetTime);
    console.log('  - Session start:', session.start_time);
    console.log('  - Session after reset?', sessionStart > resetDate);
    
    if (sessionStart > resetDate) {
      console.log('\n✅ This session should be counted in monthly stats!');
      console.log('💡 Expected monthly_games_minutes:', session.duration_minutes);
    } else {
      console.log('\n❌ This session was before the reset');
    }
  } else {
    console.log('❌ No completed game sessions found');
  }
  
  db.close();
});