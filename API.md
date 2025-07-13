# 📡 API Documentation

Complete API reference for Discord integration and streaming status features.

## 🎯 Overview

The Komplexáci website includes robust Discord integration with real-time streaming detection, voice channel monitoring, and comprehensive server statistics.

## 📊 Discord Server Stats API

### Enhanced Server Stats
```http
GET /api/discord/server-stats
```

**Response includes:**
- All existing server stats
- `streamingStats` object with streaming summary
- Individual member `streaming` objects
- Real-time voice channel data

#### Example Response
```json
{
  "timestamp": "2025-06-28T06:44:04.041Z",
  "totalMembers": 42,
  "onlineMembers": [
    {
      "id": "user_id",
      "displayName": "Username",
      "status": "online",
      "activity": { "name": "League of Legends", "type": 0 },
      "streaming": {
        "isStreaming": true,
        "channelName": "General",
        "channelId": "channel_id",
        "streamingTo": "General",
        "streamType": "Screen Share"
      }
    }
  ],
  "streamingStats": {
    "totalStreaming": 2,
    "totalInVoice": 5,
    "streamingUsers": [
      {
        "id": "user_id",
        "displayName": "Username",
        "channelName": "General",
        "streamType": "Screen Share"
      }
    ]
  }
}
```

## 📺 Streaming Status API

### Dedicated Streaming Status
```http
GET /api/discord/streaming-status
```

**Detailed streaming analysis:**
```json
{
  "timestamp": "2025-06-28T06:44:04.041Z",
  "totalMembers": 42,
  "onlineMembers": 3,
  "streamingUsers": [
    {
      "id": "user_id",
      "displayName": "Username",
      "channelName": "General",
      "isStreaming": true,
      "streamType": "Screen Share",
      "activities": [...]
    }
  ],
  "voiceUsers": [
    {
      "id": "user_id",
      "displayName": "Username", 
      "channelName": "General",
      "isStreaming": false
    }
  ],
  "summary": {
    "totalStreaming": 1,
    "totalInVoice": 3,
    "channels": {
      "General": {
        "users": 3,
        "streaming": 1
      }
    }
  }
}
```

## 🎮 Frontend Integration

### Display Streaming Status
```javascript
// Fetch server stats with streaming info
const response = await fetch('/api/discord/server-stats');
const data = await response.json();

// Show streaming summary
console.log(`${data.streamingStats.totalStreaming} users streaming`);
console.log(`${data.streamingStats.totalInVoice} users in voice`);

// Display individual streaming users
data.onlineMembers.forEach(member => {
  if (member.streaming?.isStreaming) {
    console.log(`${member.displayName} is streaming to ${member.streaming.channelName}`);
  }
});
```

### Real-time Updates
```javascript
// Poll for streaming updates
setInterval(async () => {
  const response = await fetch('/api/discord/streaming-status');
  const streamingData = await response.json();
  
  // Update UI with current streaming status
  updateStreamingDisplay(streamingData);
}, 30000); // Update every 30 seconds
```

## 🔧 Technical Details

### Streaming Detection
- Uses Discord.js voice state data
- Detects `member.voice.streaming` property
- Identifies voice channel information
- Tracks screen sharing activity

### Data Sources
- **GATEWAY**: Real-time Discord Gateway data (preferred)
- **REST_API**: Fallback Discord REST API
- **FALLBACK**: Static fallback data

### Voice Channel States
- **In Voice**: User connected to voice channel
- **Streaming**: User sharing screen in voice channel
- **Not in Voice**: User not connected to any voice channel

## 🎯 Use Cases

### Community Dashboard
- Show live streaming activity
- Display voice channel occupancy
- Highlight active streamers

### Gaming Communities
- Track who's streaming gameplay
- Monitor voice channel activity
- Show community engagement

### Content Creation
- Identify active streamers
- Track streaming patterns
- Community streaming statistics

## 🚀 Example Implementation

### Simple Streaming Status Widget
```javascript
function StreamingWidget({ serverStats }) {
  const { streamingStats } = serverStats;
  
  return (
    <div className="streaming-widget">
      <h3>Live Activity</h3>
      
      {streamingStats.totalStreaming > 0 ? (
        <div>
          <p>🔴 {streamingStats.totalStreaming} users streaming</p>
          {streamingStats.streamingUsers.map(user => (
            <div key={user.id}>
              📺 {user.displayName} → {user.channelName}
            </div>
          ))}
        </div>
      ) : (
        <p>No active streams</p>
      )}
      
      {streamingStats.totalInVoice > 0 && (
        <p>🎤 {streamingStats.totalInVoice} users in voice</p>
      )}
    </div>
  );
}
```

### Advanced Streaming Dashboard
```javascript
function StreamingDashboard() {
  const [streamingData, setStreamingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreamingData = async () => {
      try {
        const response = await fetch('/api/discord/streaming-status');
        const data = await response.json();
        setStreamingData(data);
      } catch (error) {
        console.error('Failed to fetch streaming data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStreamingData();
    const interval = setInterval(fetchStreamingData, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading streaming data...</div>;
  if (!streamingData) return <div>Failed to load streaming data</div>;

  return (
    <div className="streaming-dashboard">
      <div className="stats-overview">
        <div className="stat-card">
          <h4>Total Streaming</h4>
          <p>{streamingData.summary.totalStreaming}</p>
        </div>
        <div className="stat-card">
          <h4>In Voice</h4>
          <p>{streamingData.summary.totalInVoice}</p>
        </div>
      </div>

      <div className="active-streamers">
        <h3>Active Streamers</h3>
        {streamingData.streamingUsers.map(user => (
          <div key={user.id} className="streamer-card">
            <span className="user-name">{user.displayName}</span>
            <span className="channel-name">{user.channelName}</span>
            <span className="stream-type">{user.streamType}</span>
          </div>
        ))}
      </div>

      <div className="voice-channels">
        <h3>Voice Channels</h3>
        {Object.entries(streamingData.summary.channels).map(([channelName, info]) => (
          <div key={channelName} className="channel-info">
            <span className="channel-name">{channelName}</span>
            <span className="user-count">{info.users} users</span>
            {info.streaming > 0 && (
              <span className="streaming-count">{info.streaming} streaming</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🔐 Authentication & Rate Limiting

### Discord Bot Requirements
- Bot must be added to the server with appropriate permissions
- Required permissions: `VIEW_CHANNEL`, `CONNECT`, `VIEW_GUILD_INSIGHTS`
- Bot token must be configured in environment variables

### Rate Limiting
- Discord API has rate limits (50 requests per second)
- Implementation includes automatic rate limiting and retry logic
- Caching is used to reduce API calls

### Error Handling
```javascript
// Graceful degradation when Discord API is unavailable
const fallbackData = {
  timestamp: new Date().toISOString(),
  totalMembers: 0,
  onlineMembers: [],
  streamingStats: {
    totalStreaming: 0,
    totalInVoice: 0,
    streamingUsers: []
  },
  source: 'FALLBACK'
};
```

This comprehensive Discord API integration provides real-time streaming detection and monitoring capabilities for gaming communities! 🎮📺