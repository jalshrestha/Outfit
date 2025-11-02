/**
 * Base Scraper Class
 * All scrapers should extend this class to maintain consistency
 */
export class BaseScraper {
  constructor(name, displayName) {
    this.name = name;
    this.displayName = displayName;
  }

  /**
   * Main scraping method - must be implemented by child classes
   * @param {Object} options - Scraping options
   * @param {number} options.maxResults - Maximum number of results
   * @param {string} options.keyword - Optional keyword/search term
   * @returns {Promise<Array>} Array of outfit objects
   */
  async scrape(options = {}) {
    throw new Error('scrape() method must be implemented by child class');
  }

  /**
   * Get cached results - can be overridden by child classes
   * @returns {Promise<Array>} Cached outfit objects
   */
  async getCached() {
    return [];
  }

  /**
   * Save results to cache - can be overridden by child classes
   * @param {Array} data - Outfit objects to cache
   */
  async saveToCache(data) {
    // Can be overridden
  }

  /**
   * Validate scraped item structure
   * @param {Object} item - Item to validate
   * @returns {boolean} True if valid
   */
  validateItem(item) {
    return (
      item &&
      typeof item === 'object' &&
      item.title &&
      item.imageUrl &&
      item.source &&
      item.category
    );
  }

  /**
   * Normalize item structure
   * @param {Object} item - Raw scraped item
   * @returns {Object} Normalized item
   */
  normalizeItem(item) {
    return {
      title: item.title || 'Untitled',
      imageUrl: item.imageUrl || '',
      price: item.price || null,
      category: item.category || 'outfit',
      source: item.source || this.displayName,
      link: item.link || ''
    };
  }
}

