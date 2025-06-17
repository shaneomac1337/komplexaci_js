"use client";

import { useState, useEffect } from 'react';
import styles from '../summoner.module.css';

interface SearchHistoryItem {
  summonerName: string;
  region: string;
  timestamp: number;
  level?: number;
  rank?: string;
}

interface SearchHistoryProps {
  onSelectSummoner: (summonerName: string, region: string) => void;
}

export default function SearchHistory({ onSelectSummoner }: SearchHistoryProps) {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = () => {
    try {
      const stored = localStorage.getItem('lol-search-history');
      if (stored) {
        const history = JSON.parse(stored);
        setSearchHistory(history.slice(0, 10)); // Keep only last 10 searches
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

  const addToHistory = (summonerName: string, region: string, additionalData?: Partial<SearchHistoryItem>) => {
    try {
      const newItem: SearchHistoryItem = {
        summonerName,
        region,
        timestamp: Date.now(),
        ...additionalData
      };

      const stored = localStorage.getItem('lol-search-history');
      let history: SearchHistoryItem[] = stored ? JSON.parse(stored) : [];

      // Remove existing entry for same summoner+region
      history = history.filter(item => 
        !(item.summonerName.toLowerCase() === summonerName.toLowerCase() && item.region === region)
      );

      // Add new item to beginning
      history.unshift(newItem);

      // Keep only last 10 searches
      history = history.slice(0, 10);

      localStorage.setItem('lol-search-history', JSON.stringify(history));
      setSearchHistory(history);
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  };

  const clearHistory = () => {
    try {
      localStorage.removeItem('lol-search-history');
      setSearchHistory([]);
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Právě teď';
    } else if (diffInMinutes < 60) {
      return `Před ${diffInMinutes}m`;
    } else {
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return `Před ${diffInHours}h`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `Před ${diffInDays}d`;
      }
    }
  };

  const getRegionDisplay = (region: string) => {
    const regionMap: Record<string, string> = {
      'eun1': 'EUNE',
      'euw1': 'EUW',
      'na1': 'NA',
      'kr': 'KR',
      'jp1': 'JP',
      'br1': 'BR',
      'la1': 'LAN',
      'la2': 'LAS',
      'oc1': 'OCE',
      'tr1': 'TR',
      'ru': 'RU'
    };
    return regionMap[region] || region.toUpperCase();
  };

  // Expose addToHistory function globally so other components can use it
  useEffect(() => {
    (window as any).addToSearchHistory = addToHistory;
  }, []);

  if (searchHistory.length === 0) {
    return null;
  }

  return (
    <div style={{ position: 'relative', marginBottom: '1rem' }}>
      <button
        onClick={() => setIsVisible(!isVisible)}
        data-search-history
        style={{
          background: 'rgba(110, 79, 246, 0.1)',
          border: '1px solid rgba(110, 79, 246, 0.3)',
          borderRadius: '8px',
          color: '#c9aa71',
          padding: '0.5rem 1rem',
          fontSize: '0.9rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#6e4ff6';
          e.currentTarget.style.background = 'rgba(110, 79, 246, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(110, 79, 246, 0.3)';
          e.currentTarget.style.background = 'rgba(110, 79, 246, 0.1)';
        }}
      >
        📚 Historie hledání ({searchHistory.length})
        <span style={{ transform: isVisible ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
          ▼
        </span>
      </button>

      {isVisible && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          border: '1px solid rgba(110, 79, 246, 0.3)',
          borderRadius: '8px',
          marginTop: '0.5rem',
          zIndex: 1000,
          maxHeight: '300px',
          overflowY: 'auto',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8)'
        }}>
          <div style={{ padding: '0.5rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '0.5rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(110, 79, 246, 0.2)'
            }}>
              <span style={{ color: '#c9aa71', fontSize: '0.8rem', fontWeight: 'bold' }}>
                Nedávno hledané
              </span>
              <button
                onClick={clearHistory}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  textDecoration: 'underline'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#f87171';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                }}
              >
                Vymazat vše
              </button>
            </div>

            {searchHistory.map((item, index) => (
              <div
                key={`${item.summonerName}-${item.region}-${item.timestamp}`}
                onClick={() => {
                  onSelectSummoner(item.summonerName, item.region);
                  setIsVisible(false);
                }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  marginBottom: '0.25rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(110, 79, 246, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ 
                    color: '#f0e6d2', 
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    {item.summonerName}
                  </div>
                  <div style={{ 
                    color: '#c9aa71', 
                    fontSize: '0.7rem',
                    display: 'flex',
                    gap: '0.5rem'
                  }}>
                    <span>{getRegionDisplay(item.region)}</span>
                    {item.level && <span>• Level {item.level}</span>}
                    {item.rank && <span>• {item.rank}</span>}
                  </div>
                </div>
                <div style={{ 
                  color: '#888', 
                  fontSize: '0.7rem',
                  textAlign: 'right'
                }}>
                  {formatTimeAgo(item.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
