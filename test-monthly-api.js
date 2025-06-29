const fetch = require('node-fetch');

async function testMonthlyAPI() {
  try {
    console.log('🔍 Testing monthly API for ZanderOconner...');
    
    const response = await fetch('http://localhost:3000/api/analytics/user/239823014126944257?timeRange=30d');
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ API Response successful');
      console.log('📊 Monthly totals:');
      console.log('  - Total online time:', data.data.totals.totalOnlineTime, 'minutes');
      console.log('  - Total game time:', data.data.totals.totalGameTime, 'minutes');
      console.log('  - Total voice time:', data.data.totals.totalVoiceTime, 'minutes');
      console.log('  - Total songs played:', data.data.totals.totalSongsPlayed);
      
      console.log('\n🎯 Expected vs Actual:');
      console.log('  - Expected monthly game time: 0 minutes (no sessions after reset)');
      console.log('  - Actual API response:', data.data.totals.totalGameTime, 'minutes');
      
      if (data.data.totals.totalGameTime === 0) {
        console.log('\n✅ SUCCESS: API correctly shows 0 minutes for monthly game time!');
        console.log('💡 The monthly reset system is working correctly');
      } else {
        console.log('\n❌ ISSUE: API still showing non-zero game time');
      }
    } else {
      console.log('❌ API Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testMonthlyAPI();