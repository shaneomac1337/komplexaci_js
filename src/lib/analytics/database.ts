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

export interface GameSession {
  id?: number;
  user_id: string;
  game_name: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
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
  created_at: string;
}



class AnalyticsDatabase {
  private db: Database.Database;
  private isInitialized = false;

  constructor() {
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Initialize database
    const dbPath = path.join(dataDir, 'analytics.db');
    this.db = new Database(dbPath);
    
    // Enable performance optimizations
    this.setupPerformanceOptimizations();
    
    // Initialize schema
    this.initializeSchema();
    
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

  private initializeSchema() {
    try {
      // Create tables with proper indexes
      this.db.exec(`
        -- Daily activity snapshots
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

        -- Game sessions tracking
        CREATE TABLE IF NOT EXISTS game_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          game_name TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT,
          duration_minutes INTEGER DEFAULT 0,
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
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );


      `);

      // Create indexes for better query performance
      this.createIndexes();
      
      this.isInitialized = true;
      console.log('✅ Analytics database schema initialized');
    } catch (error) {
      console.error('❌ Failed to initialize database schema:', error);
      throw error;
    }
  }

  private createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_daily_snapshots_date ON daily_snapshots(date)',
      'CREATE INDEX IF NOT EXISTS idx_daily_snapshots_user_date ON daily_snapshots(user_id, date)',
      'CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_game_sessions_start_time ON game_sessions(start_time)',
      'CREATE INDEX IF NOT EXISTS idx_game_sessions_game_name ON game_sessions(game_name)',
      'CREATE INDEX IF NOT EXISTS idx_voice_sessions_user ON voice_sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_voice_sessions_start_time ON voice_sessions(start_time)',
      'CREATE INDEX IF NOT EXISTS idx_spotify_sessions_user ON spotify_sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_spotify_sessions_artist ON spotify_sessions(artist)',
      'CREATE INDEX IF NOT EXISTS idx_achievements_user_month ON achievements(user_id, month_year)',
    ];

    indexes.forEach(indexSql => {
      try {
        this.db.exec(indexSql);
      } catch (error) {
        console.warn('⚠️ Index creation warning:', error);
      }
    });

    console.log('📈 Database indexes created');
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
      INSERT INTO game_sessions (user_id, game_name, start_time, end_time, duration_minutes)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(session.user_id, session.game_name, session.start_time,
                   session.end_time, session.duration_minutes);
  }

  public updateGameSession(id: number, endTime: string, durationMinutes: number) {
    const stmt = this.db.prepare(`
      UPDATE game_sessions SET end_time = ?, duration_minutes = ? WHERE id = ?
    `);
    return stmt.run(endTime, durationMinutes, id);
  }

  public getActiveGameSessions(userId?: string) {
    let query = 'SELECT * FROM game_sessions WHERE end_time IS NULL';
    const params: any[] = [];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    return this.db.prepare(query).all(...params) as GameSession[];
  }

  // Voice sessions
  public insertVoiceSession(session: Omit<VoiceSession, 'id' | 'created_at'>) {
    const stmt = this.db.prepare(`
      INSERT INTO voice_sessions (user_id, channel_id, channel_name, start_time, end_time, duration_minutes, screen_share_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(session.user_id, session.channel_id, session.channel_name,
                   session.start_time, session.end_time, session.duration_minutes, session.screen_share_minutes);
  }

  public updateVoiceSession(id: number, endTime: string, durationMinutes: number, screenShareMinutes: number) {
    const stmt = this.db.prepare(`
      UPDATE voice_sessions SET end_time = ?, duration_minutes = ?, screen_share_minutes = ? WHERE id = ?
    `);
    return stmt.run(endTime, durationMinutes, screenShareMinutes, id);
  }

  public getActiveVoiceSessions(userId?: string) {
    let query = 'SELECT * FROM voice_sessions WHERE end_time IS NULL';
    const params: any[] = [];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    return this.db.prepare(query).all(...params) as VoiceSession[];
  }

  // Spotify sessions
  public insertSpotifySession(session: Omit<SpotifySession, 'id' | 'created_at'>) {
    const stmt = this.db.prepare(`
      INSERT INTO spotify_sessions (user_id, track_name, artist, start_time, end_time, duration_minutes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(session.user_id, session.track_name, session.artist,
                   session.start_time, session.end_time, session.duration_minutes);
  }

  public updateSpotifySession(id: number, endTime: string, durationMinutes: number) {
    const stmt = this.db.prepare(`
      UPDATE spotify_sessions SET end_time = ?, duration_minutes = ? WHERE id = ?
    `);
    return stmt.run(endTime, durationMinutes, id);
  }

  public getActiveSpotifySessions(userId?: string) {
    let query = 'SELECT * FROM spotify_sessions WHERE end_time IS NULL';
    const params: any[] = [];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    return this.db.prepare(query).all(...params) as SpotifySession[];
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
