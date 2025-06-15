// SEO Testing Script for Local Development
// Run this in your browser console on each page

function checkSEO() {
  console.log('🔍 SEO Analysis for:', window.location.href);
  console.log('=====================================');
  
  // Check Title
  const title = document.querySelector('title');
  console.log('📝 Title:', title ? title.textContent : '❌ Missing');
  
  // Check Meta Description
  const description = document.querySelector('meta[name="description"]');
  console.log('📄 Description:', description ? description.content : '❌ Missing');
  
  // Check Canonical URL
  const canonical = document.querySelector('link[rel="canonical"]');
  console.log('🔗 Canonical:', canonical ? canonical.href : '❌ Missing');
  
  // Check OpenGraph
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  const ogImage = document.querySelector('meta[property="og:image"]');
  console.log('📱 OpenGraph Title:', ogTitle ? ogTitle.content : '❌ Missing');
  console.log('📱 OpenGraph Description:', ogDesc ? ogDesc.content : '❌ Missing');
  console.log('📱 OpenGraph Image:', ogImage ? ogImage.content : '❌ Missing');
  
  // Check Structured Data
  const structuredData = document.querySelectorAll('script[type="application/ld+json"]');
  console.log('🏗️ Structured Data Scripts:', structuredData.length);
  structuredData.forEach((script, index) => {
    try {
      const data = JSON.parse(script.textContent);
      console.log(`   Schema ${index + 1}:`, data['@type'] || 'Unknown type');
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
  console.log('✅ SEO Check Complete!');
}

// Run the check
checkSEO();
