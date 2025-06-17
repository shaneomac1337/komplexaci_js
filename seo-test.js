// SEO Testing Script for Local Development
// Run this in your browser console on each page

function checkSEO() {
  console.log('🔍 SEO Analysis for:', window.location.href);
  console.log('=====================================');

  // Check Title
  const title = document.querySelector('title');
  const titleLength = title ? title.textContent.length : 0;
  console.log('📝 Title:', title ? title.textContent : '❌ Missing');
  console.log('   Length:', titleLength, titleLength > 60 ? '⚠️ Too long' : titleLength < 30 ? '⚠️ Too short' : '✅ Good');

  // Check Meta Description
  const description = document.querySelector('meta[name="description"]');
  const descLength = description ? description.content.length : 0;
  console.log('📄 Description:', description ? description.content : '❌ Missing');
  console.log('   Length:', descLength, descLength > 160 ? '⚠️ Too long' : descLength < 120 ? '⚠️ Too short' : '✅ Good');

  // Check Canonical URL
  const canonical = document.querySelector('link[rel="canonical"]');
  console.log('🔗 Canonical:', canonical ? canonical.href : '❌ Missing');

  // Check OpenGraph
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  const ogImage = document.querySelector('meta[property="og:image"]');
  const ogUrl = document.querySelector('meta[property="og:url"]');
  console.log('📱 OpenGraph Title:', ogTitle ? ogTitle.content : '❌ Missing');
  console.log('📱 OpenGraph Description:', ogDesc ? ogDesc.content : '❌ Missing');
  console.log('📱 OpenGraph Image:', ogImage ? ogImage.content : '❌ Missing');
  console.log('📱 OpenGraph URL:', ogUrl ? ogUrl.content : '❌ Missing');

  // Check Twitter Cards
  const twitterCard = document.querySelector('meta[name="twitter:card"]');
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  console.log('🐦 Twitter Card:', twitterCard ? twitterCard.content : '❌ Missing');
  console.log('🐦 Twitter Title:', twitterTitle ? twitterTitle.content : '❌ Missing');

  // Check Structured Data
  const structuredData = document.querySelectorAll('script[type="application/ld+json"]');
  console.log('🏗️ Structured Data Scripts:', structuredData.length);
  structuredData.forEach((script, index) => {
    try {
      const data = JSON.parse(script.textContent);
      console.log(`   Schema ${index + 1}:`, data['@type'] || 'Unknown type');

      // Check for rich snippet types
      if (data['@type'] === 'FAQPage') console.log('   ✅ FAQ Schema found - good for rich snippets!');
      if (data['@type'] === 'HowTo') console.log('   ✅ HowTo Schema found - good for rich snippets!');
      if (data['@type'] === 'Article') console.log('   ✅ Article Schema found - good for rich snippets!');
      if (data.aggregateRating) console.log('   ✅ Rating Schema found - good for star ratings!');

    } catch (e) {
      console.log(`   Schema ${index + 1}: ❌ Invalid JSON`);
    }
  });
  
  // Check Images Alt Text
  const images = document.querySelectorAll('img');
  const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
  console.log('🖼️ Images without alt text:', imagesWithoutAlt.length);
  
  // Check Headings Structure
  const h1 = document.querySelectorAll('h1');
  const h2 = document.querySelectorAll('h2');
  const h3 = document.querySelectorAll('h3');
  console.log('📋 Headings - H1:', h1.length, 'H2:', h2.length, 'H3:', h3.length);
  
  console.log('=====================================');
  console.log('💡 Tips for Rich Snippets like your image:');
  console.log('1. ✅ Add FAQ schema for question/answer rich snippets');
  console.log('2. ✅ Add HowTo schema for step-by-step guides');
  console.log('3. ✅ Add Review/Rating schema for star ratings');
  console.log('4. ✅ Add BreadcrumbList schema for navigation');
  console.log('5. 📝 Submit to Google Search Console');
  console.log('6. 🧪 Test with Google Rich Results Test');
  console.log('7. ⏰ Wait 2-4 weeks for Google to index and show rich snippets');
  console.log('8. 📈 Ensure high content quality and user engagement');
  console.log('=====================================');
  console.log('✅ SEO Check Complete!');
}

// Function to open Google Rich Results Test
function testRichResults() {
  const testUrl = `https://search.google.com/test/rich-results?url=${encodeURIComponent(window.location.href)}`;
  console.log('🧪 Opening Google Rich Results Test...');
  console.log('URL:', testUrl);
  window.open(testUrl, '_blank');
}

// Run the check
checkSEO();

console.log('\n🚀 To test rich results, run: testRichResults()');
