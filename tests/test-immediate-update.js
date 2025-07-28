const Database = require('better-sqlite3');
const path = require('path');

const userId = '1282037953043894283'; // Nefes playing 4Glory
const dbPath = path.join(__dirname, 'data', 'analytics.db');
const db = new Database(dbPath);

console.log('🔍 Testing immediate update logic manually...');

// Get user's last daily reset time to only count sessions after reset
const initialUserStats = db.prepare('SELECT * FROM user_stats WHERE user_id = ?').get(userId);
const resetTime = initialUserStats?.last_daily_reset || new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';

console.log(`User stats:`, initialUserStats);
console.log(`Reset time: ${resetTime}`);

// Test the new query logic
const gameStats = db.prepare(`
  SELECT
    SUM(duration_minutes) as total_minutes,
    COUNT(DISTINCT game_name) as games_played
  FROM game_sessions
  WHERE user_id = ? AND (
    (start_time >= ? AND status IN ('active', 'ended')) OR
    (status = 'active')
  )
`).get(userId, resetTime);

console.log(`Game stats result:`, gameStats);

// Show all sessions being counted
const allSessions = db.prepare(`
  SELECT id, game_name, start_time, end_time, duration_minutes, status
  FROM game_sessions
  WHERE user_id = ? AND (
    (start_time >= ? AND status IN ('active', 'ended')) OR
    (status = 'active')
  )
  ORDER BY start_time DESC
`).all(userId, resetTime);

console.log(`All sessions being counted:`, allSessions);

// Show ALL sessions for comparison
const allUserSessions = db.prepare(`
  SELECT id, game_name, start_time, end_time, duration_minutes, status
  FROM game_sessions
  WHERE user_id = ?
  ORDER BY start_time DESC
`).all(userId);

console.log(`ALL user sessions:`, allUserSessions);

// Test the API query logic
console.log('\n🔍 Testing API query logic...');
const apiGameSessions = db.prepare(`
  SELECT
    game_name,
    COUNT(*) as session_count,
    SUM(duration_minutes) as total_minutes,
    AVG(duration_minutes) as avg_minutes,
    MIN(start_time) as first_played,
    MAX(start_time) as last_played
  FROM game_sessions
  WHERE user_id = ? AND (
    (start_time >= ? AND status IN ('active', 'ended')) OR
    (status = 'active')
  )
  GROUP BY game_name
  ORDER BY total_minutes DESC
`).all(userId, resetTime);

console.log(`API game sessions result:`, apiGameSessions);

db.close();
