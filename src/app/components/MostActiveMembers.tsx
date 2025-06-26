'use client';

import { useState, useEffect } from 'react';
import DiscordAvatar from './DiscordAvatar';
import UserAnalyticsModal from './UserAnalyticsModal';

interface ActiveMember {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  status: string;
  dailyOnlineTime: number; // in minutes - only for current day
  isOnline: boolean;
}

interface MostActiveMembersProps {
  members: ActiveMember[];
  dataSource?: 'GATEWAY' | 'REST_API' | 'FALLBACK';
}

// Helper function to extract avatar hash from Discord CDN URL
function extractAvatarHash(avatarUrl: string): string | null {
  if (!avatarUrl) return null;

  // Extract hash from Discord CDN URL: https://cdn.discordapp.com/avatars/USER_ID/HASH.png?size=64
  const match = avatarUrl.match(/\/avatars\/\d+\/([a-f0-9]+)\.png/);
  return match ? match[1] : null;
}

export default function MostActiveMembers({ members, dataSource }: MostActiveMembersProps) {
  const [selectedUser, setSelectedUser] = useState<ActiveMember | null>(null);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'idle': return 'bg-yellow-400';
      case 'dnd': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const formatOnlineTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getRankEmoji = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${index + 1}`;
    }
  };

  const getActivityLevel = (dailyMinutes: number) => {
    if (dailyMinutes >= 240) return { text: 'Velmi aktivní', color: 'text-green-400' }; // 4+ hours
    if (dailyMinutes >= 120) return { text: 'Aktivní', color: 'text-blue-400' }; // 2+ hours
    if (dailyMinutes >= 60) return { text: 'Mírně aktivní', color: 'text-yellow-400' }; // 1+ hour
    if (dailyMinutes > 0) return { text: 'Krátce online', color: 'text-orange-400' }; // Some time
    return { text: 'Neaktivní', color: 'text-gray-400' }; // No time today
  };

  if (!members || members.length === 0) {
    return (
      <div className="bg-gray-700/30 rounded-xl p-4 border border-purple-500/20 transition-all duration-300 ease-in-out">
        <div className="flex items-center mb-3">
          <div className="flex items-center mr-3">
            <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9Z"/>
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-white">Nejaktivnější členové</h4>
        </div>
        
        <div className="text-center py-8">
          <div className="text-gray-400 text-sm">
            {dataSource === 'GATEWAY' ? 
              'Shromažďuji data o aktivitě...' : 
              'Aktivita je sledována pouze v real-time režimu'
            }
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-700/30 rounded-xl p-4 border border-purple-500/20 transition-all duration-300 ease-in-out">
      <div className="flex items-center mb-3">
        <div className="flex items-center mr-3">
          <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9Z"/>
          </svg>
        </div>
        <h4 className="text-lg font-semibold text-white">Nejaktivnější členové</h4>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto pr-2" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#4B5563 #1F2937'
      }}>
        {members.map((member, index) => {
          const activityLevel = getActivityLevel(member.dailyOnlineTime);

          return (
            <button
              key={member.id}
              onClick={() => setSelectedUser(member)}
              className="w-full flex items-center space-x-3 p-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors cursor-pointer group"
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-8 text-center">
                <span className="text-sm font-bold text-purple-300">
                  {getRankEmoji(index)}
                </span>
              </div>

              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <DiscordAvatar
                  userId={member.id}
                  avatar={member.avatar ? extractAvatarHash(member.avatar) : null}
                  displayName={member.displayName}
                  size={32}
                />
                {/* Status indicator */}
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-700 ${getStatusColor(member.status)}`}></div>
              </div>

              {/* Member info */}
              <div className="flex-1 min-w-0 text-left">
                <div className="text-white font-medium text-sm truncate group-hover:text-blue-300 transition-colors">{member.displayName}</div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className={activityLevel.color}>{activityLevel.text}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">Klikni pro statistiky</span>
                </div>
              </div>

              {/* Daily Time */}
              <div className="flex-shrink-0 text-right">
                <div className="text-xs text-green-300 font-semibold group-hover:text-blue-300 transition-colors">{formatOnlineTime(member.dailyOnlineTime)}</div>
                <div className="text-xs text-gray-500">dnes</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info Text */}
      <div className="mt-3 pt-2 border-t border-gray-600/30">
        <p className="text-xs text-gray-500 text-center">
          💡 Klikni na uživatele pro zobrazení detailních statistik
        </p>
      </div>

      {/* Footer info */}
      <div className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-600/30">
        <div className="flex justify-between items-center">
          <span>Čas strávený online dnes (reset 00:00)</span>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-1 ${
              dataSource === 'GATEWAY' ? 'bg-green-400 animate-pulse' :
              dataSource === 'REST_API' ? 'bg-yellow-400' :
              'bg-red-400'
            }`}></div>
            <span className={
              dataSource === 'GATEWAY' ? 'text-green-400' :
              dataSource === 'REST_API' ? 'text-yellow-400' :
              'text-red-400'
            }>
              {dataSource === 'GATEWAY' ? 'Live tracking' :
               dataSource === 'REST_API' ? 'Limited data' :
               'No tracking'}
            </span>
          </div>
        </div>
      </div>

      {/* User Analytics Modal */}
      {selectedUser && (
        <UserAnalyticsModal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          userId={selectedUser.id}
          displayName={selectedUser.displayName}
          avatar={selectedUser.avatar ? extractAvatarHash(selectedUser.avatar) : null}
        />
      )}
    </div>
  );
}
