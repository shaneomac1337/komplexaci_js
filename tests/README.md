# Testing Reference Guide - Komplexaci Project

This directory contains all test and check scripts for the Komplexaci gaming community website. The project currently uses a **manual testing approach** with Node.js scripts for verifying API endpoints, database state, and feature functionality.

---

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Current Testing Approach](#current-testing-approach)
3. [Quick Start](#quick-start)
4. [Test Categories](#test-categories)
5. [Running Tests](#running-tests)
6. [API Endpoint Testing with curl](#api-endpoint-testing-with-curl)
7. [Component Testing](#component-testing)
8. [Testing Best Practices](#testing-best-practices)
9. [Database Testing](#database-testing)
10. [Browser-Based Testing](#browser-based-testing)
11. [Future Testing Strategy](#future-testing-strategy)
12. [Test Script Reference](#test-script-reference)

---

## Testing Overview

The Komplexaci project is a Next.js gaming community platform that tracks member statistics across Discord, gaming sessions, and Spotify activity. Testing currently focuses on:

- API endpoint validation
- Database state verification
- Discord Gateway integration
- Real-time data updates
- Monthly and daily reset operations
- SEO and social media metadata
- Member statistics accuracy

All tests are located in `/tests` directory and require a running Next.js development server on `http://localhost:3000`.

---

## Current Testing Approach

### Manual Testing (Current)

The project relies on manual test scripts written in Node.js that:

1. Make HTTP requests to API endpoints
2. Query the SQLite database directly (better-sqlite3)
3. Verify responses and data consistency
4. Output human-readable results with status indicators
5. Can wait for background processes or state changes

**Advantages:**
- No complex test framework setup required
- Flexible validation logic
- Direct database access for state verification
- Suitable for integration testing

**Limitations:**
- No automated test discovery or execution
- No built-in assertion libraries
- Manual execution required
- Results not machine-parseable
- No coverage metrics

### Framework Status

- **Unit Testing**: Not implemented
- **Integration Testing**: Manual scripts only
- **E2E Testing**: Manual browser-based tests
- **Component Testing**: Manual verification
- **Performance Testing**: Not implemented

---

## Quick Start

### Prerequisites

1. Node.js 18+ installed
2. Next.js development server running: `npm run dev`
3. Database initialized: `analytics.db` exists in project root
4. Environment variables configured in `.env.local`

### Running Your First Test

```bash
# Test database connectivity
node tests/check-db-tables.js

# Test API endpoint
node tests/test-monthly-api.js

# Run complete daily reset flow
node tests/test-complete-flow.js
```

### Expected Output

Tests use emoji indicators for status:
- ✅ Success or passing check
- ❌ Error or failure
- ⚠️ Warning or potential issue
- 📊 Data or metric information
- 🔍 Inspection or analysis
- 🧪 Test action

---

## Test Categories

### Database Tests (Check)

Tests that verify database structure, state, and table existence.

**Files:**
- `check-db-tables.js` - Verify database tables exist
- `check-monthly-counters.js` - Verify monthly reset counters
- `check-monthly-game-minutes.js` - Verify game time calculations
- `check-nefes-correct-id.js` - Verify user ID mapping
- `check-nefes-stats.js` - Verify specific user statistics
- `check-recent-game-session.js` - Verify latest game session

**Purpose:** Ensure database schema is correct and contains expected data.

**Run example:**
```bash
node tests/check-db-tables.js
```

### API Tests (test-*.js)

Tests that verify API endpoint responses and data accuracy.

**Files:**
- `test-complete-flow.js` - Complete daily reset workflow
- `test-complete-monthly-system.js` - Full monthly cycle
- `test-daily-reset.js` - Daily reset functionality
- `test-monthly-reset.js` - Monthly reset functionality
- `test-monthly-api.js` - Monthly API response validation
- `test-immediate-update.js` - Real-time update verification
- `test-immediate-spotify-updates.js` - Spotify integration
- `test-voice-immediate-update.js` - Voice session updates
- `test-realtime-monthly-updates.js` - Real-time monthly counters
- `test-simplified-members.js` - Member list API
- `test-simplified-sessions.js` - Game session API
- `test-zander-stats.js` - Specific user statistics
- `test-awards-removal.js` - Daily awards reset

**Purpose:** Validate API responses, data calculations, and real-time updates.

**Run example:**
```bash
node tests/test-monthly-api.js
```

### Data Sync Tests

Tests that verify data synchronization between different sources.

**Files:**
- `check-all-game-sessions.js` - Verify all sessions synced
- `check-current-spotify-songs.js` - Verify Spotify sync
- `check-nefes-sync.js` - Verify member sync
- `add-monthly-games-minutes.js` - Verify minute calculations

**Purpose:** Ensure data flows correctly from Discord, external APIs, and databases.

### Metadata Tests

Tests that verify SEO and social media functionality.

**Files:**
- `seo-test.js` - Browser console test for SEO metadata
- `social-media-test.js` - Browser console test for OpenGraph

**Purpose:** Validate meta tags, structured data, and social sharing metadata.

---

## Running Tests

### Individual Test Execution

```bash
# Test database connectivity and structure
node tests/check-db-tables.js

# Test monthly statistics API
node tests/test-monthly-api.js

# Test daily reset system (requires 2 minutes waiting time)
node tests/test-complete-flow.js

# Test specific user statistics
node tests/test-zander-stats.js

# Verify game session calculations
node tests/test-simplified-sessions.js
```

### Running Multiple Tests Sequentially

Create a test runner script (recommended practice):

```bash
# tests/run-suite.js
const { exec } = require('child_process');
const fs = require('fs');

const tests = [
  'check-db-tables.js',
  'check-monthly-counters.js',
  'test-monthly-api.js',
  'test-daily-reset.js'
];

let completed = 0;

tests.forEach(test => {
  console.log(`\n${'='.repeat(50)}\nRunning: ${test}\n${'='.repeat(50)}`);

  exec(`node tests/${test}`, (error, stdout, stderr) => {
    console.log(stdout);
    if (stderr) console.error(stderr);
    completed++;

    if (completed === tests.length) {
      console.log('\nAll tests completed!');
    }
  });
});
```

Run with:
```bash
node tests/run-suite.js
```

### Long-Running Tests

Some tests wait for background processes:

```bash
# Test complete flow with 2-minute wait for Discord Gateway repopulation
node tests/test-complete-flow.js

# Monitor in another terminal:
node tests/check-db-tables.js  # Check state while test runs
```

---

## API Endpoint Testing with curl

### Database Statistics Endpoints

**Get User Statistics (Monthly)**

```bash
# Test monthly statistics for user ID
curl "http://localhost:3000/api/analytics/user/239823014126944257?timeRange=30d"

# Expected response
{
  "success": true,
  "data": {
    "totals": {
      "totalOnlineTime": 1440,
      "totalGameTime": 480,
      "totalVoiceTime": 960,
      "totalSongsPlayed": 120
    }
  }
}
```

**Get Daily Awards**

```bash
# Fetch current daily awards (Nerd of the Day, etc.)
curl "http://localhost:3000/api/analytics/awards/daily"

# Expected response
{
  "success": true,
  "dataSource": "supabase",
  "awards": [
    {
      "category": "nerd",
      "winner": {
        "id": "239823014126944257",
        "displayName": "UserName",
        "value": 480,
        "unit": "minutes"
      }
    }
  ]
}
```

**Get All Members (Simplified)**

```bash
# Fetch all members with current session data
curl "http://localhost:3000/api/members/simplified"

# Expected response
{
  "success": true,
  "members": [
    {
      "id": "...",
      "displayName": "...",
      "stats": {
        "monthlyGameTime": 480,
        "monthlyOnlineTime": 1440
      }
    }
  ]
}
```

**Get Game Sessions (Simplified)**

```bash
# Fetch all recent game sessions
curl "http://localhost:3000/api/sessions/simplified"

# Expected response
{
  "success": true,
  "sessions": [
    {
      "id": "...",
      "userId": "...",
      "gameName": "...",
      "duration": 60,
      "startTime": "2024-11-30T10:00:00Z"
    }
  ]
}
```

### Administrative Endpoints

**Trigger Daily Reset**

```bash
# POST request to reset daily statistics
curl -X POST "http://localhost:3000/api/analytics/reset-daily" \
  -H "Content-Type: application/json"

# Expected response
{
  "success": true,
  "summary": {
    "gatewayReset": true,
    "userStatsReset": true,
    "historicalSnapshotsCreated": 25
  }
}
```

**Get Reset Status**

```bash
# Check current status without triggering reset
curl "http://localhost:3000/api/analytics/reset-daily"

# Expected response
{
  "success": true,
  "data": {
    "currentUserStats": 25,
    "activeUserStats": 15,
    "activeSessions": ["session1", "session2"]
  }
}
```

**Trigger Monthly Reset**

```bash
# POST request to reset monthly statistics
curl -X POST "http://localhost:3000/api/analytics/reset-monthly" \
  -H "Content-Type: application/json"

# Expected response
{
  "success": true,
  "summary": {
    "recordsArchived": 25,
    "countersReset": true,
    "timestamp": "2024-11-30T12:00:00Z"
  }
}
```

### Testing Workflow with curl

**Complete API validation flow:**

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "1. Check current user statistics..."
curl -s "$BASE_URL/api/analytics/user/239823014126944257?timeRange=30d" | jq .

echo -e "\n2. Check daily awards..."
curl -s "$BASE_URL/api/analytics/awards/daily" | jq '.awards'

echo -e "\n3. Get member list..."
curl -s "$BASE_URL/api/members/simplified" | jq '.members[0:3]'

echo -e "\n4. Get recent sessions..."
curl -s "$BASE_URL/api/sessions/simplified" | jq '.sessions[0:3]'

echo -e "\nValidation complete!"
```

Save as `tests/validate-api.sh` and run:
```bash
chmod +x tests/validate-api.sh
./tests/validate-api.sh
```

---

## Component Testing

### Browser Console Testing

Component and metadata testing is performed directly in the browser console.

**SEO Metadata Testing**

1. Open your website in browser: `http://localhost:3000`
2. Open Developer Console (F12 or Cmd+Option+J)
3. Copy the SEO test function into console:

```javascript
function checkSEO() {
  const title = document.querySelector('title');
  const description = document.querySelector('meta[name="description"]');
  const canonical = document.querySelector('link[rel="canonical"]');
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogImage = document.querySelector('meta[property="og:image"]');

  console.log('Title:', title?.textContent || 'Missing');
  console.log('Description:', description?.content || 'Missing');
  console.log('Canonical URL:', canonical?.href || 'Missing');
  console.log('OG Title:', ogTitle?.content || 'Missing');
  console.log('OG Image:', ogImage?.content || 'Missing');
}

checkSEO();
```

**Expected Checks:**
- Title tag present and between 30-60 characters
- Meta description between 120-160 characters
- Canonical URL matches current page
- OpenGraph tags (og:title, og:description, og:image)
- Twitter card tags for social sharing

**Social Media Testing**

1. Open Developer Console on any page
2. Copy and run the social media test:

```javascript
function testSocialSharing() {
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  const ogImage = document.querySelector('meta[property="og:image"]');
  const twitterCard = document.querySelector('meta[name="twitter:card"]');

  console.log('OpenGraph Title:', ogTitle?.content);
  console.log('OpenGraph Description:', ogDesc?.content);
  console.log('OpenGraph Image:', ogImage?.content);
  console.log('Twitter Card:', twitterCard?.content);
}

testSocialSharing();
```

**What to verify:**
- Image loads and has correct dimensions (1200x630 recommended)
- Title is appropriate for social sharing
- Description is concise and informative
- All required tags are present

**Automated Testing Tools:**
- Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- Google Rich Results Test: https://search.google.com/test/rich-results

---

## Testing Best Practices

### 1. Database State Management

**Always verify database state before and after tests:**

```javascript
const Database = require('better-sqlite3');
const db = new Database('./analytics.db');

function getDBState(userId) {
  return db.prepare(`
    SELECT * FROM user_stats WHERE user_id = ?
  `).get(userId);
}

// Before test
const beforeState = getDBState(userId);

// Perform action...

// After test
const afterState = getDBState(userId);

// Verify change
console.assert(afterState.monthlyGameTime !== beforeState.monthlyGameTime);

db.close();
```

### 2. API Response Validation

**Always validate response structure:**

```javascript
async function testAPI() {
  const response = await fetch('http://localhost:3000/api/endpoint');
  const data = await response.json();

  // Validate success
  if (!data.success) {
    throw new Error(`API failed: ${data.error}`);
  }

  // Validate data structure
  if (!data.data || !data.data.totals) {
    throw new Error('Invalid response structure');
  }

  // Validate data types
  if (typeof data.data.totals.totalGameTime !== 'number') {
    throw new Error('Invalid data type for totalGameTime');
  }

  return data;
}
```

### 3. Test Isolation

**Each test should be independent:**

- Don't rely on other tests running first
- Use unique test data when possible
- Clean up resources (close database connections)
- Document any state changes required

```javascript
// Good - isolated test
async function testMonthlyAPI() {
  const userId = '239823014126944257';
  const response = await fetch(`/api/analytics/user/${userId}?timeRange=30d`);
  const data = await response.json();

  console.assert(data.success, 'API should return success');
  console.assert(data.data.totals, 'Should contain totals');

  return data;
}
```

### 4. Error Handling

**Always handle errors properly:**

```javascript
try {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(`API error: ${data.message}`);
  }

  return data;
} catch (error) {
  console.error('Test failed:', error.message);
  process.exit(1);
}
```

### 5. Meaningful Output

**Provide clear, actionable test output:**

```javascript
// Good
console.log('✅ Monthly reset completed successfully');
console.log(`   Records archived: ${data.recordsArchived}`);
console.log(`   Timestamp: ${data.timestamp}`);

// Bad
console.log('ok');
```

### 6. Test Naming Convention

Follow consistent naming for test scripts:

- `check-*.js` - Database state verification
- `test-*.js` - API endpoint testing
- `seo-test.js` - Browser-based metadata testing
- `social-media-test.js` - Social sharing testing

### 7. Documentation

Every test script should include:

```javascript
/**
 * Test Description
 *
 * Purpose: What this test validates
 * Prerequisites: What must be set up first
 * Run: node tests/test-name.js
 *
 * Expected output:
 * - Specific assertions
 * - Key metrics to verify
 */
```

---

## Database Testing

### Direct Database Queries

Tests access the SQLite database directly using `better-sqlite3`:

```javascript
const Database = require('better-sqlite3');
const db = new Database('./analytics.db');

// Query user statistics
const userStats = db.prepare(`
  SELECT * FROM user_stats WHERE user_id = ?
`).get('239823014126944257');

console.log('Monthly game time:', userStats.monthly_game_time);

// Query game sessions
const sessions = db.prepare(`
  SELECT * FROM game_sessions
  WHERE user_id = ? AND date(start_time) = date('now')
`).all('239823014126944257');

console.log('Sessions today:', sessions.length);

db.close();
```

### Database Schema Understanding

**Key tables:**
- `user_stats` - Current monthly/daily totals per user
- `game_sessions` - Historical game session records
- `spotify_sessions` - Spotify listening history
- `voice_sessions` - Discord voice channel time
- `historical_snapshots` - Daily state archives

**Important columns:**
- `monthly_game_time` - Monthly game duration in minutes
- `daily_game_time` - Daily game duration in minutes
- `updated_at` - Last modification timestamp
- `created_at` - Record creation timestamp

### Common Database Checks

**Verify reset occurred:**

```javascript
const db = new Database('./analytics.db');

// Check if daily counters are zero
const stats = db.prepare(`
  SELECT COUNT(*) as count FROM user_stats
  WHERE daily_game_time > 0
`).get();

if (stats.count === 0) {
  console.log('✅ Daily reset successful - all daily counters are zero');
} else {
  console.log(`❌ Daily reset incomplete - ${stats.count} users still have daily time`);
}

db.close();
```

---

## Browser-Based Testing

### Test Scripts Included

**seo-test.js** - Browser console function
- Validates meta tags and structured data
- Checks Open Graph implementation
- Verifies Twitter cards
- Analyzes image alt text
- Checks heading structure

**Usage:**
1. Open browser console on any page
2. Copy `seo-test.js` function into console
3. Run: `checkSEO()`

**social-media-test.js** - Browser console function
- Validates social sharing metadata
- Tests image dimensions
- Checks content length
- Provides share preview

**Usage:**
1. Open browser console on any page
2. Copy `social-media-test.js` function into console
3. Run: `testSocialSharing()`

### Manual Component Testing Checklist

When testing components manually:

- [ ] Component renders without errors
- [ ] All props display correctly
- [ ] Links navigate to correct pages
- [ ] Forms submit data properly
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Accessibility features work (keyboard nav, screen readers)
- [ ] Error states display correctly
- [ ] Loading states are visible

---

## Future Testing Strategy

### Recommended Path

#### Phase 1: Add Test Framework (Immediate)

Implement Jest for unit and integration testing:

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom ts-jest
```

Create `jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts']
};
```

#### Phase 2: Unit Tests (Short-term)

- Test utility functions in isolation
- Test API response handlers
- Test data validation functions
- Target: 60%+ coverage

Example structure:
```
src/
  utils/
    __tests__/
      calculateMonthlyTime.test.ts
      validateUserStats.test.ts
  api/
    __tests__/
      handlers.test.ts
```

#### Phase 3: Integration Tests (Medium-term)

- Test API endpoints with test database
- Test Discord integration
- Test database operations
- Test real-time update flows

Use a test database:
```javascript
// Setup test DB
const testDb = new Database(':memory:');
// Initialize schema
// Run test
// Verify results
```

#### Phase 4: E2E Tests (Long-term)

Implement Playwright for end-to-end testing:

```bash
npm install --save-dev @playwright/test
```

Example test:
```typescript
import { test, expect } from '@playwright/test';

test('user can view monthly statistics', async ({ page }) => {
  await page.goto('http://localhost:3000/stats');
  await expect(page.locator('[data-testid="monthly-game-time"]')).toBeVisible();
  const gameTime = await page.locator('[data-testid="monthly-game-time"]').textContent();
  expect(gameTime).toMatch(/\d+\s*minutes/);
});
```

### Test Infrastructure Setup

**Create package.json scripts:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

**Create GitHub Actions workflow for CI/CD:**
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run test:e2e
```

### Success Metrics

- Unit test coverage: >60%
- Integration test coverage: >40%
- E2E test coverage: Core user flows
- Test execution time: <5 minutes
- CI/CD pass rate: >95%

---

## Test Script Reference

### Quick Index

| Script | Type | Purpose | Runtime |
|--------|------|---------|---------|
| `check-db-tables.js` | DB Check | Verify table structure | <1s |
| `check-monthly-counters.js` | DB Check | Verify counter values | <1s |
| `check-monthly-game-minutes.js` | DB Check | Verify game calculations | <1s |
| `check-nefes-correct-id.js` | DB Check | Verify user mapping | <1s |
| `check-nefes-stats.js` | DB Check | Verify user stats | <1s |
| `check-recent-game-session.js` | DB Check | Verify recent sessions | <1s |
| `check-all-game-sessions.js` | Sync Check | Verify session sync | <1s |
| `check-current-spotify-songs.js` | Sync Check | Verify Spotify sync | <1s |
| `check-nefes-sync.js` | Sync Check | Verify data sync | <1s |
| `add-monthly-games-minutes.js` | Data Check | Verify calculations | <1s |
| `test-complete-flow.js` | API Test | Complete daily reset flow | 2m 10s |
| `test-complete-monthly-system.js` | API Test | Full monthly cycle | Varies |
| `test-daily-reset.js` | API Test | Daily reset validation | <5s |
| `test-monthly-reset.js` | API Test | Monthly reset validation | <5s |
| `test-monthly-api.js` | API Test | Monthly API endpoint | <1s |
| `test-immediate-update.js` | API Test | Real-time updates | <5s |
| `test-immediate-spotify-updates.js` | API Test | Spotify updates | <5s |
| `test-voice-immediate-update.js` | API Test | Voice updates | <5s |
| `test-realtime-monthly-updates.js` | API Test | Real-time monthly | <5s |
| `test-simplified-members.js` | API Test | Members endpoint | <1s |
| `test-simplified-sessions.js` | API Test | Sessions endpoint | <1s |
| `test-zander-stats.js` | API Test | User stats endpoint | <1s |
| `test-awards-removal.js` | API Test | Daily awards reset | <5s |
| `seo-test.js` | Browser Test | SEO metadata | Manual |
| `social-media-test.js` | Browser Test | Social sharing | Manual |

### Running Grouped Tests

**Run all database checks:**
```bash
for file in tests/check-*.js; do
  echo "Running $(basename $file)..."
  node "$file"
  echo "---"
done
```

**Run all API tests:**
```bash
for file in tests/test-*.js; do
  echo "Running $(basename $file)..."
  node "$file"
  echo "---"
done
```

**Run quick validation (all <1s tests):**
```bash
node tests/check-db-tables.js && \
node tests/check-monthly-counters.js && \
node tests/test-monthly-api.js && \
node tests/test-simplified-members.js
```

---

## Troubleshooting

### Common Issues

**Error: Cannot find module 'better-sqlite3'**

Solution:
```bash
npm install better-sqlite3
```

**Error: ENOENT: no such file or directory './analytics.db'**

Solution:
- Ensure database is initialized in project root
- Check your development environment has run database setup
- Verify file path in test is correct

**Error: Connection refused to localhost:3000**

Solution:
- Start Next.js dev server: `npm run dev`
- Verify it's running on port 3000
- Check for port conflicts: `lsof -i :3000` (macOS/Linux)

**API returns null or empty data**

Solution:
- Check that Discord Gateway is running and connected
- Verify users exist in Discord server
- Check database has current data
- Run `check-db-tables.js` to verify schema

**Tests pass locally but fail in CI/CD**

Common causes:
- Database not initialized in CI environment
- Environment variables missing
- Port 3000 already in use
- Time-based tests failing due to timing differences

---

## Contributing Tests

When adding new test scripts:

1. Use consistent naming: `test-feature-name.js` or `check-feature-name.js`
2. Include documentation comments at top
3. Validate all responses before use
4. Handle errors with descriptive messages
5. Use emoji indicators for status
6. Close database connections: `db.close()`
7. Exit with proper code on error: `process.exit(1)`
8. Add entry to test reference table above

Example template:

```javascript
/**
 * Test Feature Name
 *
 * Purpose: What this test validates
 * Prerequisites: Required setup
 * Run: node tests/test-feature.js
 */

const fetch = require('node-fetch');
const Database = require('better-sqlite3');

async function testFeature() {
  console.log('🧪 Testing Feature Name\n');

  try {
    // Your test logic
    console.log('✅ Test passed');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testFeature();
```

---

## Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Discord.js Guide](https://discordjs.guide/)

### Testing References
- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)

### Tools
- [curl Documentation](https://curl.se/docs/)
- [jq JSON Processor](https://stedolan.github.io/jq/)
- [Postman API Client](https://www.postman.com/)

---

**Last Updated:** November 2024
**Maintained By:** Komplexaci Development Team
**License:** Project License
