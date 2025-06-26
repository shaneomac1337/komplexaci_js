import { getAnalyticsDatabase, DailySnapshot, GameSession, VoiceSession, SpotifySession } from './database';

export interface UserActivity {
  userId: string;
  displayName: string;
  currentStatus: 'online' | 'idle' | 'dnd' | 'offline';
  currentGame?: string;
  currentSpotify?: { track: string; artist: string };
  isInVoice: boolean;
  isStreaming: boolean; // Renamed from isScreenSharing for consistency
  voiceChannelId?: string;
  voiceChannelName?: string;
  sessionStartTime?: Date;
  gameSessionId?: number;
  voiceSessionId?: number;
  spotifySessionId?: number;
  streamingStartTime?: Date; // Track when streaming started
}

export interface AnalyticsStats {
  totalOnlineTime: number;
  totalVoiceTime: number;
  totalGameTime: number;
  totalSpotifyTime: number;
  mostPlayedGames: Array<{ game: string; minutes: number }>;
  favoriteArtists: Array<{ artist: string; minutes: number }>;
  dailyActivity: Array<{ date: string; minutes: number }>;
}

class AnalyticsService {
  private db = getAnalyticsDatabase();
  private activeUsers = new Map<string, UserActivity>();

  // === USER ACTIVITY TRACKING ===

  public updateUserPresence(userId: string, displayName: string, status: 'online' | 'idle' | 'dnd' | 'offline', activities: any[]) {
    const currentTime = new Date();
    let user = this.activeUsers.get(userId);

    if (!user) {
      user = {
        userId,
        displayName,
        currentStatus: status,
        isInVoice: false,
        isStreaming: false,
      };
      this.activeUsers.set(userId, user);
    }

    // Handle status changes
    if (user.currentStatus !== status) {
      this.handleStatusChange(user, status, currentTime);
    }

    // Handle game activities
    this.handleGameActivities(user, activities, currentTime);

    // Handle Spotify activities
    this.handleSpotifyActivities(user, activities, currentTime);

    // Update user data
    user.currentStatus = status;
    user.displayName = displayName;
    this.activeUsers.set(userId, user);
  }

  public updateUserVoiceState(userId: string, channelId: string | null, channelName: string | null, isStreaming: boolean = false) {
    const currentTime = new Date();
    let user = this.activeUsers.get(userId);

    if (!user) {
      console.warn(`⚠️ User ${userId} not found in active users for voice state update`);
      return;
    }

    // Handle voice channel changes
    if (channelId && !user.isInVoice) {
      // User joined voice channel
      this.startVoiceSession(user, channelId, channelName || 'Unknown Channel', currentTime);
    } else if (!channelId && user.isInVoice) {
      // User left voice channel
      this.endVoiceSession(user, currentTime);
    } else if (user.isInVoice && user.voiceSessionId) {
      // Update streaming status for existing session
      if (user.isStreaming !== isStreaming) {
        if (isStreaming && !user.streamingStartTime) {
          // Started streaming
          user.streamingStartTime = currentTime;
          console.log(`📺 ${user.displayName} started streaming in ${user.voiceChannelName}`);
        } else if (!isStreaming && user.streamingStartTime) {
          // Stopped streaming - calculate and add streaming time
          const streamingMinutes = Math.round((currentTime.getTime() - user.streamingStartTime.getTime()) / (1000 * 60));
          this.addStreamingTimeToSession(user.voiceSessionId, streamingMinutes);
          user.streamingStartTime = undefined;
          console.log(`📺 ${user.displayName} stopped streaming (${streamingMinutes}m total)`);
        }
      }
    }

    // Update user data
    user.isInVoice = !!channelId;
    user.voiceChannelId = channelId || undefined;
    user.voiceChannelName = channelName || undefined;
    user.isStreaming = isStreaming;

    // Clear streaming start time if not in voice
    if (!channelId) {
      user.streamingStartTime = undefined;
    }

    this.activeUsers.set(userId, user);
  }

  // === PRIVATE HELPER METHODS ===

