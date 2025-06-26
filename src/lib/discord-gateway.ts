// Note: Using discord.js without native compression modules
// This avoids the need for Visual Studio build tools
import { Client, GatewayIntentBits, Presence, GuildMember, Activity } from 'discord.js';

interface CachedMember {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  status: string;
  activities: Activity[];
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

  constructor() {
    this.serverId = process.env.DISCORD_SERVER_ID || '';
    
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates
      ],
      // Disable compression to avoid zlib-sync dependency
      ws: {
        compress: false
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('ready', () => {
      console.log(`Discord Gateway connected as ${this.client.user?.tag}`);
      this.isConnected = true;
      this.initializeCache();

      // Set up periodic stats update to track online time and handle daily resets
      this.updateInterval = setInterval(() => {
        if (this.isConnected && this.serverStats) {
          this.updateDailyOnlineTime();
          this.updateServerStats();
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
      
      // Cache all members
      guild.members.cache.forEach(member => {
        if (!member.user.bot) {
          this.updateMemberCache(member);
        }
      });

      // Update server stats
      this.updateServerStats();
      
      console.log(`Initialized cache with ${this.memberCache.size} members`);
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
          // Member went offline - end session and add time
          if (existingMember.sessionStartTime) {
            const sessionDuration = (currentTime.getTime() - existingMember.sessionStartTime.getTime()) / (1000 * 60); // minutes
            dailyOnlineTime += Math.max(0, sessionDuration); // Ensure positive time
            console.log(`🔴 ${member.displayName || member.user.username} went offline after ${sessionDuration.toFixed(1)} minutes`);
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
          // Member went offline - end session and add time
          if (member.sessionStartTime) {
            const sessionDuration = (currentTime.getTime() - member.sessionStartTime.getTime()) / (1000 * 60); // minutes
            member.dailyOnlineTime += Math.max(0, sessionDuration);
            console.log(`🔴 ${member.displayName} went offline after ${sessionDuration.toFixed(1)} minutes`);
          }
          member.sessionStartTime = null;
        }
      }

      // Update member data
      member.status = newStatus;
      member.activities = presence.activities;
      member.lastSeen = currentTime;
      this.memberCache.set(presence.userId, member);

      // Update server stats to refresh lastUpdated timestamp
      this.updateServerStats();
    }
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
