const Database = require('better-sqlite3');
const path = require('path');

function checkCurrentSpotifySongs() {
  console.log('🎵 Checking current Spotify song counts...\n');
  
  try {
    // Connect to database directly
    const dbPath = path.join(__dirname, 'analytics.db');
    const db = new Database(dbPath);
    
    const userId = '396360380038774784'; // shaneomac's ID
    const today = new Date().toISOString().split('T')[0];
    
    // Check current user stats
    console.log('📊 Current user stats:');
    const userStats = db.prepare(`
      SELECT * FROM user_stats WHERE user_id = ?
    `).get(userId);
    
    if (userStats) {
      console.log(`  Daily Spotify songs: ${userStats.daily_spotify_songs}`);
      console.log(`  Monthly Spotify songs: ${userStats.monthly_spotify_songs}`);
      console.log(`  Daily Spotify minutes: ${userStats.daily_spotify_minutes}`);
      console.log(`  Monthly Spotify minutes: ${userStats.monthly_spotify_minutes}`);
      console.log(`  Last updated: ${userStats.updated_at}`);
    } else {
      console.log('  No user stats found');
    }
    
    // Check today's Spotify sessions
    console.log(`\n🎵 Today's Spotify sessions (${today}):`);
    const spotifySessions = db.prepare(`
      SELECT * FROM spotify_sessions 
      WHERE user_id = ? AND date(start_time) = ? 
      ORDER BY start_time DESC
    `).all(userId, today);
    
    spotifySessions.forEach((session, index) => {
      const startTime = new Date(session.start_time).toLocaleTimeString();
      console.log(`  ${index + 1}. "${session.track_name}" by ${session.artist}`);
      console.log(`     Status: ${session.status}, Duration: ${session.duration_minutes}m`);
      console.log(`     Started: ${startTime}`);
    });
    
    console.log(`\n📈 Total Spotify sessions today: ${spotifySessions.length}`);
    
    // Count active vs ended sessions
    const activeSessions = spotifySessions.filter(s => s.status === 'active').length;
    const endedSessions = spotifySessions.filter(s => s.status === 'ended').length;
    console.log(`  Active sessions: ${activeSessions}`);
    console.log(`  Ended sessions: ${endedSessions}`);
    
    // Test immediate update logic
    console.log('\n🧪 Testing immediate update logic...');
    
    // Count songs using the same logic as the immediate update
    const songCount = db.prepare(`
      SELECT COUNT(*) as songs_played
      FROM spotify_sessions
      WHERE user_id = ? AND date(start_time) = ? AND status IN ('active', 'ended')
    `).get(userId, today);
    
    console.log(`📊 Song count from query: ${songCount.songs_played}`);
    
    if (userStats && songCount.songs_played !== userStats.daily_spotify_songs) {
      console.log(`⚠️ MISMATCH: Database shows ${songCount.songs_played} songs but user_stats shows ${userStats.daily_spotify_songs}`);
      console.log('🔄 This suggests the immediate update is not working yet');
    } else if (userStats) {
      console.log('✅ Song counts match between sessions and user_stats');
    }
    
    // Show recent activity
    console.log('\n🕐 Recent Spotify activity (last 10 sessions):');
    const recentSessions = db.prepare(`
      SELECT * FROM spotify_sessions 
      WHERE user_id = ? 
      ORDER BY start_time DESC 
      LIMIT 10
    `).all(userId);
    
    recentSessions.forEach((session, index) => {
      const startTime = new Date(session.start_time).toLocaleString();
      const date = new Date(session.start_time).toISOString().split('T')[0];
      console.log(`  ${index + 1}. "${session.track_name}" by ${session.artist} (${date})`);
      console.log(`     Status: ${session.status}, Duration: ${session.duration_minutes}m, Started: ${startTime}`);
    });
    
    db.close();
    
    console.log('\n💡 Next steps:');
    console.log('  1. Play a new song on Spotify');
    console.log('  2. Wait for Discord to detect the change');
    console.log('  3. The Analytics Service should immediately update song counts');
    console.log('  4. Check if the UI shows the updated count without waiting 60 seconds');
    
  } catch (error) {
    console.error('❌ Error checking Spotify songs:', error);
  }
}

checkCurrentSpotifySongs();