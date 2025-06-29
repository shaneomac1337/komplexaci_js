const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/analytics.db');

console.log('🔍 Checking ALL ZanderOconner game sessions...');

// Check all game sessions for ZanderOconner today
db.all('SELECT * FROM game_sessions WHERE user_id = "239823014126944257" AND DATE(start_time) = "2025-06-29" ORDER BY start_time DESC', (err, sessions) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('🎮 All game sessions for ZanderOconner today:');
  sessions.forEach((session, index) => {
    console.log(`  ${index + 1}. ${session.game_name}:`);
    console.log(`     - Duration: ${session.duration_minutes} minutes`);
    console.log(`     - Status: ${session.status}`);
    console.log(`     - Start: ${session.start_time}`);
    console.log(`     - End: ${session.end_time || 'NULL'}`);
    console.log(`     - ID: ${session.id}`);
  });
  
  const resetTime = '2025-06-29T09:48:16.172Z';
  console.log('\n📅 Monthly reset time:', resetTime);
  
  // Check sessions after reset
  const postResetSessions = sessions.filter(session => 
    new Date(session.start_time) > new Date(resetTime)
  );
  
  console.log('\n🔍 Sessions AFTER monthly reset:');
  let totalPostResetMinutes = 0;
  let completedPostResetMinutes = 0;
  
  postResetSessions.forEach(session => {
    console.log(`  - ${session.game_name}: ${session.duration_minutes}min (${session.status})`);
    totalPostResetMinutes += session.duration_minutes;
    if (session.status === 'completed') {
      completedPostResetMinutes += session.duration_minutes;
    }
  });
  
  console.log('\n📊 Summary:');
  console.log(`  - Total sessions after reset: ${postResetSessions.length}`);
  console.log(`  - Total minutes (all): ${totalPostResetMinutes}`);
  console.log(`  - Total minutes (completed only): ${completedPostResetMinutes}`);
  console.log(`  - Current monthly_games_minutes in DB: 0`);
  
  if (completedPostResetMinutes > 0) {
    console.log('\n✅ There ARE completed sessions that should be in monthly stats!');
  } else if (totalPostResetMinutes > 0) {
    console.log('\n⚠️ There are sessions but none marked as completed yet');
  } else {
    console.log('\n❌ No sessions found after reset');
  }
  
  db.close();
});