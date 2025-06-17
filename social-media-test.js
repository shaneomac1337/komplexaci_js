// Social Media Sharing Test Script
// Run this in your browser console to test how your page will look when shared

function testSocialSharing() {
  console.log('🔗 Social Media Sharing Test for:', window.location.href);
  console.log('================================================');
  
  // Get Open Graph data
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  const ogImage = document.querySelector('meta[property="og:image"]');
  const ogUrl = document.querySelector('meta[property="og:url"]');
  const ogType = document.querySelector('meta[property="og:type"]');
  const ogSiteName = document.querySelector('meta[property="og:site_name"]');
  
  console.log('📱 Open Graph Data (Facebook, WhatsApp, Messenger):');
  console.log('   Title:', ogTitle ? ogTitle.content : '❌ Missing');
  console.log('   Description:', ogDescription ? ogDescription.content : '❌ Missing');
  console.log('   Image:', ogImage ? ogImage.content : '❌ Missing');
  console.log('   URL:', ogUrl ? ogUrl.content : '❌ Missing');
  console.log('   Type:', ogType ? ogType.content : '❌ Missing');
  console.log('   Site Name:', ogSiteName ? ogSiteName.content : '❌ Missing');
  
  // Get Twitter Card data
  const twitterCard = document.querySelector('meta[name="twitter:card"]');
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  const twitterDescription = document.querySelector('meta[name="twitter:description"]');
  const twitterImage = document.querySelector('meta[name="twitter:image"]');
  const twitterSite = document.querySelector('meta[name="twitter:site"]');
  
  console.log('\n🐦 Twitter Card Data:');
  console.log('   Card Type:', twitterCard ? twitterCard.content : '❌ Missing');
  console.log('   Title:', twitterTitle ? twitterTitle.content : '❌ Missing');
  console.log('   Description:', twitterDescription ? twitterDescription.content : '❌ Missing');
  console.log('   Image:', twitterImage ? twitterImage.content : '❌ Missing');
  console.log('   Site:', twitterSite ? twitterSite.content : '❌ Missing');
  
  // Check image dimensions and accessibility
  if (ogImage) {
    const img = new Image();
    img.onload = function() {
      console.log('\n🖼️ Image Analysis:');
      console.log('   Dimensions:', this.width + 'x' + this.height);
      console.log('   Recommended: 1200x630 pixels');
      
      if (this.width === 1200 && this.height === 630) {
        console.log('   ✅ Perfect size for social sharing!');
      } else if (this.width / this.height === 1200 / 630) {
        console.log('   ✅ Correct aspect ratio (1.91:1)');
      } else {
        console.log('   ⚠️ Consider using 1200x630 pixels for optimal display');
      }
    };
    img.onerror = function() {
      console.log('\n🖼️ Image Analysis:');
      console.log('   ❌ Image failed to load:', ogImage.content);
    };
    img.src = ogImage.content;
  }
  
  // Check title and description lengths
  console.log('\n📏 Content Length Analysis:');
  if (ogTitle) {
    const titleLength = ogTitle.content.length;
    console.log('   Title Length:', titleLength);
    if (titleLength > 60) {
      console.log('   ⚠️ Title might be truncated on some platforms');
    } else if (titleLength < 30) {
      console.log('   ⚠️ Title could be more descriptive');
    } else {
      console.log('   ✅ Title length is good');
    }
  }
  
  if (ogDescription) {
    const descLength = ogDescription.content.length;
    console.log('   Description Length:', descLength);
    if (descLength > 160) {
      console.log('   ⚠️ Description might be truncated');
    } else if (descLength < 120) {
      console.log('   ⚠️ Description could be more detailed');
    } else {
      console.log('   ✅ Description length is good');
    }
  }
  
  console.log('\n🧪 Testing Tools:');
  console.log('1. Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/');
  console.log('2. Twitter Card Validator: https://cards-dev.twitter.com/validator');
  console.log('3. LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/');
  console.log('4. WhatsApp: Just share the link in a chat to test');
  
  console.log('\n🚀 Quick Test Links:');
  const currentUrl = encodeURIComponent(window.location.href);
  console.log('Facebook Debugger:', `https://developers.facebook.com/tools/debug/?q=${currentUrl}`);
  console.log('Twitter Validator:', `https://cards-dev.twitter.com/validator`);
  
  console.log('\n✅ Social Media Test Complete!');
}

// Function to simulate how the share preview will look
function previewShare() {
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  const ogImage = document.querySelector('meta[property="og:image"]');
  const ogSiteName = document.querySelector('meta[property="og:site_name"]');
  
  console.log('\n📱 Share Preview Simulation:');
  console.log('┌─────────────────────────────────────────┐');
  console.log('│ ' + (ogSiteName ? ogSiteName.content : 'Website').padEnd(39) + ' │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│ ' + (ogTitle ? ogTitle.content.substring(0, 39) : 'Title').padEnd(39) + ' │');
  console.log('│ ' + (ogDescription ? ogDescription.content.substring(0, 39) : 'Description').padEnd(39) + ' │');
  console.log('│ ' + (ogImage ? '[IMAGE]' : '[NO IMAGE]').padEnd(39) + ' │');
  console.log('└─────────────────────────────────────────┘');
}

// Run the test
testSocialSharing();

console.log('\n💡 To see share preview simulation, run: previewShare()');
console.log('💡 To open Facebook debugger, run: window.open(`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(window.location.href)}`, "_blank")');