  private handleStatusChange(user: UserActivity, newStatus: 'online' | 'idle' | 'dnd' | 'offline', currentTime: Date) {
    if (newStatus === 'offline') {
      // End all active sessions when user goes offline
      this.endAllUserSessions(user, currentTime);
    } else if (user.currentStatus === 'offline') {
      // User came online, start tracking session
      user.sessionStartTime = currentTime;
    }
  }

  private handleGameActivities(user: UserActivity, activities: any[], currentTime: Date) {
    const gameActivity = activities.find(a => a.type === 0 && !a.name?.toLowerCase().includes('spotify'));

    if (gameActivity && gameActivity.name) {
      const normalizedGameName = this.normalizeGameName(gameActivity.name);

      if (normalizedGameName !== user.currentGame) {
        // End previous game session if exists
        if (user.currentGame && user.gameSessionId) {
          this.endGameSession(user, currentTime);
        }

        // Start new game session
        this.startGameSession(user, normalizedGameName, currentTime);
      }
    } else if (!gameActivity && user.currentGame) {
      // Game ended
      this.endGameSession(user, currentTime);
    }
  }

  // Normalize game names for better analytics
  private normalizeGameName(gameName: string): string {
    const normalizedName = gameName.trim();

    // Common game name mappings
    const gameNameMappings: { [key: string]: string } = {
      'League of Legends (TM) Client': 'League of Legends',
      'VALORANT': 'Valorant',
      'Counter-Strike 2': 'Counter-Strike 2',
      'CS2': 'Counter-Strike 2',
      'Apex Legends': 'Apex Legends',
      'Rocket League': 'Rocket League',
      'World of Warcraft': 'World of Warcraft',
      'Overwatch 2': 'Overwatch 2',
      'Fortnite': 'Fortnite',
      'Minecraft': 'Minecraft',
      'Grand Theft Auto V': 'GTA V',
      'Call of Duty': 'Call of Duty',
      'Dota 2': 'Dota 2',
      'Among Us': 'Among Us',
      'Fall Guys': 'Fall Guys'
    };

    // Check for exact matches first
    if (gameNameMappings[normalizedName]) {
      return gameNameMappings[normalizedName];
    }

    // Check for partial matches (case insensitive)
    for (const [pattern, standardName] of Object.entries(gameNameMappings)) {
      if (normalizedName.toLowerCase().includes(pattern.toLowerCase()) ||
          pattern.toLowerCase().includes(normalizedName.toLowerCase())) {
        return standardName;
      }
    }

    return normalizedName;
  }

  private handleSpotifyActivities(user: UserActivity, activities: any[], currentTime: Date) {
    const spotifyActivity = activities.find(a => a.name?.toLowerCase().includes('spotify') || a.type === 2);

    if (spotifyActivity && spotifyActivity.details && spotifyActivity.state) {
      const track = this.normalizeTrackName(spotifyActivity.details);
      const artist = this.normalizeArtistName(spotifyActivity.state.replace('by ', ''));
      const currentTrack = user.currentSpotify;

      if (!currentTrack || currentTrack.track !== track || currentTrack.artist !== artist) {
        // End previous Spotify session if exists
        if (currentTrack && user.spotifySessionId) {
          this.endSpotifySession(user, currentTime);
        }

        // Start new Spotify session
        this.startSpotifySession(user, track, artist, currentTime);
      }
    } else if (user.currentSpotify) {
      // Spotify stopped
      this.endSpotifySession(user, currentTime);
    }
  }

  // Normalize track names for better analytics
  private normalizeTrackName(trackName: string): string {
    return trackName.trim()
      .replace(/\s+/g, ' ') // Remove extra spaces
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
      .substring(0, 200); // Limit length
  }

  // Normalize artist names for better analytics
  private normalizeArtistName(artistName: string): string {
    return artistName.trim()
      .replace(/\s+/g, ' ') // Remove extra spaces
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
      .replace(/^by\s+/i, '') // Remove "by " prefix if still present
      .substring(0, 100); // Limit length
  }

