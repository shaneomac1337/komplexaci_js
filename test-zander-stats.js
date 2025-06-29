const sqlite3 = require('sqlite3').verbose();

async function checkZanderStats() {
    const db = new sqlite3.Database('./data/analytics.db');
    
    console.log('🔍 Checking ZanderOconner stats...');
    
    // Check user_stats
    db.get('SELECT * FROM user_stats WHERE user_id = ?', ['308290885109800960'], (err, row) => {
        if (err) {
            console.error('Error:', err);
            return;
        }
        
        if (row) {
            console.log('📊 ZanderOconner user_stats:');
            console.log('Daily games:', row.daily_games_played);
            console.log('Monthly games:', row.monthly_games_played);
            console.log('Daily online minutes:', row.daily_online_minutes);
            console.log('Monthly online minutes:', row.monthly_online_minutes);
            console.log('Last updated:', row.last_updated);
            console.log('Monthly reset date:', row.monthly_reset_date);
        } else {
            console.log('❌ User not found');
        }
        
        // Check game sessions from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();
        
        db.all(`
            SELECT game_name, duration_minutes, start_time
            FROM game_sessions
            WHERE user_id = ? AND start_time >= ?
            ORDER BY start_time DESC
        `, ['308290885109800960', thirtyDaysAgoStr], (err, sessions) => {
            if (err) {
                console.error('Error:', err);
                return;
            }
            
            console.log('\n🎮 Game sessions from last 30 days:');
            let totalMinutes = 0;
            sessions.forEach(session => {
                console.log(`Game: ${session.game_name}, Duration: ${session.duration_minutes}min, Start: ${session.start_time}`);
                totalMinutes += session.duration_minutes || 0;
            });
            
            console.log(`\n📊 Total game minutes in last 30 days: ${totalMinutes}`);
            console.log(`📊 Total sessions in last 30 days: ${sessions.length}`);
            
            db.close();
        });
    });
}

checkZanderStats();