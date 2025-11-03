/**
 * Backward Compatibility Wrapper
 * This file maintains backward compatibility with the old API
 * while using the new scraper registry under the hood
 */

import { scraperRegistry } from './scraperRegistry.js';

/**
 * Fetch Pinterest trends (backward compatible)
 * @param {string} keyword - URL or search keyword
 * @param {number} maxResults - Maximum number of results
 * @returns {Promise<Array>} Array of outfit objects
 */
export async function fetchPinterestTrends(keyword, maxResults = 10) {
  return await scraperRegistry.scrape('pinterest', {
    maxResults,
    keyword
  });
}

/**
 * Fetch Hollister trends (backward compatible)
 * @param {number} maxResults - Maximum number of results
 * @returns {Promise<Array>} Array of outfit objects
 */
export async function fetchHollisterTrends(maxResults = 20) {
  return await scraperRegistry.scrape('hollister', { maxResults });
}

/**
 * Fetch H&M trends (backward compatible)
 * @param {number} maxResults - Maximum number of results
 * @returns {Promise<Array>} Array of outfit objects
 */
export async function fetchHMTrends(maxResults = 20) {
  return await scraperRegistry.scrape('hm', { maxResults });
}

/**
 * Fetch all trends (backward compatible)
 * @param {Object} options - Options object
 * @param {number} options.maxResults - Max results per source
 * @returns {Promise<Object>} Object with results from all sources
 */
export async function fetchAllTrends(options = {}) {
  const { maxResults = 20 } = options;
  const results = await scraperRegistry.scrapeMultiple('all', { maxResults });
  
  return {
    pinterest: results.pinterest || [],
    hollister: results.hollister || [],
    hm: results.hm || []
  };
}
