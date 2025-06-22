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
  activityScore: number;
  statusChanges: number;
  onlineTime: number; // in minutes
  dailyPoints: number;
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

      // Set up periodic stats update to keep lastUpdated fresh and award activity points
      this.updateInterval = setInterval(() => {
        if (this.isConnected && this.serverStats) {
          this.awardPeriodicActivityPoints();
          this.updateServerStats();
        }
      }, 300000); // Update every 5 minutes (300 seconds)
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

    // Calculate activity score and track changes
    let activityScore = existingMember?.activityScore || 0;
    let statusChanges = existingMember?.statusChanges || 0;
    let onlineTime = existingMember?.onlineTime || 0;
    let dailyPoints = existingMember?.dailyPoints || 0;
    let lastDailyReset = existingMember?.lastDailyReset || currentTime;
    let sessionStartTime = existingMember?.sessionStartTime || null;

    // Check if we need to reset daily points (new day)
    const today = new Date(currentTime);
    today.setHours(0, 0, 0, 0);
    const lastReset = new Date(lastDailyReset);
    lastReset.setHours(0, 0, 0, 0);

    if (today.getTime() > lastReset.getTime()) {
      dailyPoints = 0;
      lastDailyReset = currentTime;
    }

    // If member exists, update activity metrics
    if (existingMember) {
      // Track status changes (indicates activity)
      if (existingMember.status !== currentStatus) {
        statusChanges++;
        activityScore += 5; // Bonus for status changes
      }

      // Track online time
      if (existingMember.status !== 'offline' && currentStatus !== 'offline') {
        const timeDiff = (currentTime.getTime() - existingMember.lastSeen.getTime()) / (1000 * 60); // minutes
        onlineTime += Math.min(timeDiff, 60); // Cap at 60 minutes per update to prevent huge jumps
      }

      // Activity bonus for being online
      if (currentStatus !== 'offline') {
        activityScore += 1;
      }

      // Bonus for having activities (playing games, etc.)
      if (member.presence?.activities && member.presence.activities.length > 0) {
        activityScore += 2;
      }
    } else {
      // New member - give initial points based on current status
      if (currentStatus !== 'offline') {
        activityScore = 20; // Starting bonus for being online
        dailyPoints = 20;
        sessionStartTime = currentTime;
      }

      // Initial bonus for having activities
      if (member.presence?.activities && member.presence.activities.length > 0) {
        activityScore += 10;
        dailyPoints += 10;
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
      activityScore,
      statusChanges,
      onlineTime,
      dailyPoints,
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

      // Check daily reset
      const today = new Date(currentTime);
      today.setHours(0, 0, 0, 0);
      const lastReset = new Date(member.lastDailyReset);
      lastReset.setHours(0, 0, 0, 0);

      if (today.getTime() > lastReset.getTime()) {
        member.dailyPoints = 0;
        member.lastDailyReset = currentTime;
      }

      // Track status changes (indicates activity) - immediate points
      if (oldStatus !== newStatus) {
        member.statusChanges++;
        const points = 5;
        member.activityScore += points;
        member.dailyPoints += points;

        // Track session start/end
        if (newStatus !== 'offline' && oldStatus === 'offline') {
          member.sessionStartTime = currentTime;
        } else if (newStatus === 'offline') {
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

  private awardPeriodicActivityPoints() {
    const currentTime = new Date();
    let updatedCount = 0;

    // Check if it's peak hours (18:00-23:00 weekdays, 13:00-01:00 weekends)
    const hour = currentTime.getHours();
    const dayOfWeek = currentTime.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isPeakHours = isWeekend ?
      (hour >= 13 || hour <= 1) :
      (hour >= 18 && hour <= 23);
    const peakMultiplier = isPeakHours ? 1.5 : 1.0;

    for (const [userId, member] of this.memberCache) {
      // Check daily reset
      const today = new Date(currentTime);
      today.setHours(0, 0, 0, 0);
      const lastReset = new Date(member.lastDailyReset);
      lastReset.setHours(0, 0, 0, 0);

      if (today.getTime() > lastReset.getTime()) {
        member.dailyPoints = 0;
        member.lastDailyReset = currentTime;
      }

      let pointsAwarded = 0;

      // Award points based on activity type
      if (member.status !== 'offline') {
        // Check for diminishing returns (after 2 hours online)
        const sessionDuration = member.sessionStartTime ?
          (currentTime.getTime() - member.sessionStartTime.getTime()) / (1000 * 60 * 60) : 0; // hours

        const diminishingFactor = sessionDuration > 2 ? 0.5 : 1.0;

        // Base points for being online
        let basePoints = Math.floor(2 * peakMultiplier * diminishingFactor);

        // Activity-specific bonuses
        if (member.activities && member.activities.length > 0) {
          const hasGaming = member.activities.some(a =>
            a.type === 0 && // Playing activity
            !a.name?.toLowerCase().includes('spotify') &&
            !a.name?.toLowerCase().includes('custom status')
          );
          const hasMusic = member.activities.some(a =>
            a.name?.toLowerCase().includes('spotify')
          );
          const hasCustomStatus = member.activities.some(a => a.type === 4);

          if (hasGaming) {
            basePoints += Math.floor(10 * peakMultiplier * diminishingFactor); // Gaming bonus
          } else if (hasMusic) {
            basePoints += Math.floor(3 * peakMultiplier * diminishingFactor); // Music bonus
          } else if (hasCustomStatus) {
            basePoints += Math.floor(1 * peakMultiplier * diminishingFactor); // Custom status bonus
          }
        }

        pointsAwarded = basePoints;

        if (pointsAwarded > 0) {
          member.activityScore += pointsAwarded;
          member.dailyPoints += pointsAwarded;

          // Track online time (5 minutes per cycle)
          member.onlineTime += 5;
          member.lastSeen = currentTime;
          this.memberCache.set(userId, member);
          updatedCount++;
        }
      }
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
        // Primary sort by activity score
        if (b.activityScore !== a.activityScore) {
          return b.activityScore - a.activityScore;
        }
        // Secondary sort by online time
        if (b.onlineTime !== a.onlineTime) {
          return b.onlineTime - a.onlineTime;
        }
        // Tertiary sort by status changes
        return b.statusChanges - a.statusChanges;
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
