'use client';

import { useState } from 'react';
import SafeImage from './SafeImage';
import UserStatsModal from './UserStatsModal';

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
  totalMemberCount?: number;
}

export default function MostActiveMembers({ members, dataSource, totalMemberCount }: MostActiveMembersProps) {
  const [selectedUser, setSelectedUser] = useState<{
    userId: string;
    displayName: string;
    avatar: string | null;
  } | null>(null);

  const [showCount, setShowCount] = useState(20);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleShowMore = () => {
    setShowCount(members.length);
    setIsExpanded(true);
  };

  const handleShowLess = () => {
    setShowCount(20);
    setIsExpanded(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'idle': return 'bg-yellow-400';
      case 'dnd': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'idle': return 'Nečinný';
      case 'dnd': return 'Nerušit';
      default: return 'Offline';
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
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white">Nejaktivnější členové</h4>
            {totalMemberCount && (
              <span className="text-sm text-gray-400">
                0 z 0 aktivních ({totalMemberCount} celkem)
              </span>
            )}
          </div>
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
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-white">Nejaktivnější členové</h4>
          {totalMemberCount && (
            <span className="text-sm text-gray-400">
              {Math.min(showCount, members.length)} z {members.length} aktivních ({totalMemberCount} celkem)
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto pr-2" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#4B5563 #1F2937'
      }}>
        {members.slice(0, showCount).map((member, index) => {
          const activityLevel = getActivityLevel(member.dailyOnlineTime);

          const handleClick = () => setSelectedUser({
            userId: member.id,
            displayName: member.displayName,
            avatar: member.avatar
          });

          return (
            <div
              key={member.id}
              role="button"
              tabIndex={0}
              className="w-full flex items-center space-x-3 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-700/40 active:bg-gray-700/50 cursor-pointer transition-colors min-h-[68px]"
              onClick={handleClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClick();
                }
              }}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-8 text-center">
                <span className="text-sm font-bold text-purple-300">
                  {getRankEmoji(index)}
                </span>
              </div>

              {/* Avatar */}
              <div className="flex-shrink-0">
                <SafeImage
                  src={member.avatar}
                  alt={member.displayName}
                  width={40}
                  height={40}
                  className="rounded-full"
                  fallback={
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {member.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  }
                />
              </div>

              {/* Member info */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-medium text-sm truncate">{member.displayName}</span>
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(member.status)}`}></span>
                    <span className="text-xs text-gray-400 hidden sm:inline">{getStatusLabel(member.status)}</span>
                  </span>
                </div>
                <div className="text-xs">
                  <span className={activityLevel.color}>{activityLevel.text}</span>
                </div>
              </div>

              {/* Daily Time */}
              <div className="flex-shrink-0 text-right">
                <div className="text-sm text-green-300 font-semibold">{formatOnlineTime(member.dailyOnlineTime)}</div>
                <div className="text-xs text-gray-500">dnes</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show More/Less Button */}
      {members.length > 20 && (
        <div className="mt-3 text-center">
          {!isExpanded ? (
            <button
              onClick={handleShowMore}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center justify-center mx-auto min-h-[44px] px-4"
            >
              <span>Zobrazit více ({members.length - 20} dalších)</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleShowLess}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center justify-center mx-auto min-h-[44px] px-4"
            >
              <span>Zobrazit méně</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}
        </div>
      )}

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

      {/* User Stats Modal */}
      {selectedUser && (
        <UserStatsModal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          userId={selectedUser.userId}
          displayName={selectedUser.displayName}
          avatar={selectedUser.avatar}
        />
      )}
    </div>
  );
}
