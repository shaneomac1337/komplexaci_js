import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface DailySnapshot {
  user_id: string;
  date: string; // YYYY-MM-DD format
  online_minutes: number;
  voice_minutes: number;
  games_played: number;
  spotify_minutes: number;
  created_at: string;
}

export interface UserStats {
  user_id: string;
  daily_online_minutes: number;
  daily_voice_minutes: number;
  daily_games_played: number;
  daily_games_minutes: number;
  daily_spotify_minutes: number;
  daily_spotify_songs: number;
  daily_streaming_minutes: number;
  monthly_online_minutes: number;
  monthly_voice_minutes: number;
  monthly_games_played: number;
  monthly_games_minutes: number;
  monthly_spotify_minutes: number;
  monthly_spotify_songs: number;
  monthly_streaming_minutes: number;
  last_daily_reset: string;
  last_monthly_reset: string;
  created_at: string;
  updated_at: string;
}

export interface GameSession {
  id?: number;
  user_id: string;
  game_name: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  last_updated: string;
  status: 'active' | 'ended' | 'stale';
  created_at: string;
}

export interface VoiceSession {
  id?: number;
  user_id: string;
  channel_id: string;
  channel_name: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  screen_share_minutes: number;
  last_updated: string;
  status: 'active' | 'ended' | 'stale';
  created_at: string;
}

export interface SpotifySession {
  id?: number;
  user_id: string;
  track_name: string;
  artist: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  last_updated: string;
  status: 'active' | 'ended' | 'stale';
  created_at: string;
}



class AnalyticsDatabase {
  private db: Database.Database;
  private isInitialized = false;

