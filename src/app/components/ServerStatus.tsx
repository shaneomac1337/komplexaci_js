'use client';

import { useState, useEffect } from 'react';

interface ServerStatus {
  name: string;
  url: string;
  status: 'online' | 'offline' | 'checking';
  responseTime?: number;
  lastChecked?: string;
}


export default function ServerStatus() {
  const [webServers, setWebServers] = useState<ServerStatus[]>([
    { name: 'KompG Website', url: 'https://www.komplexaci.cz', status: 'checking' },
    { name: 'KompG Music Bot Dashboard', url: 'https://music.komplexaci.cz/dashboard', status: 'checking' },
    { name: 'Komplexáci API', url: 'http://localhost:3000/api/health', status: 'checking' }
  ]);


  const checkServerHealth = async (server: ServerStatus): Promise<ServerStatus> => {
    try {
      // Use our health-check API endpoint to avoid CORS issues
      const response = await fetch(`/api/health-check?url=${encodeURIComponent(server.url)}`);
      const data = await response.json();
      
      if (response.ok) {
        return {
          ...server,
          status: data.status as 'online' | 'offline',
          responseTime: data.responseTime,
          lastChecked: new Date(data.lastChecked).toLocaleTimeString('cs-CZ')
        };
      } else {
        return {
          ...server,
          status: 'offline',
          responseTime: data.responseTime || 0,
          lastChecked: new Date().toLocaleTimeString('cs-CZ')
        };
      }
    } catch (error) {
      return {
        ...server,
        status: 'offline',
        responseTime: 0,
        lastChecked: new Date().toLocaleTimeString('cs-CZ')
      };
    }
  };

  const checkAllServers = async () => {
    const updatedServers = await Promise.all(
      webServers.map(server => checkServerHealth(server))
    );
    setWebServers(updatedServers);
  };

  useEffect(() => {
    checkAllServers();
    
    // Check servers every 30 seconds
    const interval = setInterval(checkAllServers, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-400';
      case 'offline': return 'text-red-400';
      case 'checking': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return '🟢';
      case 'offline': return '🔴';
      case 'checking': return '🟡';
      default: return '⚪';
    }
  };


  return (
    <div className="bg-gray-700/30 rounded-xl p-4 border border-green-500/20">
      <div className="flex items-center mb-3">
        <svg className="w-6 h-6 mr-2 text-green-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <h4 className="text-lg font-semibold text-white">Website Status</h4>
      </div>


        <div className="space-y-1 text-sm">
          {webServers.map((server, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-gray-300">{server.name}</span>
              <div className="flex items-center space-x-2">
                <span className={getStatusColor(server.status)}>
                  {getStatusIcon(server.status)} {server.status}
                </span>
                {server.responseTime && (
                  <span className="text-gray-400 text-xs">
                    {server.responseTime}ms
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {webServers.some(s => s.lastChecked) && (
          <div className="text-xs text-gray-400 mt-2">
            Poslední kontrola: {webServers.find(s => s.lastChecked)?.lastChecked}
          </div>
        )}
        
        <button 
          onClick={checkAllServers}
          className="text-xs text-blue-400 hover:text-blue-300 mt-2 flex items-center"
        >
          🔄 Obnovit status
        </button>
    </div>
  );
}