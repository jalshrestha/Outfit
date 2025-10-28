import { fetchHollisterTrends, fetchHMTrends } from './src/services/trendingScraper.js';

console.log('🧪 Testing Hollister Scraper...\n');

try {
  const hollisterResults = await fetchHollisterTrends(5);
  console.log('\n✅ Hollister Results:', hollisterResults.length);
  if (hollisterResults.length > 0) {
    console.log('\nFirst item:', JSON.stringify(hollisterResults[0], null, 2));
  }
} catch (error) {
  console.error('\n❌ Hollister failed:', error.message);
}

console.log('\n\n🧪 Testing H&M Scraper...\n');

try {
  const hmResults = await fetchHMTrends(5);
  console.log('\n✅ H&M Results:', hmResults.length);
  if (hmResults.length > 0) {
    console.log('\nFirst item:', JSON.stringify(hmResults[0], null, 2));
  }
} catch (error) {
  console.error('\n❌ H&M failed:', error.message);
}

console.log('\n✅ Test complete!');
process.exit(0);
