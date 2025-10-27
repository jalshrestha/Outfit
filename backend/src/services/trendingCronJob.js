import cron from 'node-cron';
import { fetchAllTrends } from './trendingScraper.js';

/**
 * Initialize a cron job to refresh trending outfits every 12 hours
 * Schedule: At minute 0 past every 12th hour
 *
 * To enable this cron job, call startTrendingCronJob() from your index.js
 */
export function startTrendingCronJob() {
  // Run every 12 hours (at midnight and noon)
  const job = cron.schedule('0 */12 * * *', async () => {
    console.log('\n🕐 [CRON JOB] Starting scheduled trending outfits refresh...');
    console.log(`   Time: ${new Date().toISOString()}`);

    try {
      const results = await fetchAllTrends({ maxResults: 20 });

      const totalItems = results.pinterest.length +
                        results.hollister.length +
                        results.hm.length;

      console.log('✅ [CRON JOB] Trending cache refreshed successfully!');
      console.log(`   Pinterest: ${results.pinterest.length} items`);
      console.log(`   Hollister: ${results.hollister.length} items`);
      console.log(`   H&M: ${results.hm.length} items`);
      console.log(`   Total: ${totalItems} items`);
      console.log(`   Next refresh: ${getNextRefreshTime()}\n`);

    } catch (error) {
      console.error('❌ [CRON JOB] Failed to refresh trending cache:', error.message);
      console.log(`   Will retry at next scheduled time: ${getNextRefreshTime()}\n`);
    }
  });

  console.log('✅ Trending outfits cron job initialized');
  console.log('   Schedule: Every 12 hours (midnight and noon)');
  console.log(`   Next refresh: ${getNextRefreshTime()}`);

  return job;
}

/**
 * Calculate and format the next refresh time
 * @returns {string} Formatted next refresh time
 */
function getNextRefreshTime() {
  const now = new Date();
  const nextRefresh = new Date(now);

  // Calculate next midnight or noon
  const currentHour = now.getHours();

  if (currentHour < 12) {
    // Next refresh is at noon today
    nextRefresh.setHours(12, 0, 0, 0);
  } else {
    // Next refresh is at midnight tomorrow
    nextRefresh.setDate(nextRefresh.getDate() + 1);
    nextRefresh.setHours(0, 0, 0, 0);
  }

  return nextRefresh.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Run an immediate refresh on startup (optional)
 * Call this if you want to populate the cache when the server starts
 */
export async function runInitialRefresh() {
  console.log('🚀 Running initial trending outfits refresh...');

  try {
    const results = await fetchAllTrends({ maxResults: 20 });

    const totalItems = results.pinterest.length +
                      results.hollister.length +
                      results.hm.length;

    console.log('✅ Initial refresh completed!');
    console.log(`   Pinterest: ${results.pinterest.length} items`);
    console.log(`   Hollister: ${results.hollister.length} items`);
    console.log(`   H&M: ${results.hm.length} items`);
    console.log(`   Total: ${totalItems} items`);

    return results;

  } catch (error) {
    console.error('❌ Initial refresh failed:', error.message);
    console.log('   Server will continue using cached data if available');
    return null;
  }
}

/**
 * Stop the cron job (useful for cleanup)
 * @param {cron.ScheduledTask} job - The cron job instance
 */
export function stopTrendingCronJob(job) {
  if (job) {
    job.stop();
    console.log('🛑 Trending outfits cron job stopped');
  }
}
