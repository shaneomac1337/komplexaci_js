// Note: Using discord.js without native compression modules
// This avoids the need for Visual Studio build tools
import { Client, GatewayIntentBits, Presence, GuildMember, Activity } from 'discord.js';
import { getAnalyticsService } from './analytics/service';
import { getAnalyticsDatabase } from './analytics/database';
import { initializeAnalytics } from './analytics';

interface CachedMember {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  status: string;
  activities: Activity[];
  voice: {
    channel: {
      id: string;
      name: string;
    } | null;
    streaming: boolean;
    selfMute: boolean;
    selfDeaf: boolean;
  } | null;
  roles: string[];
  joinedAt: string | null;
  lastSeen: Date;
  dailyOnlineTime: number; // in minutes - only for current day
  lastDailyReset: Date;
  sessionStartTime: Date | null;
}

interface ServerStats {
  name: string;
  memberCount: number;
  onlineCount: number;
  icon: string | null;
  description: string;
  features: string[];
  boostLevel: number;
  boostCount: number;
  verificationLevel: number;
  onlineMembers: CachedMember[];
  lastUpdated: Date;
}

class DiscordGatewayService {
  private client: Client;
  private isConnected = false;
  private memberCache = new Map<string, CachedMember>();
  private serverStats: ServerStats | null = null;
  private serverId: string;
  private updateInterval: NodeJS.Timeout | null = null;
  private analyticsService = getAnalyticsService();

