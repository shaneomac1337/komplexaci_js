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
  totalStreamingMinutes?: number; // Track accumulated streaming time for current session
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

  // Utility function to ensure consistent UTC time parsing
  private parseUTCTime(timeString: string): Date {
    // Handle different timestamp formats from SQLite
    if (!timeString) {
      return new Date();
    }

    // If it's already in ISO format with timezone, use as-is
    if (timeString.endsWith('Z') || timeString.includes('+') || timeString.includes('-')) {
      return new Date(timeString);
    }

    // If it's in SQLite CURRENT_TIMESTAMP format (YYYY-MM-DD HH:MM:SS), treat as UTC
    if (timeString.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
      return new Date(timeString + ' UTC');
    }

    // If it's missing timezone info, assume UTC
    if (!timeString.endsWith('Z')) {
      timeString += 'Z';
    }

    return new Date(timeString);
  }

  // === SESSION RECOVERY ===

  // Detect and create sessions based on Discord's real-time state when server starts
  public recoverExistingSessions(discordGuild: any) {
    console.log('🔄 Checking Discord real-time state for existing sessions...');
    let recoveredSessions = 0;
    const currentTime = new Date();

    // FIRST: Clean up any existing active sessions to prevent duplicates
    console.log('🧹 Cleaning up existing active sessions before recovery...');
    this.endAllActiveSessions(currentTime);

    // Check if this is a fresh daily reset (within 10 minutes of midnight Czech time)
    const czechTime = new Date(currentTime.toLocaleString("en-US", {timeZone: "Europe/Prague"}));
    const minutesSinceMidnight = czechTime.getHours() * 60 + czechTime.getMinutes();
    const isFreshDailyReset = minutesSinceMidnight <= 10; // Within 10 minutes of midnight

    // Use minimal backdate estimation to avoid inflated gaming minutes
    // If it's a fresh daily reset, don't backdate at all
    const estimatedBackdateMinutes = isFreshDailyReset ? 0 : 1; // No backdate on fresh reset, minimal otherwise
    const estimatedStartTime = new Date(currentTime.getTime() - (estimatedBackdateMinutes * 60 * 1000));

    console.log(`🕐 Session recovery: ${isFreshDailyReset ? 'Fresh daily reset detected' : 'Normal recovery'}, backdate: ${estimatedBackdateMinutes}m`);

    try {
      if (!discordGuild) {
        console.log('❌ No Discord guild provided for session recovery');
        return;
      }

      // Get real-time member data from Discord
      discordGuild.members.cache.forEach((member: any) => {
        if (member.user.bot) return; // Skip bots

        const userId = member.id;
        const displayName = member.displayName || member.user.username;

        // Skip if user is offline
        if (!member.presence || member.presence.status === 'offline') return;

        console.log(`🔍 Checking real-time activity for ${displayName}...`);

        // Check for game sessions from Discord presence
        if (member.presence.activities) {
          for (const activity of member.presence.activities) {
            if (activity.type === 0) { // Playing a game
              console.log(`🎮 Found active game: ${displayName} playing ${activity.name}`);

              // Create user activity if not exists
              let user = this.activeUsers.get(userId);
              if (!user) {
                user = {
                  userId,
                  displayName,
                  currentStatus: member.presence.status,
                  isInVoice: false,
                  isStreaming: false
                };
                this.activeUsers.set(userId, user);
              }

              // Start fresh game session
              this.startGameSession(user, activity.name, estimatedStartTime);
              recoveredSessions++;
              break; // Only one game at a time
            } else if (activity.type === 2 && activity.name === 'Spotify') { // Spotify
              console.log(`🎵 Found active Spotify: ${displayName} listening to ${activity.details} by ${activity.state}`);

              let user = this.activeUsers.get(userId);
              if (!user) {
                user = {
                  userId,
                  displayName,
                  currentStatus: member.presence.status,
                  isInVoice: false,
                  isStreaming: false
                };
                this.activeUsers.set(userId, user);
              }

              // Start fresh Spotify session
              this.startSpotifySession(user, activity.details || 'Unknown Track', activity.state || 'Unknown Artist', estimatedStartTime);
              recoveredSessions++;
            }
          }
        }

        // Check for voice sessions from Discord voice state
        if (member.voice && member.voice.channel) {
          console.log(`🎤 Found active voice: ${displayName} in ${member.voice.channel.name}`);

          let user = this.activeUsers.get(userId);
          if (!user) {
            user = {
              userId,
              displayName,
              currentStatus: member.presence?.status || 'online',
              isInVoice: false,
              isStreaming: false
            };
            this.activeUsers.set(userId, user);
          }

          // Start fresh voice session
          user.isInVoice = true;
          user.voiceChannelId = member.voice.channel.id;
          user.voiceChannelName = member.voice.channel.name;
          user.isStreaming = member.voice.streaming || false;

          this.startVoiceSession(user, member.voice.channel.id, member.voice.channel.name, estimatedStartTime);

          if (user.isStreaming) {
            user.streamingStartTime = estimatedStartTime;
            console.log(`📺 User ${displayName} is currently streaming`);
          }

          recoveredSessions++;
        }
      });

      if (recoveredSessions > 0) {
        console.log(`✅ Created ${recoveredSessions} fresh sessions based on Discord real-time state (${this.activeUsers.size} active users)`);
      } else {
        console.log(`✅ No active sessions found in Discord real-time state`);
      }
    } catch (error) {
      console.error('❌ Error checking Discord real-time state:', error);
    }
  }

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
          // Stopped streaming - calculate and add to total (but don't save to DB yet)
          const streamingMinutes = Math.round((currentTime.getTime() - user.streamingStartTime.getTime()) / (1000 * 60));
          user.totalStreamingMinutes = (user.totalStreamingMinutes || 0) + Math.max(0, streamingMinutes);
          user.streamingStartTime = undefined;
          console.log(`📺 ${user.displayName} stopped streaming (${streamingMinutes}m added, total: ${user.totalStreamingMinutes}m)`);
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
        duration_minutes: 0,
        last_updated: startTime.toISOString(),
        status: 'active'
      });

      user.currentGame = gameName;
      user.gameSessionId = result.lastInsertRowid as number;
      console.log(`🎮 Started game session: ${user.displayName} playing ${gameName} (Session ID: ${user.gameSessionId})`);

      // IMMEDIATE UPDATE: Update game time in user_stats immediately
      this.updateGameTimeImmediately(user.userId);
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
      // Force UTC time to avoid timezone issues
      const utcStartTime = new Date(startTime.getTime());
      const startTimeISO = utcStartTime.toISOString();
      const currentTimeISO = new Date().toISOString();

      console.log(`🔍 Debug voice session start: ${user.displayName}`);
      console.log(`  Start time: ${startTimeISO}`);
      console.log(`  Current time: ${currentTimeISO}`);
      console.log(`  Time diff: ${Math.round((new Date().getTime() - utcStartTime.getTime()) / 1000)}s`);
      console.log(`  Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

      const result = this.db.insertVoiceSession({
        user_id: user.userId,
        channel_id: channelId,
        channel_name: channelName,
        start_time: startTimeISO,
        end_time: null,
        duration_minutes: 0,
        screen_share_minutes: 0,
        last_updated: startTimeISO,
        status: 'active'
      });

      user.voiceSessionId = result.lastInsertRowid as number;
      user.totalStreamingMinutes = 0; // Reset streaming time for new session
      console.log(`🎤 Started voice session: ${user.displayName} joined ${channelName} (Session ID: ${user.voiceSessionId})`);
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

        // Calculate final streaming time if user was still streaming when session ended
        let finalStreamingTime = 0;
        if (user.isStreaming && user.streamingStartTime) {
          finalStreamingTime = Math.round((endTime.getTime() - user.streamingStartTime.getTime()) / (1000 * 60));
          console.log(`📺 User was streaming when session ended: ${finalStreamingTime}m current session`);
        }

        // Total screen share time = completed streaming sessions + current streaming session
        const screenShareMinutes = (user.totalStreamingMinutes || 0) + finalStreamingTime;

        this.db.updateVoiceSession(user.voiceSessionId, endTime.toISOString(), Math.max(0, durationMinutes), screenShareMinutes);
        console.log(`🎤 Ended voice session: ${user.displayName} was in voice for ${durationMinutes} minutes${screenShareMinutes > 0 ? ` (${screenShareMinutes}m screen sharing)` : ''}`);
      }

      user.voiceSessionId = undefined;
      user.isInVoice = false;
      user.isStreaming = false;
      user.streamingStartTime = undefined;
      user.totalStreamingMinutes = undefined;
    } catch (error) {
      console.error('❌ Error ending voice session:', error);
    }
  }

  // Update screen sharing status for active voice session
  public updateStreamingStatus(userId: string, isStreaming: boolean) {
    const user = this.activeUsers.get(userId);
    if (user && user.isInVoice && user.voiceSessionId) {
      const currentTime = new Date();

      if (isStreaming && !user.isStreaming) {
        // Started streaming
        user.streamingStartTime = currentTime;
        user.isStreaming = true;
        console.log(`📺 ${user.displayName} started streaming`);
      } else if (!isStreaming && user.isStreaming) {
        // Stopped streaming - add elapsed time to total
        if (user.streamingStartTime) {
          const streamingDuration = Math.round((currentTime.getTime() - user.streamingStartTime.getTime()) / (1000 * 60));
          user.totalStreamingMinutes = (user.totalStreamingMinutes || 0) + Math.max(0, streamingDuration);
          console.log(`📺 ${user.displayName} stopped streaming (added ${streamingDuration}m, total: ${user.totalStreamingMinutes}m)`);
        }
        user.isStreaming = false;
        user.streamingStartTime = undefined;
      }
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
        duration_minutes: 0,
        last_updated: startTime.toISOString(),
        status: 'active'
      });

      user.currentSpotify = { track, artist };
      user.spotifySessionId = result.lastInsertRowid as number;
      console.log(`🎵 Started Spotify session: ${user.displayName} listening to ${track} by ${artist}`);

      // IMMEDIATE UPDATE: Update Spotify song count in user_stats immediately
      this.updateSpotifySongCountImmediately(user.userId);
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

  // IMMEDIATE UPDATE: Update Spotify song count in user_stats immediately when a new song starts
  private updateSpotifySongCountImmediately(userId: string) {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Count today's Spotify songs (including active sessions for real-time updates)
      const spotifyStats = this.db.getDatabase().prepare(`
        SELECT COUNT(*) as songs_played
        FROM spotify_sessions
        WHERE user_id = ? AND date(start_time) = ? AND status IN ('active', 'ended')
      `).get(userId, today) as any;

      const newDailySpotifySongs = spotifyStats?.songs_played || 0;

      // Get current user stats
      let userStats = this.db.getUserStats(userId);
      
      if (!userStats) {
        // Create new user stats if they don't exist
        const now = new Date();
        userStats = {
          user_id: userId,
          daily_online_minutes: 0,
          daily_voice_minutes: 0,
          daily_games_played: 0,
          daily_games_minutes: 0,
          daily_spotify_minutes: 0,
          daily_spotify_songs: newDailySpotifySongs,
          monthly_online_minutes: 0,
          monthly_voice_minutes: 0,
          monthly_games_played: 0,
          monthly_games_minutes: 0,
          monthly_spotify_minutes: 0,
          monthly_spotify_songs: newDailySpotifySongs,
          last_daily_reset: now.toISOString(),
          last_monthly_reset: now.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        };
      } else {
        // Update existing user stats with new song count
        const now = new Date();
        
        // Real-time monthly accumulation: use Math.max() to ensure monthly >= daily
        const newMonthlySpotifySongs = Math.max(userStats.monthly_spotify_songs, newDailySpotifySongs);
        
        userStats = {
          ...userStats,
          daily_spotify_songs: newDailySpotifySongs,
          monthly_spotify_songs: newMonthlySpotifySongs,
          updated_at: now.toISOString()
        };
      }

      // Save updated stats to database
      this.db.upsertUserStats(userStats);
      
      console.log(`🎵 IMMEDIATE UPDATE: Updated Spotify song count for user ${userId}: ${newDailySpotifySongs} daily songs, ${userStats.monthly_spotify_songs} monthly songs`);
    } catch (error) {
      console.error(`❌ Error updating Spotify song count immediately for ${userId}:`, error);
    }
  }

  // IMMEDIATE UPDATE: Update game time in user_stats immediately when a game starts or progresses
  private updateGameTimeImmediately(userId: string) {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Count today's game time (including active sessions for real-time updates)
      const gameStats = this.db.getDatabase().prepare(`
        SELECT
          SUM(duration_minutes) as total_minutes,
          COUNT(DISTINCT game_name) as games_played
        FROM game_sessions
        WHERE user_id = ? AND date(start_time) = ? AND status IN ('active', 'ended')
      `).get(userId, today) as any;

      const newDailyGameMinutes = gameStats?.total_minutes || 0;
      const newDailyGamesPlayed = gameStats?.games_played || 0;

      // Get current user stats
      let userStats = this.db.getUserStats(userId);
      
      if (!userStats) {
        // Create new user stats if they don't exist
        const now = new Date();
        userStats = {
          user_id: userId,
          daily_online_minutes: 0,
          daily_voice_minutes: 0,
          daily_games_played: newDailyGamesPlayed,
          daily_games_minutes: newDailyGameMinutes,
          daily_spotify_minutes: 0,
          daily_spotify_songs: 0,
          monthly_online_minutes: 0,
          monthly_voice_minutes: 0,
          monthly_games_played: newDailyGamesPlayed,
          monthly_games_minutes: newDailyGameMinutes,
          monthly_spotify_minutes: 0,
          monthly_spotify_songs: 0,
          last_daily_reset: now.toISOString(),
          last_monthly_reset: now.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        };
      } else {
        // Update existing user stats with new game time
        const now = new Date();
        
        // Real-time monthly accumulation: use Math.max() to ensure monthly >= daily
        const newMonthlyGameMinutes = Math.max(userStats.monthly_games_minutes, newDailyGameMinutes);
        const newMonthlyGamesPlayed = Math.max(userStats.monthly_games_played, newDailyGamesPlayed);
        
        userStats = {
          ...userStats,
          daily_games_played: newDailyGamesPlayed,
          daily_games_minutes: newDailyGameMinutes,
          monthly_games_played: newMonthlyGamesPlayed,
          monthly_games_minutes: newMonthlyGameMinutes,
          updated_at: now.toISOString()
        };
      }

      // Save updated stats to database
      this.db.upsertUserStats(userStats);
      
      console.log(`🎮 IMMEDIATE UPDATE: Updated game time for user ${userId}: ${newDailyGameMinutes} daily minutes (${newDailyGamesPlayed} games), ${userStats.monthly_games_minutes} monthly minutes`);
    } catch (error) {
      console.error(`❌ Error updating game time immediately for ${userId}:`, error);
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

  // Get daily snapshot for a specific user and date
  public getDailySnapshot(userId: string, date: string) {
    try {
      return this.db.getDailySnapshot(userId, date);
    } catch (error) {
      console.error(`❌ Error getting daily snapshot for ${userId} on ${date}:`, error);
      return null;
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

  // End all active sessions in the database (used during session recovery)
  private endAllActiveSessions(endTime: Date) {
    try {
      const endTimeISO = endTime.toISOString();

      // End all active game sessions
      const gameResult = this.db.getDatabase().prepare(`
        UPDATE game_sessions
        SET status = 'ended', end_time = ?, last_updated = CURRENT_TIMESTAMP
        WHERE status = 'active'
      `).run(endTimeISO);

      // End all active voice sessions
      const voiceResult = this.db.getDatabase().prepare(`
        UPDATE voice_sessions
        SET status = 'ended', end_time = ?, last_updated = CURRENT_TIMESTAMP
        WHERE status = 'active'
      `).run(endTimeISO);

      // End all active Spotify sessions
      const spotifyResult = this.db.getDatabase().prepare(`
        UPDATE spotify_sessions
        SET status = 'ended', end_time = ?, last_updated = CURRENT_TIMESTAMP
        WHERE status = 'active'
      `).run(endTimeISO);

      console.log(`🧹 Ended ${gameResult.changes} game sessions, ${voiceResult.changes} voice sessions, ${spotifyResult.changes} Spotify sessions`);

      // Clear active users map to start fresh
      this.activeUsers.clear();

    } catch (error) {
      console.error('❌ Error ending all active sessions:', error);
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

  // === PERIODIC SESSION MANAGEMENT ===

  // Update all active sessions with current progress (called every minute)
  public updateActiveSessionsProgress() {
    const currentTime = new Date();
    let updatedSessions = 0;

    try {
      // Update game sessions
      for (const [userId, user] of this.activeUsers) {
        if (user.gameSessionId && user.currentGame) {
          const sessions = this.db.getActiveGameSessions(userId);
          const session = sessions.find(s => s.id === user.gameSessionId);

          if (session) {
            const startTime = this.parseUTCTime(session.start_time);
            const durationMinutes = Math.round((currentTime.getTime() - startTime.getTime()) / (1000 * 60));

            this.db.updateGameSessionProgress(user.gameSessionId, Math.max(0, durationMinutes));
            updatedSessions++;

            console.log(`📊 Updated game session: ${user.displayName} playing ${user.currentGame} - ${durationMinutes}m`);

            // IMMEDIATE UPDATE: Update game time in user_stats immediately
            this.updateGameTimeImmediately(userId);
          } else {
            console.warn(`⚠️ Game session not found for ${user.displayName} (ID: ${user.gameSessionId})`);
          }
        }

        // Update voice sessions with accurate streaming tracking
        if (user.voiceSessionId && user.isInVoice) {
          const sessions = this.db.getActiveVoiceSessions(userId);
          const session = sessions.find(s => s.id === user.voiceSessionId);

          if (session) {
            const startTime = this.parseUTCTime(session.start_time);
            const durationMinutes = Math.round((currentTime.getTime() - startTime.getTime()) / (1000 * 60));

            // Calculate current streaming time (but don't add to total yet - only when streaming stops)
            let currentStreamingTime = 0;
            if (user.isStreaming && user.streamingStartTime) {
              currentStreamingTime = Math.round((currentTime.getTime() - user.streamingStartTime.getTime()) / (1000 * 60));
            }

            // Total screen share time = completed streaming + current streaming session
            const totalScreenShareMinutes = (user.totalStreamingMinutes || 0) + currentStreamingTime;

            this.db.updateVoiceSessionProgress(user.voiceSessionId, Math.max(0, durationMinutes), totalScreenShareMinutes);
            updatedSessions++;

            console.log(`📊 Updated voice session: ${user.displayName} - ${durationMinutes}m total (${totalScreenShareMinutes}m streaming)`);
          } else {
            console.warn(`⚠️ Voice session not found for ${user.displayName} (ID: ${user.voiceSessionId})`);
          }
        }

        // Update Spotify sessions
        if (user.spotifySessionId && user.currentSpotify) {
          const sessions = this.db.getActiveSpotifySessions(userId);
          const session = sessions.find(s => s.id === user.spotifySessionId);

          if (session) {
            const startTime = this.parseUTCTime(session.start_time);
            const durationMinutes = Math.round((currentTime.getTime() - startTime.getTime()) / (1000 * 60));

            this.db.updateSpotifySessionProgress(user.spotifySessionId, Math.max(0, durationMinutes));
            updatedSessions++;
          }
        }
      }

      if (updatedSessions > 0) {
        console.log(`📊 Updated progress for ${updatedSessions} active sessions`);
      } else {
        console.log(`📊 No active sessions to update (${this.activeUsers.size} active users)`);
      }
    } catch (error) {
      console.error('❌ Error updating active sessions progress:', error);
    }
  }



  // Fix existing sessions with inconsistent timestamp formats (one-time fix)
  public fixInconsistentTimestamps() {
    try {
      console.log('🔧 Fixing inconsistent timestamp formats...');

      // Get all active sessions and mark old ones as stale
      const currentTime = new Date();
      const oneHourAgo = new Date(currentTime.getTime() - (60 * 60 * 1000));

      // Clean up old voice sessions
      const activeVoiceSessions = this.db.getActiveVoiceSessions();
      for (const session of activeVoiceSessions) {
        const startTime = this.parseUTCTime(session.start_time);
        if (startTime < oneHourAgo) {
          this.db.markVoiceSessionAsStale(session.id!, currentTime.toISOString(), 0, 0);
          console.log(`🧹 Marked old voice session as stale: ${session.user_id}`);
        }
      }

      // Clean up old game sessions
      const activeGameSessions = this.db.getActiveGameSessions();
      for (const session of activeGameSessions) {
        const startTime = this.parseUTCTime(session.start_time);
        if (startTime < oneHourAgo) {
          this.db.markGameSessionAsStale(session.id!, currentTime.toISOString(), 0);
          console.log(`🧹 Marked old game session as stale: ${session.user_id}`);
        }
      }

      // Clean up old Spotify sessions
      const activeSpotifySessions = this.db.getActiveSpotifySessions();
      for (const session of activeSpotifySessions) {
        const startTime = this.parseUTCTime(session.start_time);
        if (startTime < oneHourAgo) {
          this.db.markSpotifySessionAsStale(session.id!, currentTime.toISOString(), 0);
          console.log(`🧹 Marked old Spotify session as stale: ${session.user_id}`);
        }
      }

      console.log('✅ Fixed inconsistent timestamps in existing sessions');
    } catch (error) {
      console.error('❌ Error fixing inconsistent timestamps:', error);
    }
  }

  // Legacy method - kept for API compatibility but no longer used
  // Real-time validation via validateSessionsWithPresence() handles cleanup now
  public cleanupStaleSessions(staleMinutes: number = 5) {
    // This method is now mostly redundant since we use real-time Discord validation
    // Keeping it for API compatibility but it does nothing
    console.log('ℹ️ Stale session cleanup skipped - using real-time validation instead');
  }

  // Cross-reference active sessions with current Discord presence
  public validateActiveSessionsWithPresence() {
    try {
      for (const [, user] of this.activeUsers) {
        // Validate game sessions
        if (user.gameSessionId && !user.currentGame) {
          console.log(`⚠️ User ${user.displayName} has active game session but no current game - ending session`);
          this.endGameSession(user, new Date());
        }

        // Validate voice sessions
        if (user.voiceSessionId && !user.isInVoice) {
          console.log(`⚠️ User ${user.displayName} has active voice session but not in voice - ending session`);
          this.endVoiceSession(user, new Date());
        }

        // Validate Spotify sessions
        if (user.spotifySessionId && !user.currentSpotify) {
          console.log(`⚠️ User ${user.displayName} has active Spotify session but no current track - ending session`);
          this.endSpotifySession(user, new Date());
        }
      }
    } catch (error) {
      console.error('❌ Error validating active sessions:', error);
    }
  }

  // Reset in-memory tracking (for daily reset)
  public resetInMemoryTracking() {
    console.log('🔄 Resetting analytics service in-memory tracking...');
    const userCount = this.activeUsers.size;
    this.activeUsers.clear();
    console.log(`🔄 Cleared ${userCount} active users from analytics service`);
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
