'use client';

import { useState, useEffect } from 'react';

interface ActiveMember {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  status: string;
  activityScore: number;
  onlineTime: number;
  statusChanges: number;
  isOnline: boolean;
}

interface MostActiveMembersProps {
  members: ActiveMember[];
  dataSource?: 'GATEWAY' | 'REST_API' | 'FALLBACK';
}

export default function MostActiveMembers({ members, dataSource }: MostActiveMembersProps) {
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

  const getActivityLevel = (score: number) => {
    if (score >= 100) return { text: 'Velmi aktivní', color: 'text-green-400' };
    if (score >= 50) return { text: 'Aktivní', color: 'text-blue-400' };
    if (score >= 20) return { text: 'Mírně aktivní', color: 'text-yellow-400' };
    return { text: 'Nízká aktivita', color: 'text-gray-400' };
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
          const activityLevel = getActivityLevel(member.activityScore);
          
          return (
            <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
              {/* Rank */}
              <div className="flex-shrink-0 w-8 text-center">
                <span className="text-sm font-bold text-purple-300">
                  {getRankEmoji(index)}
                </span>
              </div>

              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.displayName}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                    <span className="text-xs text-gray-300">
                      {member.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {/* Status indicator */}
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-700 ${getStatusColor(member.status)}`}></div>
              </div>

              {/* Member info */}
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm truncate">{member.displayName}</div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className={activityLevel.color}>{activityLevel.text}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">{member.activityScore} bodů</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-shrink-0 text-right">
                <div className="text-xs text-gray-300">{formatOnlineTime(member.onlineTime)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-600/30">
        <div className="flex justify-between items-center">
          <span>Aktivita za posledních 24h</span>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-1 ${
              dataSource === 'GATEWAY' ? 'bg-purple-400 animate-pulse' :
              dataSource === 'REST_API' ? 'bg-yellow-400' :
              'bg-red-400'
            }`}></div>
            <span className={
              dataSource === 'GATEWAY' ? 'text-purple-400' :
              dataSource === 'REST_API' ? 'text-yellow-400' :
              'text-red-400'
            }>
              {dataSource === 'GATEWAY' ? 'Real-time tracking' :
               dataSource === 'REST_API' ? 'Limited data' :
               'No tracking'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
