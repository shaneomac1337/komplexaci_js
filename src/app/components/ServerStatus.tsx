'use client';

import { useState, useEffect } from 'react';
import './daily-awards-redesign.css';

type Status = 'online' | 'offline' | 'checking';

interface ServerEntry {
  name: string;
  url: string;
  flavor: string;
  icon: string;
  status: Status;
  responseTime?: number;
  lastChecked?: string;
}

const initialServers: ServerEntry[] = [
  {
    name: 'KompG Website',
    url: 'https://www.komplexaci.cz',
    flavor: 'Klan v důchodu',
    icon: '🌐',
    status: 'checking',
  },
  {
    name: 'KompG Music Bot',
    url: 'https://music.komplexaci.cz/health',
    flavor: 'Nostalgie připravena',
    icon: '🎵',
    status: 'checking',
  },
  {
    name: 'Komplexáci API',
    url: 'http://localhost:3000/api/health',
    flavor: 'Stále na příjmu',
    icon: '⚙️',
    status: 'checking',
  },
];

const statusLabel = (s: Status) =>
  s === 'online' ? 'Online' : s === 'offline' ? 'Offline' : 'Kontroluji';

export default function ServerStatus() {
  const [servers, setServers] = useState<ServerEntry[]>(initialServers);

  const checkServerHealth = async (server: ServerEntry): Promise<ServerEntry> => {
    try {
      const response = await fetch(
        `/api/health-check?url=${encodeURIComponent(server.url)}`
      );
      const data = await response.json();
      const lastChecked = new Date(
        data.lastChecked ?? Date.now()
      ).toLocaleTimeString('cs-CZ');

      if (response.ok) {
        return {
          ...server,
          status: data.status as Status,
          responseTime: data.responseTime,
          lastChecked,
        };
      }

      return {
        ...server,
        status: 'offline',
        responseTime: data.responseTime ?? 0,
        lastChecked,
      };
    } catch {
      return {
        ...server,
        status: 'offline',
        responseTime: 0,
        lastChecked: new Date().toLocaleTimeString('cs-CZ'),
      };
    }
  };

  const checkAllServers = async () => {
    const updated = await Promise.all(servers.map(checkServerHealth));
    setServers(updated);
  };

  useEffect(() => {
    checkAllServers();
    const interval = setInterval(checkAllServers, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="daily-awards-lounge status-card">
      <div className="awards-widget-head">
        <div className="awards-title">
          <span className="awards-title-icon">◉</span>
          <div>
            <h4>Aktuální stav</h4>
            <p>Stav klanu a serverů live</p>
          </div>
        </div>
        <span className="awards-live-pill">
          <i />
          Live
        </span>
      </div>

      <div className="awards-list">
        {servers.map((server) => (
          <div key={server.name} className="award-row status-row">
            <div className="award-info">
              <span className="award-icon">{server.icon}</span>
              <div className="award-copy">
                <strong>{server.name}</strong>
                <span>{server.flavor}</span>
              </div>
            </div>

            <div className="award-winner">
              <div className="award-winner-copy">
                <strong className={`status-label is-${server.status}`}>
                  {statusLabel(server.status)}
                </strong>
                <span>
                  {server.responseTime ? `${server.responseTime} ms` : '—'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
