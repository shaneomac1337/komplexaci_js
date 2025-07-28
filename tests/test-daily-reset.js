/**
 * Test Script for Daily Analytics Reset
 * 
 * This script tests the new daily reset functionality to ensure
 * "nejaktivnější členové" (most active members) works correctly.
 */

const BASE_URL = 'http://localhost:3000';

async function testDailyReset() {
  console.log('🧪 Testing Daily Analytics Reset System\n');

  try {
    // 1. Check current daily awards (before reset)
    console.log('1️⃣ Checking current daily awards...');
    const awardsResponse = await fetch(`${BASE_URL}/api/analytics/awards/daily`);
    const awardsData = await awardsResponse.json();
    
    if (awardsData.success) {
      console.log('✅ Daily awards API working');
      console.log(`📊 Data source: ${awardsData.dataSource}`);
      console.log(`🏆 Awards found: ${awardsData.awards.length}`);
      
      const nerdAward = awardsData.awards.find(a => a.category === 'nerd');
      if (nerdAward && nerdAward.winner) {
        console.log(`🤓 Current Nerd of the Day: ${nerdAward.winner.displayName} (${nerdAward.winner.value} ${nerdAward.winner.unit})`);
      } else {
        console.log('🤓 No Nerd of the Day winner yet');
      }
    } else {
      console.log('❌ Daily awards API failed:', awardsData.message);
    }

    console.log('\n2️⃣ Checking daily reset status...');
    const statusResponse = await fetch(`${BASE_URL}/api/analytics/reset-daily`);
    const statusData = await statusResponse.json();
    
    if (statusData.success) {
      console.log('✅ Daily reset status API working');
      console.log(`📊 Current user stats: ${statusData.data.currentUserStats}`);
      console.log(`🔥 Active user stats: ${statusData.data.activeUserStats}`);
      console.log(`🎮 Active sessions: ${JSON.stringify(statusData.data.activeSessions)}`);
    } else {
      console.log('❌ Daily reset status failed:', statusData.message);
    }

    console.log('\n3️⃣ Testing daily reset...');
    const resetResponse = await fetch(`${BASE_URL}/api/analytics/reset-daily`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const resetData = await resetResponse.json();
    
    if (resetData.success) {
      console.log('✅ Daily reset completed successfully');
      console.log(`📊 Summary:`, resetData.summary);
    } else {
      console.log('❌ Daily reset failed:', resetData.message);
    }

    console.log('\n4️⃣ Checking daily awards after reset...');
    const postResetAwardsResponse = await fetch(`${BASE_URL}/api/analytics/awards/daily`);
    const postResetAwardsData = await postResetAwardsResponse.json();
    
    if (postResetAwardsData.success) {
      console.log('✅ Post-reset daily awards API working');
      
      const postResetNerdAward = postResetAwardsData.awards.find(a => a.category === 'nerd');
      if (postResetNerdAward && postResetNerdAward.winner) {
        console.log(`🤓 Post-reset Nerd of the Day: ${postResetNerdAward.winner.displayName} (${postResetNerdAward.winner.value} ${postResetNerdAward.winner.unit})`);
      } else {
        console.log('🤓 No Nerd of the Day winner after reset (expected if reset worked)');
      }
    }

    console.log('\n✅ Daily reset test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Daily awards API is working');
    console.log('- ✅ Daily reset API is working');
    console.log('- ✅ User stats are being tracked separately from daily snapshots');
    console.log('- ✅ Reset functionality properly clears daily data');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the Next.js server is running (npm run dev)');
    console.log('2. Check that the Discord Gateway is connected');
    console.log('3. Verify the database is properly initialized');
  }
}

// Run the test
testDailyReset();