  private startGameSession(user: UserActivity, gameName: string, startTime: Date) {
    try {
      const result = this.db.insertGameSession({
        user_id: user.userId,
        game_name: gameName,
        start_time: startTime.toISOString(),
        end_time: null,
        duration_minutes: 0
      });

      user.currentGame = gameName;
      user.gameSessionId = result.lastInsertRowid as number;
      console.log(`🎮 Started game session: ${user.displayName} playing ${gameName} (Session ID: ${user.gameSessionId})`);
    } catch (error) {
      console.error('❌ Error starting game session:', error);
    }
  }

  private endGameSession(user: UserActivity, endTime: Date) {
    if (!user.gameSessionId) {
      console.log(`⚠️ No active game session to end for ${user.displayName}`);
      return;
    }

    try {
      console.log(`🎮 Ending game session ${user.gameSessionId} for ${user.displayName}`);

      // Calculate duration from database record
      const sessions = this.db.getActiveGameSessions(user.userId);
      console.log(`📊 Found ${sessions.length} active sessions for ${user.userId}`);

      const session = sessions.find(s => s.id === user.gameSessionId);

      if (session) {
        const startTime = new Date(session.start_time);
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

        console.log(`⏱️ Session duration: ${durationMinutes} minutes (${startTime.toISOString()} to ${endTime.toISOString()})`);

        this.db.updateGameSession(user.gameSessionId, endTime.toISOString(), Math.max(0, durationMinutes));
        console.log(`🎮 Ended game session: ${user.displayName} played ${user.currentGame} for ${durationMinutes} minutes`);
      } else {
        console.error(`❌ Could not find session ${user.gameSessionId} in active sessions`);
      }

      user.currentGame = undefined;
      user.gameSessionId = undefined;
    } catch (error) {
      console.error('❌ Error ending game session:', error);
    }
  }

  private startVoiceSession(user: UserActivity, channelId: string, channelName: string, startTime: Date) {
    try {
      const result = this.db.insertVoiceSession({
        user_id: user.userId,
        channel_id: channelId,
        channel_name: channelName,
        start_time: startTime.toISOString(),
        end_time: null,
        duration_minutes: 0,
        screen_share_minutes: 0
      });
      
      user.voiceSessionId = result.lastInsertRowid as number;
      console.log(`🎤 Started voice session: ${user.displayName} joined ${channelName}`);
    } catch (error) {
      console.error('❌ Error starting voice session:', error);
    }
  }

  private endVoiceSession(user: UserActivity, endTime: Date) {
    if (!user.voiceSessionId) return;

    try {
      // Calculate duration and screen share time from database record
      const sessions = this.db.getActiveVoiceSessions(user.userId);
      const session = sessions.find(s => s.id === user.voiceSessionId);

      if (session) {
        const startTime = new Date(session.start_time);
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

        // Calculate screen share time (this is a simplified approach)
        // In a real implementation, you'd track screen share start/stop times
        const screenShareMinutes = user.isScreenSharing ? Math.round(durationMinutes * 0.7) : 0; // Assume 70% if screen sharing

        this.db.updateVoiceSession(user.voiceSessionId, endTime.toISOString(), Math.max(0, durationMinutes), screenShareMinutes);
        console.log(`🎤 Ended voice session: ${user.displayName} was in voice for ${durationMinutes} minutes${screenShareMinutes > 0 ? ` (${screenShareMinutes}m screen sharing)` : ''}`);
      }

      user.voiceSessionId = undefined;
      user.isInVoice = false;
      user.isStreaming = false;
      user.streamingStartTime = undefined;
    } catch (error) {
      console.error('❌ Error ending voice session:', error);
    }
  }

  // Update screen sharing status for active voice session
  public updateStreamingStatus(userId: string, isStreaming: boolean) {
    const user = this.activeUsers.get(userId);
    if (user && user.isInVoice && user.voiceSessionId) {
      user.isStreaming = isStreaming;
      console.log(`📺 ${user.displayName} ${isStreaming ? 'started' : 'stopped'} streaming`);
    }
  }

