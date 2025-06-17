# League of Legends API Integration

This directory contains the backend API implementation for League of Legends summoner search functionality using the Riot Games API.

## Features

- **Summoner Search**: Search for summoners by Riot ID (gameName#tagLine)
- **Ranked Statistics**: Get current rank, LP, wins/losses for Solo/Duo and Flex queues
- **Match History**: Retrieve detailed match history with champion data
- **Champion Mastery**: Get top champion mastery data
- **Live Game Detection**: Check if a summoner is currently in a game
- **Region Support**: Support for all League of Legends regions

## API Endpoints

### GET `/api/lol/summoner`
Search for a summoner by Riot ID.

**Parameters:**
- `riotId` (required): Summoner's Riot ID in format `gameName#tagLine`
- `region` (optional): Region code (default: `euw1`)

**Example:**
```
GET /api/lol/summoner?riotId=Faker%23T1&region=kr
```

### GET `/api/lol/matches`
Get match history for a summoner.

**Parameters:**
- `puuid` (required): Summoner's PUUID
- `region` (optional): Region code (default: `euw1`)
- `count` (optional): Number of matches to retrieve (1-100, default: 10)

**Example:**
```
GET /api/lol/matches?puuid=abc123&region=euw1&count=20
```

### GET `/api/lol/mastery`
Get champion mastery data for a summoner.

**Parameters:**
- `puuid` (required): Summoner's PUUID
- `region` (optional): Region code (default: `euw1`)
- `count` (optional): Number of champions to retrieve (1-50, default: 10)

**Example:**
```
GET /api/lol/mastery?puuid=abc123&region=euw1&count=5
```

### GET `/api/lol/live-game`
Check if a summoner is currently in a game.

**Parameters:**
- `puuid` (required): Summoner's PUUID
- `region` (optional): Region code (default: `euw1`)

**Example:**
```
GET /api/lol/live-game?puuid=abc123&region=euw1
```

### GET `/api/lol/regions`
Get list of supported regions.

**Example:**
```
GET /api/lol/regions
```

## Supported Regions

| Code | Name | Flag | Countries |
|------|------|------|-----------|
| `euw1` | Europe West | 🇪🇺 | UK, France, Germany, Spain, etc. |
| `eun1` | Europe Nordic & East | 🇪🇺 | Poland, Czech Republic, Slovakia, etc. |
| `na1` | North America | 🇺🇸 | United States, Canada |
| `kr` | Korea | 🇰🇷 | South Korea |
| `jp1` | Japan | 🇯🇵 | Japan |
| `br1` | Brazil | 🇧🇷 | Brazil |
| `la1` | Latin America North | 🌎 | Mexico, Central America |
| `la2` | Latin America South | 🌎 | Argentina, Chile, etc. |
| `oc1` | Oceania | 🇦🇺 | Australia, New Zealand |
| `tr1` | Turkey | 🇹🇷 | Turkey |
| `ru` | Russia | 🇷🇺 | Russia, CIS countries |

## Setup

1. **Get Riot API Key**:
   - Visit [Riot Developer Portal](https://developer.riotgames.com/)
   - Create an account and generate a development API key
   - For production, apply for a Personal or Production API key

2. **Environment Variables**:
   ```bash
   # Add to your .env.local file
   RIOT_API_KEY=RGAPI-your-api-key-here
   ```

3. **Development Key Limitations**:
   - Expires every 24 hours
   - Rate limited to 100 requests every 2 minutes
   - Only for development/testing

## Rate Limits

The Riot API has several types of rate limits:

- **Application Rate Limits**: Per API key per region
- **Method Rate Limits**: Per endpoint per API key per region  
- **Service Rate Limits**: Per service per region

Our implementation includes:
- Automatic error handling for rate limit exceeded (429)
- Appropriate caching headers to reduce API calls
- Graceful degradation when API is unavailable

## Error Handling

The API handles various error scenarios:

- `400`: Invalid parameters
- `403`: Invalid or expired API key
- `404`: Summoner not found
- `429`: Rate limit exceeded
- `500/502/503`: Riot API unavailable

## Caching Strategy

Different endpoints have different cache durations:

- **Summoner Profile**: 5 minutes (300s)
- **Match History**: 3 minutes (180s)
- **Champion Mastery**: 10 minutes (600s)
- **Live Game**: 30 seconds (30s)
- **Regions**: 24 hours (86400s)

## Data Enrichment

The API automatically enriches data with:

- **Champion Names**: Maps champion IDs to readable names
- **Champion Images**: Provides URLs for champion portraits
- **Regional Information**: Adds region metadata

## File Structure

```
src/app/api/lol/
├── README.md                 # This file
├── types/
│   └── summoner.ts          # TypeScript type definitions
├── services/
│   └── RiotAPIService.ts    # Main service class for Riot API
├── utils/
│   └── championUtils.ts     # Champion data utilities
├── summoner/
│   └── route.ts            # Summoner search endpoint
├── matches/
│   └── route.ts            # Match history endpoint
├── mastery/
│   └── route.ts            # Champion mastery endpoint
├── live-game/
│   └── route.ts            # Live game endpoint
├── regions/
│   └── route.ts            # Regions endpoint
└── champions/
    └── route.ts            # Existing champions endpoint
```

## Usage Examples

See the frontend implementation in the League of Legends page for complete usage examples.
