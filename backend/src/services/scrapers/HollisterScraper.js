import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseScraper } from './BaseScraper.js';
import { saveToCache, loadFromCache } from '../scraperCache.js';
import { sampleHollisterData } from '../sampleTrendingData.js';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Hollister Scraper
 * Scrapes trending outfits from Hollister using Axios + Cheerio (like H&M)
 */
export class HollisterScraper extends BaseScraper {
  constructor() {
    super('hollister', 'Hollister');
  }

  /**
   * Scrape trending outfits from Hollister
   * @param {Object} options - Scraping options
   * @param {number} options.maxResults - Maximum number of results
   * @returns {Promise<Array>} Array of outfit objects
   */
  async scrape(options = {}) {
    const { maxResults = 20 } = options;

    try {
      console.log(`\n🔍 [Hollister] Starting scraper...`);
      console.log(`   Max Results: ${maxResults}`);

      const url = 'https://www.hollisterco.com/shop/us/mens-licensed-collection';
      console.log('🌐 [Hollister] Fetching:', url);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const outfits = [];

      // Try multiple selectors
      const selectors = [
        '.product-tile',
        '.product-card',
        'article.product',
        '[data-product-id]',
        '.productCard',
        'li[class*="product"]',
        'div[class*="product"]'
      ];

      let productElements = null;
      for (const selector of selectors) {
        productElements = $(selector);
        if (productElements.length > 0) {
          console.log(`✅ [Hollister] Found ${productElements.length} products with selector: ${selector}`);
          break;
        }
      }

      if (!productElements || productElements.length === 0) {
        throw new Error('No products found on page');
      }

      productElements.slice(0, maxResults).each((i, element) => {
        try {
          const $el = $(element);

          // Extract title
          const title = $el.find('.product-name, .product-title, h2, h3').first().text().trim()
            || $el.find('img').attr('alt')
            || `Hollister Product ${i + 1}`;

          // Extract image
          const img = $el.find('img').first();
          let imageUrl = img.attr('src') || img.attr('data-src') || img.attr('data-original') || img.attr('data-lazy-src');

          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = imageUrl.startsWith('//')
              ? `https:${imageUrl}`
              : `https://www.hollisterco.com${imageUrl}`;
          }

          // Upgrade to high-res for Hollister CDN
          if (imageUrl && imageUrl.includes('hollisterco.com')) {
            imageUrl = imageUrl.replace(/\?.*$/, '?wid=800&hei=1000&fit=crop');
          }

          // Extract price
          const priceText = $el.find('.price, .product-price, [class*="price"]').first().text().trim();
          const price = priceText || null;

          // Extract link
          const link = $el.find('a').first().attr('href');
          const productUrl = link
            ? (link.startsWith('http') ? link : `https://www.hollisterco.com${link}`)
            : url;

          // Determine category
          let category = 'outfit';
          const titleLower = title.toLowerCase();
          if (titleLower.includes('shirt') || titleLower.includes('tee') || titleLower.includes('t-shirt') ||
              titleLower.includes('hoodie') || titleLower.includes('jacket') || titleLower.includes('sweater') ||
              titleLower.includes('top') || titleLower.includes('polo')) {
            category = 'top';
          } else if (titleLower.includes('jean') || titleLower.includes('pant') || titleLower.includes('short') ||
                     titleLower.includes('jogger') || titleLower.includes('chino')) {
            category = 'bottom';
          } else if (titleLower.includes('shoe') || titleLower.includes('sneaker') || titleLower.includes('boot')) {
            category = 'shoes';
          }

          if (imageUrl && !imageUrl.includes('placeholder') && !imageUrl.includes('Flyout') && !imageUrl.includes('Nav-')) {
            outfits.push({
              title: title.substring(0, 150),
              imageUrl,
              price,
              category,
              source: 'Hollister',
              link: productUrl
            });
          }
        } catch (error) {
          console.log(`⚠️  [Hollister] Error processing item ${i}:`, error.message);
        }
      });

      console.log(`✅ [Hollister] Successfully scraped ${outfits.length} outfits`);
      console.log(`   └─ Saving to cache...`);
      await saveToCache('hollister', outfits);
      console.log(`   └─ ✅ Cache updated\n`);

      return outfits.map(item => this.normalizeItem(item));

    } catch (error) {
      console.error('❌ [Hollister] Scraper error:', error.message);

      const cached = await loadFromCache('hollister');
      if (cached.length > 0) {
        console.log('✅ [Hollister] Returning cached results');
        return cached;
      }

      console.log('⚠️  [Hollister] Using sample data');
      await saveToCache('hollister', sampleHollisterData);
      return sampleHollisterData.slice(0, maxResults);
    }
  }

  async getCached() {
    return await loadFromCache('hollister');
  }

  async saveToCache(data) {
    return await saveToCache('hollister', data);
  }
}