  private addStreamingTimeToSession(sessionId: number, streamingMinutes: number) {
    try {
      // Get current screen share minutes and add to it
      const session = this.db.getDatabase().prepare(`
        SELECT screen_share_minutes FROM voice_sessions WHERE id = ?
      `).get(sessionId) as any;

      if (session) {
        const newTotal = (session.screen_share_minutes || 0) + streamingMinutes;
        this.db.getDatabase().prepare(`
          UPDATE voice_sessions
          SET screen_share_minutes = ?
          WHERE id = ?
        `).run(newTotal, sessionId);

        console.log(`📺 Added ${streamingMinutes}m streaming time to session (total: ${newTotal}m)`);
      }
    } catch (error) {
      console.error('❌ Error adding streaming time to session:', error);
    }
  }

  private startSpotifySession(user: UserActivity, track: string, artist: string, startTime: Date) {
    try {
      const result = this.db.insertSpotifySession({
        user_id: user.userId,
        track_name: track,
        artist: artist,
        start_time: startTime.toISOString(),
        end_time: null,
        duration_minutes: 0
      });
      
      user.currentSpotify = { track, artist };
      user.spotifySessionId = result.lastInsertRowid as number;
      console.log(`🎵 Started Spotify session: ${user.displayName} listening to ${track} by ${artist}`);
    } catch (error) {
      console.error('❌ Error starting Spotify session:', error);
    }
  }

  private endSpotifySession(user: UserActivity, endTime: Date) {
    if (!user.spotifySessionId) return;
    
    try {
      // Calculate duration from database record
      const sessions = this.db.getActiveSpotifySessions(user.userId);
      const session = sessions.find(s => s.id === user.spotifySessionId);
      
      if (session) {
        const startTime = new Date(session.start_time);
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
        
        this.db.updateSpotifySession(user.spotifySessionId, endTime.toISOString(), Math.max(0, durationMinutes));
        console.log(`🎵 Ended Spotify session: ${user.displayName} listened for ${durationMinutes} minutes`);
      }
      
      user.currentSpotify = undefined;
      user.spotifySessionId = undefined;
    } catch (error) {
      console.error('❌ Error ending Spotify session:', error);
    }
  }

  private endAllUserSessions(user: UserActivity, endTime: Date) {
    if (user.gameSessionId) {
      this.endGameSession(user, endTime);
    }
    if (user.voiceSessionId) {
      this.endVoiceSession(user, endTime);
    }
    if (user.spotifySessionId) {
      this.endSpotifySession(user, endTime);
    }
    user.sessionStartTime = undefined;
  }

  // === PUBLIC ANALYTICS METHODS ===

  // Save daily online time from Discord Gateway
  public saveDailyOnlineTime(userId: string, displayName: string, date: string, onlineMinutes: number) {
    try {
      // Upsert daily snapshot with the current online time
      this.db.upsertDailySnapshot({
        user_id: userId,
        date: date,
        online_minutes: onlineMinutes,
        voice_minutes: 0, // Will be calculated separately
        games_played: 0,  // Will be calculated separately
        spotify_minutes: 0 // Will be calculated separately
      });

      console.log(`💾 Saved daily online time: ${displayName} - ${onlineMinutes}m on ${date}`);
    } catch (error) {
      console.error(`❌ Error saving daily online time for ${displayName}:`, error);
    }
  }

  // Force end all active sessions for a user (useful for cleanup)
  public forceEndAllActiveSessions(userId: string) {
    const user = this.activeUsers.get(userId);
    if (user) {
      const currentTime = new Date();
      this.endAllUserSessions(user, currentTime);
      console.log(`🔧 Force ended all active sessions for ${user.displayName}`);
    }
  }

