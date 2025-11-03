import { PinterestScraper } from './scrapers/PinterestScraper.js';
import { HollisterScraper } from './scrapers/HollisterScraper.js';
import { HMScraper } from './scrapers/HMScraper.js';

/**
 * Scraper Registry
 * Centralized registry for all scrapers
 * Add new scrapers here to make them available throughout the app
 */
class ScraperRegistry {
  constructor() {
    this.scrapers = new Map();
    this.initializeDefaultScrapers();
  }

  /**
   * Initialize default scrapers
   */
  initializeDefaultScrapers() {
    // Register built-in scrapers
    this.register(new PinterestScraper());
    this.register(new HollisterScraper());
    this.register(new HMScraper());
  }

  /**
   * Register a new scraper
   * @param {BaseScraper} scraper - Scraper instance
   */
  register(scraper) {
    this.scrapers.set(scraper.name.toLowerCase(), scraper);
    console.log(`✅ Registered scraper: ${scraper.displayName} (${scraper.name})`);
  }

  /**
   * Get a scraper by name
   * @param {string} name - Scraper name (e.g., 'pinterest', 'hollister')
   * @returns {BaseScraper|null} Scraper instance or null if not found
   */
  get(name) {
    return this.scrapers.get(name.toLowerCase()) || null;
  }

  /**
   * Get all registered scrapers
   * @returns {Array<BaseScraper>} Array of scraper instances
   */
  getAll() {
    return Array.from(this.scrapers.values());
  }

  /**
   * Get all scraper names
   * @returns {Array<string>} Array of scraper names
   */
  getNames() {
    return Array.from(this.scrapers.keys());
  }

  /**
   * Check if a scraper exists
   * @param {string} name - Scraper name
   * @returns {boolean} True if scraper exists
   */
  has(name) {
    return this.scrapers.has(name.toLowerCase());
  }

  /**
   * Scrape from a specific source
   * @param {string} sourceName - Source name
   * @param {Object} options - Scraping options
   * @returns {Promise<Array>} Scraped results
   */
  async scrape(sourceName, options = {}) {
    const scraper = this.get(sourceName);
    if (!scraper) {
      throw new Error(`Scraper "${sourceName}" not found`);
    }

    return await scraper.scrape(options);
  }

  /**
   * Scrape from multiple sources
   * @param {Array<string>} sourceNames - Array of source names, or 'all' for all sources
   * @param {Object} options - Scraping options
   * @returns {Promise<Object>} Object with results keyed by source name
   */
  async scrapeMultiple(sourceNames = 'all', options = {}) {
    const sources = sourceNames === 'all' ? this.getNames() : sourceNames;
    const results = {};

    const promises = sources.map(async (sourceName) => {
      try {
        const scraper = this.get(sourceName);
        if (scraper) {
          results[sourceName] = await scraper.scrape(options);
        } else {
          results[sourceName] = [];
          console.warn(`⚠️  Scraper "${sourceName}" not found`);
        }
      } catch (error) {
        console.error(`❌ Error scraping ${sourceName}:`, error.message);
        results[sourceName] = [];
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  /**
   * Get cached results from a source
   * @param {string} sourceName - Source name
   * @returns {Promise<Array>} Cached results
   */
  async getCached(sourceName) {
    const scraper = this.get(sourceName);
    if (!scraper) {
      return [];
    }

    return await scraper.getCached();
  }

  /**
   * Get cached results from all sources
   * @returns {Promise<Object>} Object with cached results keyed by source name
   */
  async getAllCached() {
    const results = {};
    const promises = this.getNames().map(async (sourceName) => {
      results[sourceName] = await this.getCached(sourceName);
    });

    await Promise.allSettled(promises);
    return results;
  }
}

// Export singleton instance
export const scraperRegistry = new ScraperRegistry();

// Export class for testing
export { ScraperRegistry };