  constructor() {
    this.serverId = process.env.DISCORD_SERVER_ID || '';

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates
      ]
    });

    // Initialize analytics system
    try {
      initializeAnalytics();
      console.log('✅ Analytics system initialized with Discord Gateway');
    } catch (error) {
      console.error('❌ Failed to initialize analytics system:', error);
    }

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('ready', () => {
      console.log(`Discord Gateway connected as ${this.client.user?.tag}`);
      this.isConnected = true;
      this.initializeCache();

      // Fix any existing sessions with timestamp issues (one-time on startup)
      this.analyticsService.fixInconsistentTimestamps();

      // Recover existing sessions based on Discord's real-time state
      setTimeout(() => {
        const guild = this.client.guilds.cache.get(this.serverId);
        if (guild) {
          console.log('🔍 Checking Discord real-time state for session recovery...');
          this.analyticsService.recoverExistingSessions(guild);
        } else {
          console.log('⚠️ Guild not found for session recovery');
        }
      }, 5000); // Wait 5 seconds for Discord cache to populate

      // Set up periodic stats update to track online time and handle daily resets
      this.updateInterval = setInterval(() => {
        if (this.isConnected && this.serverStats) {
          this.updateDailyOnlineTime();
          this.updateServerStats();

          // Enhanced session management
          this.updateActiveSessionsProgress();
          this.validateSessionsWithPresence(); // This handles cleanup via real Discord data
        }
      }, 60000); // Update every 1 minute for more accurate time tracking
    });

    this.client.on('guildMemberAdd', (member) => {
      this.updateMemberCache(member);
      this.updateServerStats();
    });

    this.client.on('guildMemberRemove', (member) => {
      this.memberCache.delete(member.id);
      this.updateServerStats();
    });

    this.client.on('presenceUpdate', (oldPresence, newPresence) => {
      if (newPresence?.guild?.id === this.serverId) {
        this.updatePresenceCache(newPresence);
      }
    });

    this.client.on('guildMemberUpdate', (oldMember, newMember) => {
      this.updateMemberCache(newMember);
    });

    // Add voice state tracking for analytics
    this.client.on('voiceStateUpdate', (oldState, newState) => {
      if (newState.guild?.id === this.serverId) {
        this.handleVoiceStateUpdate(oldState, newState);
      }
    });

    this.client.on('error', (error) => {
      console.error('Discord Gateway error:', error);
    });

    this.client.on('disconnect', () => {
      console.log('Discord Gateway disconnected');
      this.isConnected = false;

      // Clear the update interval
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }
    });
  }

  async connect() {
    if (!process.env.DISCORD_BOT_TOKEN) {
      throw new Error('DISCORD_BOT_TOKEN not found in environment variables');
    }

    try {
      await this.client.login(process.env.DISCORD_BOT_TOKEN);
    } catch (error) {
      console.error('Failed to connect to Discord Gateway:', error);
      throw error;
    }
  }

  private async initializeCache() {
    try {
      const guild = this.client.guilds.cache.get(this.serverId);
      if (!guild) {
        console.error(`Guild ${this.serverId} not found`);
        return;
      }

      // Fetch all members
      await guild.members.fetch();
      
      // Cache all members and restore daily online time from database
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      guild.members.cache.forEach(member => {
        if (!member.user.bot) {
          // First update member cache (this sets dailyOnlineTime to 0)
          this.updateMemberCache(member);

          // Then restore daily online time from database
          this.restoreDailyOnlineTime(member.id, today);

          // Initialize analytics for existing members
          const presence = member.presence;
          if (presence) {
            this.analyticsService.updateUserPresence(
              member.id,
              member.nickname || member.user.globalName || member.user.username,
              presence.status as 'online' | 'idle' | 'dnd' | 'offline',
              presence.activities
            );
          }
        }
      });

      // Update server stats
      this.updateServerStats();

      console.log(`Initialized cache with ${this.memberCache.size} members and analytics tracking`);
    } catch (error) {
      console.error('Failed to initialize member cache:', error);
    }
  }

  private updateMemberCache(member: GuildMember) {
    const existingMember = this.memberCache.get(member.id);
    const currentTime = new Date();
    const currentStatus = member.presence?.status || 'offline';

    // Initialize daily tracking variables
    let dailyOnlineTime = existingMember?.dailyOnlineTime || 0;
    let lastDailyReset = existingMember?.lastDailyReset || currentTime;
    let sessionStartTime = existingMember?.sessionStartTime || null;

    // Check for daily reset at midnight Czech time
    const czechTime = new Date(currentTime.toLocaleString("en-US", {timeZone: "Europe/Prague"}));
    const today = new Date(czechTime);
    today.setHours(0, 0, 0, 0);
    const lastReset = new Date(lastDailyReset.toLocaleString("en-US", {timeZone: "Europe/Prague"}));
    lastReset.setHours(0, 0, 0, 0);

    if (today.getTime() > lastReset.getTime()) {
      // Reset daily counters at midnight
      dailyOnlineTime = 0;
      lastDailyReset = currentTime;
      sessionStartTime = null; // Reset session on new day
      console.log(`🌅 Daily reset for ${member.displayName || member.user.username}`);
    }

    // Handle session tracking for new members
    if (!existingMember) {
      if (currentStatus !== 'offline') {
        sessionStartTime = currentTime;
        console.log(`👋 New member ${member.displayName || member.user.username} came online`);
      }
    } else {
      // Handle status changes for existing members
      if (existingMember.status !== currentStatus) {
        if (currentStatus !== 'offline' && existingMember.status === 'offline') {
          // Member came online - start new session
          sessionStartTime = currentTime;
          console.log(`🟢 ${member.displayName || member.user.username} came online`);
        } else if (currentStatus === 'offline' && existingMember.status !== 'offline') {
          // Member went offline - just end session (time already tracked minute by minute)
          if (existingMember.sessionStartTime) {
            const sessionDuration = (currentTime.getTime() - existingMember.sessionStartTime.getTime()) / (1000 * 60); // minutes
            console.log(`🔴 ${member.displayName || member.user.username} went offline after ${sessionDuration.toFixed(1)} minutes`);
            // Note: Don't add sessionDuration to dailyOnlineTime as it's already tracked minute by minute
          }
          sessionStartTime = null;
        }
      }
    }

    const cachedMember: CachedMember = {
      id: member.id,
      username: member.user.username,
      displayName: member.nickname || member.user.globalName || member.user.username,
      avatar: member.user.avatar
        ? `https://cdn.discordapp.com/avatars/${member.id}/${member.user.avatar}.png?size=64`
        : null,
      status: currentStatus,
      activities: member.presence?.activities || [],
      voice: member.voice ? {
        channel: member.voice.channel ? {
          id: member.voice.channel.id,
          name: member.voice.channel.name
        } : null,
        streaming: member.voice.streaming || false,
        selfMute: member.voice.selfMute || false,
        selfDeaf: member.voice.selfDeaf || false
      } : null,
      roles: member.roles.cache.map(role => role.id),
      joinedAt: member.joinedAt?.toISOString() || null,
      lastSeen: currentTime,
      dailyOnlineTime,
      lastDailyReset,
      sessionStartTime
    };

    this.memberCache.set(member.id, cachedMember);
  }

  private updatePresenceCache(presence: Presence) {
    const member = this.memberCache.get(presence.userId);
    if (member) {
      const currentTime = new Date();
      const oldStatus = member.status;
      const newStatus = presence.status;

      // Check for daily reset at midnight Czech time
      const czechTime = new Date(currentTime.toLocaleString("en-US", {timeZone: "Europe/Prague"}));
      const today = new Date(czechTime);
      today.setHours(0, 0, 0, 0);
      const lastReset = new Date(member.lastDailyReset.toLocaleString("en-US", {timeZone: "Europe/Prague"}));
      lastReset.setHours(0, 0, 0, 0);

      if (today.getTime() > lastReset.getTime()) {
        member.dailyOnlineTime = 0;
        member.lastDailyReset = currentTime;
        member.sessionStartTime = null; // Reset session on new day
        console.log(`🌅 Daily reset for ${member.displayName}`);
      }

      // Handle status changes for session tracking
      if (oldStatus !== newStatus) {
        if (newStatus !== 'offline' && oldStatus === 'offline') {
          // Member came online - start new session
          member.sessionStartTime = currentTime;
          console.log(`🟢 ${member.displayName} came online`);
        } else if (newStatus === 'offline' && oldStatus !== 'offline') {
          // Member went offline - just end session (time already tracked minute by minute)
          if (member.sessionStartTime) {
            const sessionDuration = (currentTime.getTime() - member.sessionStartTime.getTime()) / (1000 * 60); // minutes
            console.log(`🔴 ${member.displayName} went offline after ${sessionDuration.toFixed(1)} minutes`);
            // Note: Don't add sessionDuration to dailyOnlineTime as it's already tracked minute by minute
          }
          member.sessionStartTime = null;
        }
      }

      // Update member data
      member.status = newStatus;
      member.activities = presence.activities;
      member.lastSeen = currentTime;
      this.memberCache.set(presence.userId, member);

      // Update analytics service with presence change
      this.analyticsService.updateUserPresence(
        presence.userId,
        member.displayName,
        newStatus as 'online' | 'idle' | 'dnd' | 'offline',
        presence.activities
      );

      // Update server stats to refresh lastUpdated timestamp
      this.updateServerStats();
    }
  }

  private handleVoiceStateUpdate(oldState: any, newState: any) {
    const userId = newState.member?.id;
    if (!userId) return;

    const member = this.memberCache.get(userId);
    if (!member) return;

    // Determine voice channel info
    const channelId = newState.channelId;
    const channelName = newState.channel?.name;

    // Check if user is streaming (streaming = screen share, selfVideo = camera)
    const isStreaming = newState.streaming || false;

    // Update member cache with new voice state
    member.voice = channelId ? {
      channel: {
        id: channelId,
        name: channelName
      },
      streaming: isStreaming,
      selfMute: newState.selfMute || false,
      selfDeaf: newState.selfDeaf || false
    } : null;

    // Save updated member back to cache
    this.memberCache.set(userId, member);

    // Debug streaming detection
    if (userId === '396360380038774784') { // shaneomac's ID for debugging
      console.log(`📺 Enhanced streaming debug for ${member.displayName}:`, {
        streaming: newState.streaming, // ← This is screen sharing/streaming
        selfVideo: newState.selfVideo, // ← This is camera
        selfDeaf: newState.selfDeaf,
        selfMute: newState.selfMute,
        isStreaming,
        // Check for additional streaming properties
        streamKey: newState.streamKey,
        applicationId: newState.applicationId,
        sessionId: newState.sessionId,
        // Full voice state object
        fullVoiceState: newState,
        cachedVoiceState: member.voice
      });

      // Also log current activities to see if there's streaming info there
      console.log(`🎮 Current activities for ${member.displayName}:`, member.activities);
    }

    // Update analytics service with voice state change
    this.analyticsService.updateUserVoiceState(
      userId,
      channelId,
      channelName,
      isStreaming
    );

    console.log(`🎤 Voice state update: ${member.displayName} ${channelId ? 'joined' : 'left'} voice channel${channelName ? ` (${channelName})` : ''}`);
  }

  private updateDailyOnlineTime() {
    const currentTime = new Date();
    let updatedCount = 0;

    for (const [userId, member] of this.memberCache) {
      // Check for daily reset at midnight Czech time
      const czechTime = new Date(currentTime.toLocaleString("en-US", {timeZone: "Europe/Prague"}));
      const today = new Date(czechTime);
      today.setHours(0, 0, 0, 0);
      const lastReset = new Date(member.lastDailyReset.toLocaleString("en-US", {timeZone: "Europe/Prague"}));
      lastReset.setHours(0, 0, 0, 0);

      if (today.getTime() > lastReset.getTime()) {
        member.dailyOnlineTime = 0;
        member.lastDailyReset = currentTime;
        member.sessionStartTime = null; // Reset session on new day
        console.log(`🌅 Daily reset for ${member.displayName}`);
      }

      // Add time for currently online members with active sessions
      if (member.status !== 'offline' && member.sessionStartTime) {
        // Add 1 minute to daily online time (since we run every minute)
        member.dailyOnlineTime += 1;
        member.lastSeen = currentTime;
        this.memberCache.set(userId, member);
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      console.log(`⏱️ Updated daily online time for ${updatedCount} members`);
    }

    // Save daily stats to database every minute for real-time persistence
    this.saveDailyStatsToDatabase();
  }

  private restoreDailyOnlineTime(userId: string, date: string) {
    try {
      // Get today's daily snapshot from database
      const snapshot = this.analyticsService.getDailySnapshot(userId, date);

      if (snapshot && snapshot.online_minutes > 0) {
        const member = this.memberCache.get(userId);
        if (member) {
          member.dailyOnlineTime = snapshot.online_minutes;

          // If user is currently online, set session start time to now
          if (member.status !== 'offline') {
            member.sessionStartTime = new Date();
          }

          this.memberCache.set(userId, member);
          console.log(`🔄 Restored daily online time: ${member.displayName} - ${snapshot.online_minutes}m`);
        }
      }
    } catch (error) {
      console.error(`❌ Error restoring daily online time for ${userId}:`, error);
    }
  }

  private saveDailyStatsToDatabase() {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      let savedCount = 0;

      this.memberCache.forEach((member, userId) => {
        if (member.dailyOnlineTime > 0) {
          // Save to old daily_snapshots (for historical data)
          this.analyticsService.saveDailyOnlineTime(
            userId,
            member.displayName,
            today,
            Math.round(member.dailyOnlineTime)
          );

          // Update user_stats table for real-time tracking
          this.updateUserStatsInDatabase(userId, member);
          savedCount++;
        }
      });

      if (savedCount > 0) {
        console.log(`💾 Saved daily stats for ${savedCount} users to both daily_snapshots and user_stats`);
      }
    } catch (error) {
      console.error('❌ Error saving daily stats to database:', error);
    }
  }

  private updateUserStatsInDatabase(userId: string, member: CachedMember) {
    try {
      const analyticsDb = getAnalyticsDatabase();
      
      // Get current user stats or create new ones
      let userStats = analyticsDb.getUserStats(userId);
      
      if (!userStats) {
        // Create new user stats entry
        userStats = {
          user_id: userId,
          daily_online_minutes: Math.round(member.dailyOnlineTime),
          daily_voice_minutes: 0, // TODO: Calculate from voice sessions
          daily_games_played: 0, // TODO: Calculate from game sessions
          daily_spotify_minutes: 0, // TODO: Calculate from spotify sessions
          monthly_online_minutes: Math.round(member.dailyOnlineTime),
          monthly_voice_minutes: 0,
          monthly_games_played: 0,
          monthly_spotify_minutes: 0,
          last_daily_reset: new Date().toISOString(),
          last_monthly_reset: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log(`📊 Created new user stats for ${member.displayName}: ${userStats.daily_online_minutes}m daily`);
      } else {
        // Update existing stats - only update daily minutes, don't accumulate
        const previousDaily = userStats.daily_online_minutes;
        userStats.daily_online_minutes = Math.round(member.dailyOnlineTime);
        userStats.updated_at = new Date().toISOString();
        
        console.log(`📊 Updated user stats for ${member.displayName}: ${previousDaily}m -> ${userStats.daily_online_minutes}m daily`);
      }

      analyticsDb.upsertUserStats(userStats);
    } catch (error) {
      console.error(`❌ Error updating user stats for ${userId}:`, error);
    }
  }

  // === ENHANCED SESSION MANAGEMENT ===

  private updateActiveSessionsProgress() {
    try {
      this.analyticsService.updateActiveSessionsProgress();
    } catch (error) {
      console.error('❌ Error updating active sessions progress:', error);
    }
  }



  private validateSessionsWithPresence() {
    try {
      this.analyticsService.validateActiveSessionsWithPresence();
    } catch (error) {
      console.error('❌ Error validating sessions with presence:', error);
    }
  }

  // Public method to manually trigger saving stats (for testing/immediate population)
  public forceSaveDailyStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      let savedCount = 0;

      this.memberCache.forEach((member, userId) => {
        if (member.dailyOnlineTime > 0) {
          this.analyticsService.saveDailyOnlineTime(
            userId,
            member.displayName,
            today,
            Math.round(member.dailyOnlineTime)
          );
          
          // Also update user_stats
          this.updateUserStatsInDatabase(userId, member);
          savedCount++;
        }
      });

      console.log(`🔧 Force saved daily stats for ${savedCount} users`);
      return savedCount;
    } catch (error) {
      console.error('❌ Error force saving daily stats:', error);
      return 0;
    }
  }

  // Public method to trigger daily reset
  public async triggerDailyReset() {
    try {
      console.log('🌅 Triggering daily reset from Discord Gateway...');
      
      // First reset in-memory cache
      console.log('🔄 Resetting Discord Gateway in-memory cache...');
      const currentTime = new Date();
      
      // Reset analytics service in-memory tracking first
      this.analyticsService.resetInMemoryTracking();
      
      this.memberCache.forEach((member, userId) => {
        member.dailyOnlineTime = 0;
        member.lastDailyReset = currentTime;
        
        // Only reset session start time for offline members
        // Online members need to keep tracking their current session
        if (member.status === 'offline') {
          member.sessionStartTime = null;
        } else {
          // For online members, restart their session from now
          member.sessionStartTime = currentTime;
          console.log(`🔄 Restarted session for online member: ${member.displayName}`);
        }
        
        this.memberCache.set(userId, member);
      });
      console.log(`🔄 Reset in-memory cache for ${this.memberCache.size} members`);
      
      // Re-initialize analytics tracking for currently online users
      this.reinitializeAnalyticsTracking();
      
      // Then call the daily reset API
      const response = await fetch('/api/analytics/reset-daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Daily reset completed:', result.summary);
        return result;
      } else {
        throw new Error(`Daily reset API returned ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error triggering daily reset:', error);
      throw error;
    }
  }

  // Public method to reset in-memory cache only (for testing)
  public resetInMemoryCache() {
    console.log('🔄 Resetting Discord Gateway in-memory cache only...');
    const currentTime = new Date();
    
    // Reset analytics service in-memory tracking first
    this.analyticsService.resetInMemoryTracking();
    
    this.memberCache.forEach((member, userId) => {
      member.dailyOnlineTime = 0;
      member.lastDailyReset = currentTime;
      
      // Only reset session start time for offline members
      // Online members need to keep tracking their current session
      if (member.status === 'offline') {
        member.sessionStartTime = null;
      } else {
        // For online members, restart their session from now
        member.sessionStartTime = currentTime;
        console.log(`🔄 Restarted session for online member: ${member.displayName}`);
      }
      
      this.memberCache.set(userId, member);
    });
    console.log(`🔄 Reset in-memory cache for ${this.memberCache.size} members`);
    
    // Re-initialize analytics tracking for currently online users
    this.reinitializeAnalyticsTracking();
  }

  // Re-initialize analytics tracking for currently online users after reset
  private reinitializeAnalyticsTracking() {
    console.log('🔄 Re-initializing analytics tracking for online users...');
    let reinitializedCount = 0;
    
    this.memberCache.forEach((member, userId) => {
      if (member.status !== 'offline') {
        // Re-initialize analytics tracking for this user
        this.analyticsService.updateUserPresence(
          userId,
          member.displayName,
          member.status as 'online' | 'idle' | 'dnd' | 'offline',
          member.activities
        );
        
        // If user is in voice, re-initialize voice tracking
        if (member.voice && member.voice.channel) {
          this.analyticsService.updateUserVoiceState(
            userId,
            member.voice.channel.id,
            member.voice.channel.name,
            member.voice.streaming
          );
        }
        
        reinitializedCount++;
      }
    });
    
    console.log(`🔄 Re-initialized analytics tracking for ${reinitializedCount} online users`);
  }

  private updateServerStats() {
    const guild = this.client.guilds.cache.get(this.serverId);
    if (!guild) return;

    const onlineMembers = Array.from(this.memberCache.values())
      .filter(member => member.status !== 'offline')
      .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());

    this.serverStats = {
      name: guild.name,
      memberCount: guild.memberCount,
      onlineCount: onlineMembers.length,
      icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
      description: guild.description || '',
      features: guild.features,
      boostLevel: guild.premiumTier,
      boostCount: guild.premiumSubscriptionCount || 0,
      verificationLevel: guild.verificationLevel,
      onlineMembers,
      lastUpdated: new Date()
    };
  }

  // Public methods for API access
  getServerStats(): ServerStats | null {
    return this.serverStats;
  }

  getOnlineMembers(): CachedMember[] {
    return Array.from(this.memberCache.values())
      .filter(member => member.status !== 'offline')
      .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());
  }

  getAllMembers(): CachedMember[] {
    return Array.from(this.memberCache.values())
      .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());
  }

  isReady(): boolean {
    return this.isConnected && this.serverStats !== null;
  }

  getMemberCount(): number {
    return this.memberCache.size;
  }

  getOnlineCount(): number {
    return Array.from(this.memberCache.values())
      .filter(member => member.status !== 'offline').length;
  }

  getMostActiveMembers(limit: number = 10): CachedMember[] {
    return Array.from(this.memberCache.values())
      .sort((a, b) => {
        // Sort by daily online time (descending)
        if (b.dailyOnlineTime !== a.dailyOnlineTime) {
          return b.dailyOnlineTime - a.dailyOnlineTime;
        }
        // Secondary sort by last seen (more recent first)
        return b.lastSeen.getTime() - a.lastSeen.getTime();
      })
      .slice(0, limit);
  }
}

// Singleton instance
let discordGateway: DiscordGatewayService | null = null;

export function getDiscordGateway(): DiscordGatewayService {
  if (!discordGateway) {
    discordGateway = new DiscordGatewayService();
    
    // Auto-connect in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DISCORD_GATEWAY === 'true') {
      discordGateway.connect().catch(console.error);
    }
  }
  
  return discordGateway;
}

export type { CachedMember, ServerStats };