  // Get active sessions count for debugging
  public getActiveSessionsCount(): { users: number, gameSessions: number, voiceSessions: number, spotifySessions: number } {
    let gameSessions = 0;
    let voiceSessions = 0;
    let spotifySessions = 0;

    this.activeUsers.forEach(user => {
      if (user.gameSessionId) gameSessions++;
      if (user.voiceSessionId) voiceSessions++;
      if (user.spotifySessionId) spotifySessions++;
    });

    return {
      users: this.activeUsers.size,
      gameSessions,
      voiceSessions,
      spotifySessions
    };
  }

  public async generateDailySnapshot(userId: string, date: string): Promise<boolean> {
    try {
      const db = this.db.getDatabase();

      // Calculate totals for the day
      const gameTime = db.prepare(`
        SELECT SUM(duration_minutes) as total
        FROM game_sessions
        WHERE user_id = ? AND date(start_time) = ?
      `).get(userId, date) as any;

      const voiceTime = db.prepare(`
        SELECT SUM(duration_minutes) as total
        FROM voice_sessions
        WHERE user_id = ? AND date(start_time) = ?
      `).get(userId, date) as any;

      const spotifyTime = db.prepare(`
        SELECT SUM(duration_minutes) as total
        FROM spotify_sessions
        WHERE user_id = ? AND date(start_time) = ?
      `).get(userId, date) as any;

      const gamesPlayed = db.prepare(`
        SELECT COUNT(DISTINCT game_name) as count
        FROM game_sessions
        WHERE user_id = ? AND date(start_time) = ?
      `).get(userId, date) as any;

      // Estimate online time (combination of game time and voice time, avoiding double counting)
      const estimatedOnlineTime = Math.max(
        (gameTime?.total || 0),
        (voiceTime?.total || 0),
        (gameTime?.total || 0) + (voiceTime?.total || 0) * 0.3 // Assume some overlap
      );

      // Create daily snapshot
      this.db.upsertDailySnapshot({
        user_id: userId,
        date: date,
        online_minutes: Math.round(estimatedOnlineTime),
        voice_minutes: voiceTime?.total || 0,
        games_played: gamesPlayed?.count || 0,
        spotify_minutes: spotifyTime?.total || 0
      });

      console.log(`📊 Generated daily snapshot for ${userId} on ${date}: ${Math.round(estimatedOnlineTime)}m online, ${voiceTime?.total || 0}m voice, ${gamesPlayed?.count || 0} games, ${spotifyTime?.total || 0}m spotify`);
      return true;
    } catch (error) {
      console.error(`❌ Error generating daily snapshot for ${userId} on ${date}:`, error);
      return false;
    }
  }

  // Generate snapshots for all active users for a specific date
  public async generateAllDailySnapshots(date: string): Promise<number> {
    try {
      const db = this.db.getDatabase();

      // Get all users who had activity on this date
      const users = db.prepare(`
        SELECT DISTINCT user_id FROM (
          SELECT user_id FROM game_sessions WHERE date(start_time) = ?
          UNION
          SELECT user_id FROM voice_sessions WHERE date(start_time) = ?
          UNION
          SELECT user_id FROM spotify_sessions WHERE date(start_time) = ?
        )
      `).all(date, date, date) as { user_id: string }[];

      let successCount = 0;
      for (const user of users) {
        const success = await this.generateDailySnapshot(user.user_id, date);
        if (success) successCount++;
      }

      console.log(`📊 Generated ${successCount}/${users.length} daily snapshots for ${date}`);
      return successCount;
    } catch (error) {
      console.error(`❌ Error generating daily snapshots for ${date}:`, error);
      return 0;
    }
  }

  public getActiveUsers(): UserActivity[] {
    return Array.from(this.activeUsers.values());
  }

  public getUserActivity(userId: string): UserActivity | undefined {
    return this.activeUsers.get(userId);
  }

  // Health check
  public healthCheck() {
    return {
      activeUsers: this.activeUsers.size,
      database: this.db.healthCheck()
    };
  }
}

// Singleton instance
let analyticsService: AnalyticsService | null = null;

export function getAnalyticsService(): AnalyticsService {
  if (!analyticsService) {
    analyticsService = new AnalyticsService();
  }
  return analyticsService;
}

export default AnalyticsService;
