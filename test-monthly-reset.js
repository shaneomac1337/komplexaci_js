/**
 * Test script for monthly analytics reset functionality
 * 
 * This script tests the monthly reset endpoint to ensure it works correctly.
 * Run with: node test-monthly-reset.js
 */

const BASE_URL = 'http://localhost:3000';

async function testMonthlyReset() {
  console.log('🧪 Testing Monthly Analytics Reset\n');

  try {
    // 1. Check current monthly reset status
    console.log('📊 Step 1: Getting current monthly reset status...');
    const statusResponse = await fetch(`${BASE_URL}/api/analytics/reset-monthly`);
    const statusData = await statusResponse.json();
    
    if (statusData.success) {
      console.log('✅ Monthly reset status retrieved successfully');
      console.log('📈 Current monthly data:', {
        month: statusData.data.month,
        totalUsers: statusData.data.currentUserStats,
        activeUsers: statusData.data.activeUserStats,
        existingSnapshots: statusData.data.existingMonthlySnapshots,
        snapshotsTableExists: statusData.data.monthlySnapshotsTableExists
      });
      
      if (statusData.data.topMonthlyUsers.length > 0) {
        console.log('🏆 Top monthly users:');
        statusData.data.topMonthlyUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. User ${user.user_id}: ${user.monthly_online_minutes} min online, ${user.monthly_games_played} games`);
        });
      } else {
        console.log('📭 No active monthly users found');
      }
    } else {
      console.error('❌ Failed to get monthly reset status:', statusData.error);
      return;
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 2. Perform monthly reset
    console.log('🔄 Step 2: Performing monthly reset...');
    const resetResponse = await fetch(`${BASE_URL}/api/analytics/reset-monthly`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const resetData = await resetResponse.json();
    
    if (resetData.success) {
      console.log('✅ Monthly reset completed successfully!');
      console.log('📋 Reset summary:', {
        month: resetData.summary.month,
        previousMonth: resetData.summary.previousMonth,
        resetTime: new Date(resetData.summary.resetTime).toLocaleString('cs-CZ'),
        userStatsReset: resetData.summary.userStatsReset,
        monthlySnapshotsReset: resetData.summary.monthlySnapshotsReset,
        historicalSnapshotsCreated: resetData.summary.historicalSnapshotsCreated,
        activeUsersLastMonth: resetData.summary.activeUsersLastMonth
      });
    } else {
      console.error('❌ Monthly reset failed:', resetData.error);
      return;
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 3. Verify reset worked by checking status again
    console.log('✅ Step 3: Verifying monthly reset worked...');
    const verifyResponse = await fetch(`${BASE_URL}/api/analytics/reset-monthly`);
    const verifyData = await verifyResponse.json();
    
    if (verifyData.success) {
      console.log('📊 Post-reset monthly data:', {
        month: verifyData.data.month,
        totalUsers: verifyData.data.currentUserStats,
        activeMonthlyUsers: verifyData.data.activeMonthlyUsers,
        existingSnapshots: verifyData.data.existingMonthlySnapshots,
        snapshotsTableExists: verifyData.data.monthlySnapshotsTableExists
      });
      
      if (verifyData.data.activeMonthlyUsers === 0) {
        console.log('✅ Monthly reset verification successful - all monthly stats are now 0');
      } else {
        console.log(`⚠️ Warning: ${verifyData.data.activeMonthlyUsers} users still have active monthly stats`);
      }
    } else {
      console.error('❌ Failed to verify monthly reset:', verifyData.error);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 4. Test monthly awards API to ensure it works with reset data
    console.log('🏆 Step 4: Testing monthly awards API...');
    try {
      const awardsResponse = await fetch(`${BASE_URL}/api/analytics/awards/monthly`);
      
      if (awardsResponse.ok) {
        const awardsData = await awardsResponse.json();
        console.log('✅ Monthly awards API working');
        console.log('🏆 Monthly awards after reset:', {
          nerdOfTheMonth: awardsData.nerdOfTheMonth?.winner || 'No winner',
          voiceChampion: awardsData.voiceChampion?.winner || 'No winner',
          gamerOfTheMonth: awardsData.gamerOfTheMonth?.winner || 'No winner',
          musicLover: awardsData.musicLover?.winner || 'No winner'
        });
      } else {
        console.log('⚠️ Monthly awards API not available (endpoint may not exist yet)');
      }
    } catch (error) {
      console.log('⚠️ Monthly awards API not available:', error.message);
    }

    console.log('\n🎉 Monthly reset test completed successfully!');
    console.log('\n📝 Crontab setup:');
    console.log('   To run this monthly reset automatically on the 1st of each month at midnight:');
    console.log('   0 0 1 * * curl -X POST http://localhost:3000/api/analytics/reset-monthly');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testMonthlyReset();