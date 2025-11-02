# Scrapers Documentation

This directory contains modular scrapers for different fashion websites. Each scraper extends the `BaseScraper` class and implements the required methods.

## Architecture

- **BaseScraper.js**: Abstract base class that all scrapers must extend
- **PinterestScraper.js**: Scrapes Pinterest for trending outfits
- **HollisterScraper.js**: Scrapes Hollister for new arrivals
- **HMScraper.js**: Scrapes H&M for new arrivals
- **scraperRegistry.js**: Centralized registry that manages all scrapers

## Adding a New Scraper

To add a new scraper (e.g., for Zara), follow these steps:

### 1. Create the Scraper File

Create a new file: `ZaraScraper.js`

```javascript
import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseScraper } from './BaseScraper.js';
import { saveToCache, loadFromCache } from '../scraperCache.js';

export class ZaraScraper extends BaseScraper {
  constructor() {
    super('zara', 'Zara'); // name and displayName
  }

  /**
   * Scrape trending outfits from Zara
   * @param {Object} options - Scraping options
   * @param {number} options.maxResults - Maximum number of results
   * @returns {Promise<Array>} Array of outfit objects
   */
  async scrape(options = {}) {
    const { maxResults = 20 } = options;

    try {
      console.log(`🔍 [Zara] Starting scraper...`);
      
      // Your scraping logic here
      const url = 'https://www.zara.com/us/en/man/new-c730201.html';
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0...' },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const outfits = [];

      // Extract products using selectors
      $('.product-item').each((i, element) => {
        const $el = $(element);
        
        outfits.push({
          title: $el.find('.product-name').text().trim(),
          imageUrl: $el.find('img').attr('src'),
          price: $el.find('.price').text().trim(),
          category: 'outfit', // or categorize based on title
          source: 'Zara',
          link: $el.find('a').attr('href')
        });
      });

      // Save to cache
      await saveToCache('zara', outfits);

      // Normalize items using base class method
      return outfits.map(item => this.normalizeItem(item));

    } catch (error) {
      console.error('❌ [Zara] Scraper error:', error.message);
      
      // Try to return cached data
      const cached = await loadFromCache('zara');
      if (cached.length > 0) {
        return cached;
      }
      
      throw error;
    }
  }

  async getCached() {
    return await loadFromCache('zara');
  }

  async saveToCache(data) {
    return await saveToCache('zara', data);
  }
}
```

### 2. Register the Scraper

Open `scraperRegistry.js` and add:

```javascript
import { ZaraScraper } from './scrapers/ZaraScraper.js';

// In initializeDefaultScrapers():
this.register(new ZaraScraper());
```

That's it! The new scraper will now be available:
- Automatically in the `/api/trending?source=zara` endpoint
- In the `scraperRegistry.getAllCached()` calls
- In the `/api/trending/stats` endpoint

## Required Methods

All scrapers must implement:

1. **`scrape(options)`**: Main scraping method that returns an array of outfit objects
2. **`getCached()`**: Returns cached results (usually delegates to `loadFromCache`)
3. **`saveToCache(data)`**: Saves results to cache (usually delegates to `saveToCache`)

## Outfit Object Structure

Each outfit object should have:

```javascript
{
  title: string,        // Product name/title
  imageUrl: string,     // Full URL to product image
  price: string | null, // Price string or null
  category: string,     // 'top' | 'bottom' | 'shoes' | 'outfit'
  source: string,       // Display name (e.g., 'Zara')
  link: string          // URL to product page
}
```

## Base Class Methods

The `BaseScraper` provides:

- **`validateItem(item)`**: Validates item structure
- **`normalizeItem(item)`**: Normalizes item to standard format
- **`name`**: Scraper identifier (lowercase)
- **`displayName`**: Human-readable name

## Example: Using a Scraper Directly

```javascript
import { scraperRegistry } from './scraperRegistry.js';

// Scrape from Zara
const outfits = await scraperRegistry.scrape('zara', { maxResults: 10 });

// Get cached Zara data
const cached = await scraperRegistry.getCached('zara');

// Check if scraper exists
if (scraperRegistry.has('zara')) {
  console.log('Zara scraper is registered');
}
```

