console.log('🎤 Testing Voice Session Immediate Updates...');
console.log('===========================================');

async function testVoiceImmediateUpdate() {
  try {
    console.log('\n📊 Testing voice session immediate updates...');
    
    // Get current user stats before any voice activity (shaneomac who is in voice)
    const beforeResponse = await fetch('http://localhost:3000/api/analytics/user/396360380038774784');
    const beforeData = await beforeResponse.json();
    
    if (beforeData.success) {
      console.log('✅ Current user stats retrieved');
      console.log('   Full response:', JSON.stringify(beforeData, null, 2));
    } else {
      console.log('❌ Failed to get user stats:', beforeData);
    }
    
    console.log('\n⏳ Waiting 30 seconds for voice session updates...');
    console.log('   (Make sure user is in voice channel during this time)');
    
    // Wait for voice session updates to occur
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    console.log('\n📊 Getting updated user stats...');
    
    // Get updated user stats
    const afterResponse = await fetch('http://localhost:3000/api/analytics/user/429958931700252673');
    const afterData = await afterResponse.json();
    
    if (afterData.success) {
      console.log('✅ Updated user stats retrieved');
      console.log(`   Daily voice minutes: ${afterData.stats.daily_voice_minutes}`);
      console.log(`   Daily streaming minutes: ${afterData.stats.daily_streaming_minutes}`);
      
      // Check if voice time increased
      const voiceIncrease = afterData.stats.daily_voice_minutes - beforeData.stats.daily_voice_minutes;
      const streamingIncrease = afterData.stats.daily_streaming_minutes - beforeData.stats.daily_streaming_minutes;
      
      if (voiceIncrease > 0) {
        console.log(`✅ Voice time increased by ${voiceIncrease} minutes - immediate updates working!`);
      } else {
        console.log(`⚠️ Voice time did not increase (user may not be in voice)`);
      }
      
      if (streamingIncrease > 0) {
        console.log(`✅ Streaming time increased by ${streamingIncrease} minutes`);
      }
      
      // Test the modal data
      console.log('\n🖥️ Testing modal data...');
      const modalResponse = await fetch('http://localhost:3000/api/analytics/user/429958931700252673');
      const modalData = await modalResponse.json();
      
      if (modalData.success) {
        console.log(`   Modal voice time: ${modalData.stats.daily_voice_minutes} minutes`);
        console.log(`   Modal streaming time: ${modalData.stats.daily_streaming_minutes} minutes`);
        
        if (modalData.stats.daily_voice_minutes === afterData.stats.daily_voice_minutes) {
          console.log('✅ Modal shows same voice time as user stats - consistency verified!');
        } else {
          console.log('❌ Modal voice time differs from user stats - inconsistency detected!');
        }
      }
      
    } else {
      console.log('❌ Failed to get updated user stats:', afterData.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing voice immediate updates:', error);
  }
}

// Test voice immediate updates
testVoiceImmediateUpdate();