  constructor() {
    // Use environment variable for data directory, fallback to ./data
    const dataDir = process.env.ANALYTICS_DATA_DIR || path.join(process.cwd(), 'data');

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`📁 Created analytics data directory: ${dataDir}`);
    }

    // Initialize database
    const dbPath = path.join(dataDir, 'analytics.db');
    this.db = new Database(dbPath);
    
    // Enable performance optimizations
    this.setupPerformanceOptimizations();
    
    // Initialize schema
    this.initializeSchema();

    // Run migrations for existing databases
    this.runMigrations();
    
    console.log('📊 Analytics database initialized:', dbPath);
  }

  private setupPerformanceOptimizations() {
    try {
      // Enable WAL mode for better concurrent performance
      this.db.pragma('journal_mode = WAL');

      // Optimize for performance
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 10000');
      this.db.pragma('temp_store = MEMORY');

      console.log('⚡ Database performance optimizations enabled');
    } catch (error) {
      console.error('❌ Failed to set performance optimizations:', error);
    }
  }

  private runMigrations() {
    try {
      // Migration 1: Add daily_streaming_minutes and monthly_streaming_minutes columns
      const columns = this.db.prepare("PRAGMA table_info(user_stats)").all() as any[];
      const hasStreamingColumns = columns.some(col => col.name === 'daily_streaming_minutes');

      if (!hasStreamingColumns) {
        console.log('🔄 Running migration: Adding streaming minutes columns...');

        this.db.prepare(`
          ALTER TABLE user_stats
          ADD COLUMN daily_streaming_minutes INTEGER DEFAULT 0
        `).run();

        this.db.prepare(`
          ALTER TABLE user_stats
          ADD COLUMN monthly_streaming_minutes INTEGER DEFAULT 0
        `).run();

        console.log('✅ Migration completed: Added daily_streaming_minutes and monthly_streaming_minutes columns');
      }
    } catch (error) {
      console.error('❌ Migration failed:', error);
    }
  }

  private initializeSchema() {
    try {
      // Create tables with proper indexes
      this.db.exec(`
        -- Daily activity snapshots (historical data)
        CREATE TABLE IF NOT EXISTS daily_snapshots (
          user_id TEXT NOT NULL,
          date TEXT NOT NULL,
          online_minutes INTEGER DEFAULT 0,
          voice_minutes INTEGER DEFAULT 0,
          games_played INTEGER DEFAULT 0,
          spotify_minutes INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, date)
        );

        -- User statistics with separate 1-day and 30-day tracking
        CREATE TABLE IF NOT EXISTS user_stats (
          user_id TEXT PRIMARY KEY,
          daily_online_minutes INTEGER DEFAULT 0,
          daily_voice_minutes INTEGER DEFAULT 0,
          daily_games_played INTEGER DEFAULT 0,
          daily_games_minutes INTEGER DEFAULT 0,
          daily_spotify_minutes INTEGER DEFAULT 0,
          daily_spotify_songs INTEGER DEFAULT 0,
          daily_streaming_minutes INTEGER DEFAULT 0,
          monthly_online_minutes INTEGER DEFAULT 0,
          monthly_voice_minutes INTEGER DEFAULT 0,
          monthly_games_played INTEGER DEFAULT 0,
          monthly_games_minutes INTEGER DEFAULT 0,
          monthly_spotify_minutes INTEGER DEFAULT 0,
          monthly_spotify_songs INTEGER DEFAULT 0,
          monthly_streaming_minutes INTEGER DEFAULT 0,
          last_daily_reset TEXT DEFAULT CURRENT_TIMESTAMP,
          last_monthly_reset TEXT DEFAULT CURRENT_TIMESTAMP,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- Game sessions tracking
        CREATE TABLE IF NOT EXISTS game_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          game_name TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT,
          duration_minutes INTEGER DEFAULT 0,
          last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
          status TEXT DEFAULT 'active',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- Voice channel sessions
        CREATE TABLE IF NOT EXISTS voice_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          channel_id TEXT NOT NULL,
          channel_name TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT,
          duration_minutes INTEGER DEFAULT 0,
          screen_share_minutes INTEGER DEFAULT 0,
          last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
          status TEXT DEFAULT 'active',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- Spotify listening sessions
        CREATE TABLE IF NOT EXISTS spotify_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          track_name TEXT NOT NULL,
          artist TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT,
          duration_minutes INTEGER DEFAULT 0,
          last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
          status TEXT DEFAULT 'active',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );


      `);

      // Handle database migration for existing records BEFORE creating indexes
      this.migrateExistingData();

      // Create indexes for better query performance (after migration)
      this.createIndexes();

      this.isInitialized = true;
      console.log('✅ Analytics database schema initialized');
    } catch (error) {
      console.error('❌ Failed to initialize database schema:', error);
      throw error;
    }
  }

  private migrateExistingData() {
    try {
      // Check if migration is needed by looking for missing columns
      const gameSessionsInfo = this.db.pragma('table_info(game_sessions)') as any[];
      const voiceSessionsInfo = this.db.pragma('table_info(voice_sessions)') as any[];
      const spotifySessionsInfo = this.db.pragma('table_info(spotify_sessions)') as any[];
      const userStatsInfo = this.db.pragma('table_info(user_stats)') as any[];

      const gameHasLastUpdated = gameSessionsInfo.some((col: any) => col.name === 'last_updated');
      const gameHasStatus = gameSessionsInfo.some((col: any) => col.name === 'status');
      const voiceHasLastUpdated = voiceSessionsInfo.some((col: any) => col.name === 'last_updated');
      const voiceHasStatus = voiceSessionsInfo.some((col: any) => col.name === 'status');
      const spotifyHasLastUpdated = spotifySessionsInfo.some((col: any) => col.name === 'last_updated');
      const spotifyHasStatus = spotifySessionsInfo.some((col: any) => col.name === 'status');
      const userStatsHasMonthlyGamesMinutes = userStatsInfo.some((col: any) => col.name === 'monthly_games_minutes');
      const userStatsHasDailyGamesMinutes = userStatsInfo.some((col: any) => col.name === 'daily_games_minutes');
      const userStatsHasDailySpotifySongs = userStatsInfo.some((col: any) => col.name === 'daily_spotify_songs');
      const userStatsHasMonthlySpotifySongs = userStatsInfo.some((col: any) => col.name === 'monthly_spotify_songs');

      const needsMigration = !gameHasLastUpdated || !gameHasStatus ||
                            !voiceHasLastUpdated || !voiceHasStatus ||
                            !spotifyHasLastUpdated || !spotifyHasStatus ||
                            !userStatsHasMonthlyGamesMinutes ||
                            !userStatsHasDailyGamesMinutes ||
                            !userStatsHasDailySpotifySongs ||
                            !userStatsHasMonthlySpotifySongs;

      if (needsMigration) {
        console.log('🔄 Migrating existing session data...');

        // Add missing columns to game_sessions
        if (!gameHasLastUpdated) {
          this.db.exec(`ALTER TABLE game_sessions ADD COLUMN last_updated TEXT DEFAULT CURRENT_TIMESTAMP;`);
          console.log('✅ Added last_updated column to game_sessions');
        }
        if (!gameHasStatus) {
          this.db.exec(`ALTER TABLE game_sessions ADD COLUMN status TEXT DEFAULT 'active';`);
          console.log('✅ Added status column to game_sessions');
        }

        // Add missing columns to voice_sessions
        if (!voiceHasLastUpdated) {
          this.db.exec(`ALTER TABLE voice_sessions ADD COLUMN last_updated TEXT DEFAULT CURRENT_TIMESTAMP;`);
          console.log('✅ Added last_updated column to voice_sessions');
        }
        if (!voiceHasStatus) {
          this.db.exec(`ALTER TABLE voice_sessions ADD COLUMN status TEXT DEFAULT 'active';`);
          console.log('✅ Added status column to voice_sessions');
        }

        // Add missing columns to spotify_sessions
        if (!spotifyHasLastUpdated) {
          this.db.exec(`ALTER TABLE spotify_sessions ADD COLUMN last_updated TEXT DEFAULT CURRENT_TIMESTAMP;`);
          console.log('✅ Added last_updated column to spotify_sessions');
        }
        if (!spotifyHasStatus) {
          this.db.exec(`ALTER TABLE spotify_sessions ADD COLUMN status TEXT DEFAULT 'active';`);
          console.log('✅ Added status column to spotify_sessions');
        }

        // Add missing games minutes columns to user_stats
        if (!userStatsHasMonthlyGamesMinutes) {
          this.db.exec(`ALTER TABLE user_stats ADD COLUMN monthly_games_minutes INTEGER DEFAULT 0;`);
          console.log('✅ Added monthly_games_minutes column to user_stats');
        }
        if (!userStatsHasDailyGamesMinutes) {
          this.db.exec(`ALTER TABLE user_stats ADD COLUMN daily_games_minutes INTEGER DEFAULT 0;`);
          console.log('✅ Added daily_games_minutes column to user_stats');
        }

        // Add missing spotify songs columns to user_stats
        if (!userStatsHasDailySpotifySongs) {
          this.db.exec(`ALTER TABLE user_stats ADD COLUMN daily_spotify_songs INTEGER DEFAULT 0;`);
          console.log('✅ Added daily_spotify_songs column to user_stats');
        }
        if (!userStatsHasMonthlySpotifySongs) {
          this.db.exec(`ALTER TABLE user_stats ADD COLUMN monthly_spotify_songs INTEGER DEFAULT 0;`);
          console.log('✅ Added monthly_spotify_songs column to user_stats');
        }

        // Update existing records: mark sessions with end_time as 'ended', others as 'stale'
        const updateQueries = [
          `UPDATE game_sessions SET
            status = CASE WHEN end_time IS NOT NULL THEN 'ended' ELSE 'stale' END,
            last_updated = COALESCE(end_time, start_time)
          WHERE (status IS NULL OR status = 'active') AND end_time IS NULL;`,

          `UPDATE voice_sessions SET
            status = CASE WHEN end_time IS NOT NULL THEN 'ended' ELSE 'stale' END,
            last_updated = COALESCE(end_time, start_time)
          WHERE (status IS NULL OR status = 'active') AND end_time IS NULL;`,

          `UPDATE spotify_sessions SET
            status = CASE WHEN end_time IS NOT NULL THEN 'ended' ELSE 'stale' END,
            last_updated = COALESCE(end_time, start_time)
          WHERE (status IS NULL OR status = 'active') AND end_time IS NULL;`
        ];

        updateQueries.forEach((query, index) => {
          try {
            this.db.exec(query);
            console.log(`✅ Updated existing records for table ${index + 1}`);
          } catch (updateError) {
            console.warn(`⚠️ Warning updating table ${index + 1}:`, updateError);
          }
        });

        console.log('✅ Database migration completed successfully');
      } else {
        console.log('✅ Database schema is up to date, no migration needed');
      }
    } catch (error) {
      console.warn('⚠️ Database migration warning:', error);
      // Don't throw error for migration issues, just log them
    }
  }

  private createIndexes() {
    // Check which columns exist before creating indexes
    const gameSessionsInfo = this.db.pragma('table_info(game_sessions)') as any[];
    const voiceSessionsInfo = this.db.pragma('table_info(voice_sessions)') as any[];
    const spotifySessionsInfo = this.db.pragma('table_info(spotify_sessions)') as any[];

    const gameHasStatus = gameSessionsInfo.some((col: any) => col.name === 'status');
    const gameHasLastUpdated = gameSessionsInfo.some((col: any) => col.name === 'last_updated');
    const voiceHasStatus = voiceSessionsInfo.some((col: any) => col.name === 'status');
    const voiceHasLastUpdated = voiceSessionsInfo.some((col: any) => col.name === 'last_updated');
    const spotifyHasStatus = spotifySessionsInfo.some((col: any) => col.name === 'status');
    const spotifyHasLastUpdated = spotifySessionsInfo.some((col: any) => col.name === 'last_updated');

    const indexes = [
      // Always safe indexes
      'CREATE INDEX IF NOT EXISTS idx_daily_snapshots_date ON daily_snapshots(date)',
      'CREATE INDEX IF NOT EXISTS idx_daily_snapshots_user_date ON daily_snapshots(user_id, date)',
      'CREATE INDEX IF NOT EXISTS idx_user_stats_daily_reset ON user_stats(last_daily_reset)',
      'CREATE INDEX IF NOT EXISTS idx_user_stats_monthly_reset ON user_stats(last_monthly_reset)',
      'CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_game_sessions_start_time ON game_sessions(start_time)',
      'CREATE INDEX IF NOT EXISTS idx_game_sessions_game_name ON game_sessions(game_name)',
      'CREATE INDEX IF NOT EXISTS idx_voice_sessions_user ON voice_sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_voice_sessions_start_time ON voice_sessions(start_time)',
      'CREATE INDEX IF NOT EXISTS idx_spotify_sessions_user ON spotify_sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_spotify_sessions_artist ON spotify_sessions(artist)',
    ];

    // Conditional indexes based on column existence
    if (gameHasStatus) {
      indexes.push('CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status)');
    }
    if (gameHasLastUpdated) {
      indexes.push('CREATE INDEX IF NOT EXISTS idx_game_sessions_last_updated ON game_sessions(last_updated)');
    }
    if (voiceHasStatus) {
      indexes.push('CREATE INDEX IF NOT EXISTS idx_voice_sessions_status ON voice_sessions(status)');
    }
    if (voiceHasLastUpdated) {
      indexes.push('CREATE INDEX IF NOT EXISTS idx_voice_sessions_last_updated ON voice_sessions(last_updated)');
    }
    if (spotifyHasStatus) {
      indexes.push('CREATE INDEX IF NOT EXISTS idx_spotify_sessions_status ON spotify_sessions(status)');
    }
    if (spotifyHasLastUpdated) {
      indexes.push('CREATE INDEX IF NOT EXISTS idx_spotify_sessions_last_updated ON spotify_sessions(last_updated)');
    }

    let createdIndexes = 0;
    indexes.forEach(indexSql => {
      try {
        this.db.exec(indexSql);
        createdIndexes++;
      } catch (error) {
        console.warn('⚠️ Index creation warning:', error);
      }
    });

    console.log(`📈 Created ${createdIndexes}/${indexes.length} database indexes`);
  }

  // Health check method
  public healthCheck(): { status: 'healthy' | 'error', details: any } {
    try {
      // Test database connection
      const result = this.db.prepare('SELECT 1 as test').get();
      
      // Get database info
      const info = {
        isOpen: this.db.open,
        inTransaction: this.db.inTransaction,
        memory: this.db.memory,
        readonly: this.db.readonly,
        initialized: this.isInitialized,
        testQuery: result
      };

      return { status: 'healthy', details: info };
    } catch (error) {
      return { status: 'error', details: error };
    }
  }

  // Get database instance for direct queries (use carefully)
  public getDatabase(): Database.Database {
    return this.db;
  }

  // === DATA ACCESS METHODS ===

  // Daily snapshots
  public upsertDailySnapshot(snapshot: Omit<DailySnapshot, 'created_at'>) {
    const stmt = this.db.prepare(`
      INSERT INTO daily_snapshots (user_id, date, online_minutes, voice_minutes, games_played, spotify_minutes)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, date) DO UPDATE SET
        online_minutes = excluded.online_minutes,
        voice_minutes = excluded.voice_minutes,
        games_played = excluded.games_played,
        spotify_minutes = excluded.spotify_minutes
    `);
    return stmt.run(snapshot.user_id, snapshot.date, snapshot.online_minutes,
                   snapshot.voice_minutes, snapshot.games_played, snapshot.spotify_minutes);
  }

  public getDailySnapshot(userId: string, date: string): DailySnapshot | null {
    const stmt = this.db.prepare('SELECT * FROM daily_snapshots WHERE user_id = ? AND date = ?');
    return stmt.get(userId, date) as DailySnapshot | null;
  }

  public getDailySnapshots(userId?: string, startDate?: string, endDate?: string) {
    let query = 'SELECT * FROM daily_snapshots WHERE 1=1';
    const params: any[] = [];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }
    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY date DESC';
    return this.db.prepare(query).all(...params) as DailySnapshot[];
  }

  // Game sessions
  public insertGameSession(session: Omit<GameSession, 'id' | 'created_at'>) {
    const stmt = this.db.prepare(`
      INSERT INTO game_sessions (user_id, game_name, start_time, end_time, duration_minutes, last_updated, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(session.user_id, session.game_name, session.start_time,
                   session.end_time, session.duration_minutes, session.last_updated, session.status);
  }

  public getGameSession(id: number): GameSession | null {
    const stmt = this.db.prepare('SELECT * FROM game_sessions WHERE id = ?');
    return stmt.get(id) as GameSession | null;
  }

  public updateGameSession(id: number, endTime: string, durationMinutes: number) {
    const stmt = this.db.prepare(`
      UPDATE game_sessions SET end_time = ?, duration_minutes = ?, status = 'ended', last_updated = CURRENT_TIMESTAMP WHERE id = ?
    `);
    return stmt.run(endTime, durationMinutes, id);
  }

  public updateGameSessionProgress(id: number, durationMinutes: number) {
    const stmt = this.db.prepare(`
      UPDATE game_sessions SET duration_minutes = ?, last_updated = ? WHERE id = ?
    `);
    return stmt.run(durationMinutes, new Date().toISOString(), id);
  }

  public getActiveGameSessions(userId?: string) {
    let query = "SELECT * FROM game_sessions WHERE status = 'active'";
    const params: any[] = [];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    return this.db.prepare(query).all(...params) as GameSession[];
  }

  public getStaleGameSessions(staleMinutes: number = 5) {
    const staleTime = new Date();
    staleTime.setMinutes(staleTime.getMinutes() - staleMinutes);
    const staleTimeStr = staleTime.toISOString();

    const stmt = this.db.prepare(`
      SELECT * FROM game_sessions
      WHERE status = 'active' AND last_updated < ?
    `);
    return stmt.all(staleTimeStr) as GameSession[];
  }

  public markGameSessionAsStale(id: number, endTime: string, durationMinutes: number) {
    const stmt = this.db.prepare(`
      UPDATE game_sessions SET end_time = ?, duration_minutes = ?, status = 'stale', last_updated = CURRENT_TIMESTAMP WHERE id = ?
    `);
    return stmt.run(endTime, durationMinutes, id);
  }

  // Voice sessions
  public insertVoiceSession(session: Omit<VoiceSession, 'id' | 'created_at'>) {
    const stmt = this.db.prepare(`
      INSERT INTO voice_sessions (user_id, channel_id, channel_name, start_time, end_time, duration_minutes, screen_share_minutes, last_updated, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(session.user_id, session.channel_id, session.channel_name,
                   session.start_time, session.end_time, session.duration_minutes, session.screen_share_minutes, session.last_updated, session.status);
  }

  public updateVoiceSession(id: number, endTime: string, durationMinutes: number, screenShareMinutes: number) {
    const stmt = this.db.prepare(`
      UPDATE voice_sessions SET end_time = ?, duration_minutes = ?, screen_share_minutes = ?, status = 'ended', last_updated = CURRENT_TIMESTAMP WHERE id = ?
    `);
    return stmt.run(endTime, durationMinutes, screenShareMinutes, id);
  }

  public updateVoiceSessionProgress(id: number, durationMinutes: number, screenShareMinutes: number) {
    const stmt = this.db.prepare(`
      UPDATE voice_sessions SET duration_minutes = ?, screen_share_minutes = ?, last_updated = ? WHERE id = ?
    `);
    return stmt.run(durationMinutes, screenShareMinutes, new Date().toISOString(), id);
  }

  public getActiveVoiceSessions(userId?: string) {
    let query = "SELECT * FROM voice_sessions WHERE status = 'active'";
    const params: any[] = [];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    return this.db.prepare(query).all(...params) as VoiceSession[];
  }

  public getStaleVoiceSessions(staleMinutes: number = 5) {
    const staleTime = new Date();
    staleTime.setMinutes(staleTime.getMinutes() - staleMinutes);
    const staleTimeStr = staleTime.toISOString();

    const stmt = this.db.prepare(`
      SELECT * FROM voice_sessions
      WHERE status = 'active' AND last_updated < ?
    `);
    return stmt.all(staleTimeStr) as VoiceSession[];
  }

  public markVoiceSessionAsStale(id: number, endTime: string, durationMinutes: number, screenShareMinutes: number) {
    const stmt = this.db.prepare(`
      UPDATE voice_sessions SET end_time = ?, duration_minutes = ?, screen_share_minutes = ?, status = 'stale', last_updated = CURRENT_TIMESTAMP WHERE id = ?
    `);
    return stmt.run(endTime, durationMinutes, screenShareMinutes, id);
  }

  // Spotify sessions
  public insertSpotifySession(session: Omit<SpotifySession, 'id' | 'created_at'>) {
    const stmt = this.db.prepare(`
      INSERT INTO spotify_sessions (user_id, track_name, artist, start_time, end_time, duration_minutes, last_updated, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(session.user_id, session.track_name, session.artist,
                   session.start_time, session.end_time, session.duration_minutes, session.last_updated, session.status);
  }

  public updateSpotifySession(id: number, endTime: string, durationMinutes: number) {
    const stmt = this.db.prepare(`
      UPDATE spotify_sessions SET end_time = ?, duration_minutes = ?, status = 'ended', last_updated = CURRENT_TIMESTAMP WHERE id = ?
    `);
    return stmt.run(endTime, durationMinutes, id);
  }

  public updateSpotifySessionProgress(id: number, durationMinutes: number) {
    const stmt = this.db.prepare(`
      UPDATE spotify_sessions SET duration_minutes = ?, last_updated = ? WHERE id = ?
    `);
    return stmt.run(durationMinutes, new Date().toISOString(), id);
  }

  public getActiveSpotifySessions(userId?: string) {
    let query = "SELECT * FROM spotify_sessions WHERE status = 'active'";
    const params: any[] = [];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    return this.db.prepare(query).all(...params) as SpotifySession[];
  }

  public getStaleSpotifySessions(staleMinutes: number = 5) {
    const staleTime = new Date();
    staleTime.setMinutes(staleTime.getMinutes() - staleMinutes);
    const staleTimeStr = staleTime.toISOString();

    const stmt = this.db.prepare(`
      SELECT * FROM spotify_sessions
      WHERE status = 'active' AND last_updated < ?
    `);
    return stmt.all(staleTimeStr) as SpotifySession[];
  }

  public markSpotifySessionAsStale(id: number, endTime: string, durationMinutes: number) {
    const stmt = this.db.prepare(`
      UPDATE spotify_sessions SET end_time = ?, duration_minutes = ?, status = 'stale', last_updated = CURRENT_TIMESTAMP WHERE id = ?
    `);
    return stmt.run(endTime, durationMinutes, id);
  }

  // === DATA RETENTION METHODS ===

  public getDataRetentionInfo(retentionDays: number = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    const oldDataCounts = {
      dailySnapshots: this.db.prepare('SELECT COUNT(*) as count FROM daily_snapshots WHERE date < ?').get(cutoffDateStr) as any,
      gameSessions: this.db.prepare('SELECT COUNT(*) as count FROM game_sessions WHERE DATE(start_time) < ?').get(cutoffDateStr) as any,
      voiceSessions: this.db.prepare('SELECT COUNT(*) as count FROM voice_sessions WHERE DATE(start_time) < ?').get(cutoffDateStr) as any,
      spotifySessions: this.db.prepare('SELECT COUNT(*) as count FROM spotify_sessions WHERE DATE(start_time) < ?').get(cutoffDateStr) as any,
    };

    const recentDataCounts = {
      dailySnapshots: this.db.prepare('SELECT COUNT(*) as count FROM daily_snapshots WHERE date >= ?').get(cutoffDateStr) as any,
      gameSessions: this.db.prepare('SELECT COUNT(*) as count FROM game_sessions WHERE DATE(start_time) >= ?').get(cutoffDateStr) as any,
      voiceSessions: this.db.prepare('SELECT COUNT(*) as count FROM voice_sessions WHERE DATE(start_time) >= ?').get(cutoffDateStr) as any,
      spotifySessions: this.db.prepare('SELECT COUNT(*) as count FROM spotify_sessions WHERE DATE(start_time) >= ?').get(cutoffDateStr) as any,
    };

    return {
      retentionDays,
      cutoffDate: cutoffDateStr,
      oldData: {
        dailySnapshots: oldDataCounts.dailySnapshots?.count || 0,
        gameSessions: oldDataCounts.gameSessions?.count || 0,
        voiceSessions: oldDataCounts.voiceSessions?.count || 0,
        spotifySessions: oldDataCounts.spotifySessions?.count || 0,
      },
      recentData: {
        dailySnapshots: recentDataCounts.dailySnapshots?.count || 0,
        gameSessions: recentDataCounts.gameSessions?.count || 0,
        voiceSessions: recentDataCounts.voiceSessions?.count || 0,
        spotifySessions: recentDataCounts.spotifySessions?.count || 0,
      }
    };
  }

  public cleanupOldData(retentionDays: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    const transaction = this.db.transaction(() => {
      const results = {
        dailySnapshots: this.db.prepare('DELETE FROM daily_snapshots WHERE date < ?').run(cutoffDateStr),
        gameSessions: this.db.prepare('DELETE FROM game_sessions WHERE DATE(start_time) < ?').run(cutoffDateStr),
        voiceSessions: this.db.prepare('DELETE FROM voice_sessions WHERE DATE(start_time) < ?').run(cutoffDateStr),
        spotifySessions: this.db.prepare('DELETE FROM spotify_sessions WHERE DATE(start_time) < ?').run(cutoffDateStr),
      };
      
      return results;
    });

    const results = transaction();
    
    // Vacuum to reclaim space
    this.db.exec('VACUUM');

    return {
      cutoffDate: cutoffDateStr,
      deletedRecords: {
        dailySnapshots: results.dailySnapshots.changes,
        gameSessions: results.gameSessions.changes,
        voiceSessions: results.voiceSessions.changes,
        spotifySessions: results.spotifySessions.changes,
      }
    };
  }

  // === USER STATS MANAGEMENT ===

  public upsertUserStats(stats: Omit<UserStats, 'created_at' | 'updated_at'>) {
    const stmt = this.db.prepare(`
      INSERT INTO user_stats (
        user_id, daily_online_minutes, daily_voice_minutes, daily_games_played, daily_games_minutes, daily_spotify_minutes, daily_spotify_songs, daily_streaming_minutes,
        monthly_online_minutes, monthly_voice_minutes, monthly_games_played, monthly_games_minutes, monthly_spotify_minutes, monthly_spotify_songs, monthly_streaming_minutes,
        last_daily_reset, last_monthly_reset
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        daily_online_minutes = excluded.daily_online_minutes,
        daily_voice_minutes = excluded.daily_voice_minutes,
        daily_games_played = excluded.daily_games_played,
        daily_games_minutes = excluded.daily_games_minutes,
        daily_spotify_minutes = excluded.daily_spotify_minutes,
        daily_spotify_songs = excluded.daily_spotify_songs,
        daily_streaming_minutes = excluded.daily_streaming_minutes,
        monthly_online_minutes = excluded.monthly_online_minutes,
        monthly_voice_minutes = excluded.monthly_voice_minutes,
        monthly_games_played = excluded.monthly_games_played,
        monthly_games_minutes = excluded.monthly_games_minutes,
        monthly_spotify_minutes = excluded.monthly_spotify_minutes,
        monthly_spotify_songs = excluded.monthly_spotify_songs,
        monthly_streaming_minutes = excluded.monthly_streaming_minutes,
        last_daily_reset = excluded.last_daily_reset,
        last_monthly_reset = excluded.last_monthly_reset,
        updated_at = CURRENT_TIMESTAMP
    `);
    return stmt.run(
      stats.user_id, stats.daily_online_minutes, stats.daily_voice_minutes, stats.daily_games_played, stats.daily_games_minutes, stats.daily_spotify_minutes, stats.daily_spotify_songs, stats.daily_streaming_minutes,
      stats.monthly_online_minutes, stats.monthly_voice_minutes, stats.monthly_games_played, stats.monthly_games_minutes, stats.monthly_spotify_minutes, stats.monthly_spotify_songs, stats.monthly_streaming_minutes,
      stats.last_daily_reset, stats.last_monthly_reset
    );
  }

  public getUserStats(userId: string): UserStats | null {
    const stmt = this.db.prepare('SELECT * FROM user_stats WHERE user_id = ?');
    return stmt.get(userId) as UserStats | null;
  }

  public getAllUserStats(): UserStats[] {
    const stmt = this.db.prepare('SELECT * FROM user_stats ORDER BY daily_online_minutes DESC');
    return stmt.all() as UserStats[];
  }

  public resetDailyStats(userId?: string) {
    const now = new Date();
    // Use actual reset time for consistency
    const resetTime = now.toISOString();

    if (userId) {
      // Reset specific user
      const stmt = this.db.prepare(`
        UPDATE user_stats SET
          daily_online_minutes = 0,
          daily_voice_minutes = 0,
          daily_games_played = 0,
          daily_games_minutes = 0,
          daily_spotify_minutes = 0,
          daily_spotify_songs = 0,
          daily_streaming_minutes = 0,
          last_daily_reset = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `);
      return stmt.run(resetTime, userId);
    } else {
      // Reset all users
      const stmt = this.db.prepare(`
        UPDATE user_stats SET
          daily_online_minutes = 0,
          daily_voice_minutes = 0,
          daily_games_played = 0,
          daily_games_minutes = 0,
          daily_spotify_minutes = 0,
          daily_spotify_songs = 0,
          daily_streaming_minutes = 0,
          last_daily_reset = ?,
          updated_at = CURRENT_TIMESTAMP
      `);
      return stmt.run(resetTime);
    }
  }

  public resetMonthlyStats(userId?: string) {
    const now = new Date().toISOString();

    if (userId) {
      // Reset specific user
      const stmt = this.db.prepare(`
        UPDATE user_stats SET
          monthly_online_minutes = 0,
          monthly_voice_minutes = 0,
          monthly_games_played = 0,
          monthly_games_minutes = 0,
          monthly_spotify_minutes = 0,
          monthly_spotify_songs = 0,
          monthly_streaming_minutes = 0,
          last_monthly_reset = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `);
      return stmt.run(now, userId);
    } else {
      // Reset all users
      const stmt = this.db.prepare(`
        UPDATE user_stats SET
          monthly_online_minutes = 0,
          monthly_voice_minutes = 0,
          monthly_games_played = 0,
          monthly_games_minutes = 0,
          monthly_spotify_minutes = 0,
          monthly_spotify_songs = 0,
          monthly_streaming_minutes = 0,
          last_monthly_reset = ?,
          updated_at = CURRENT_TIMESTAMP
      `);
      return stmt.run(now);
    }
  }

  // === DAILY RESET MANAGEMENT ===

  public getCurrentDayData(date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    return {
      dailySnapshots: this.db.prepare('SELECT * FROM daily_snapshots WHERE date = ? ORDER BY user_id').all(targetDate),
      userStats: this.db.prepare('SELECT * FROM user_stats ORDER BY daily_online_minutes DESC').all(),
      todaysSessions: {
        games: this.db.prepare('SELECT * FROM game_sessions WHERE DATE(start_time) = ? ORDER BY start_time DESC').all(targetDate),
        voice: this.db.prepare('SELECT * FROM voice_sessions WHERE DATE(start_time) = ? ORDER BY start_time DESC').all(targetDate),
        spotify: this.db.prepare('SELECT * FROM spotify_sessions WHERE DATE(start_time) = ? ORDER BY start_time DESC').all(targetDate),
      }
    };
  }

  // Close database connection
  public close() {
    try {
      this.db.close();
      console.log('📊 Analytics database connection closed');
    } catch (error) {
      console.error('❌ Error closing database:', error);
    }
  }

  // === TRANSACTION HELPERS ===

  // Run a function within a transaction for atomicity
  public runInTransaction<T>(fn: () => T): T {
    const transaction = this.db.transaction(fn);
    return transaction();
  }

  // Begin a manual transaction (for complex multi-step operations)
  public beginTransaction() {
    this.db.exec('BEGIN IMMEDIATE');
  }

  // Commit a manual transaction
  public commitTransaction() {
    this.db.exec('COMMIT');
  }

  // Rollback a manual transaction
  public rollbackTransaction() {
    this.db.exec('ROLLBACK');
  }
}

// Singleton instance
let analyticsDb: AnalyticsDatabase | null = null;

export function getAnalyticsDatabase(): AnalyticsDatabase {
  if (!analyticsDb) {
    analyticsDb = new AnalyticsDatabase();
  }
  return analyticsDb;
}

export default AnalyticsDatabase;
