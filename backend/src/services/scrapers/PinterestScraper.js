import puppeteer from 'puppeteer';
import { BaseScraper } from './BaseScraper.js';
import { saveToCache, loadFromCache } from '../scraperCache.js';
import { samplePinterestData } from '../sampleTrendingData.js';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Pinterest Scraper
 * Scrapes trending outfits from Pinterest using Puppeteer
 */
export class PinterestScraper extends BaseScraper {
  constructor() {
    super('pinterest', 'Pinterest');
  }

  /**
   * Scrape trending outfits from Pinterest
   * @param {Object} options - Scraping options
   * @param {number} options.maxResults - Maximum number of results
   * @param {string} options.keyword - URL or search keyword
   * @returns {Promise<Array>} Array of outfit objects
   */
  async scrape(options = {}) {
    const { maxResults = 10, keyword } = options;
    const targetUrl = keyword || 'https://www.pinterest.com/ideas/mens-streetwear/895613796302/';

    let browser;
    try {
      console.log(`🔍 [Pinterest] Starting scraper...`);
      console.log(`   Target: "${targetUrl}"`);
      console.log(`   Max Results: ${maxResults}`);

      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--disable-blink-features=AutomationControlled'
        ]
      });

      const page = await browser.newPage();
      await page.setUserAgent(USER_AGENT);
      await page.setViewport({ width: 1920, height: 1080 });

      // Determine if it's a URL or search keyword
      let url;
      if (targetUrl.startsWith('http')) {
        url = targetUrl;
      } else {
        url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(targetUrl)}`;
      }

      console.log('🌐 [Pinterest] Navigating to:', url);

      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      // Wait for pins to load
      console.log('⏳ [Pinterest] Waiting for content...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      try {
        await page.waitForSelector('[data-test-id="pin"]', { timeout: 10000 });
      } catch (e) {
        console.log('⚠️  [Pinterest] Could not find standard pin selector');
      }

      // Scroll to load more
      console.log('📜 [Pinterest] Scrolling...');
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Extract data
      const outfits = await page.evaluate((maxResults) => {
        const results = [];
        const selectors = [
          '[data-test-id="pin"]',
          'article[data-test-id="pin"]',
          '[data-test-id="pin-rep"]',
          'div[data-test-id="pin-rep"]',
          'div[role="listitem"]',
          '.pinContainer',
          '.Grid__Item'
        ];

        let pinElements = [];
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            pinElements = Array.from(elements);
            break;
          }
        }

        for (let i = 0; i < Math.min(pinElements.length, maxResults); i++) {
          const pin = pinElements[i];
          try {
            const images = pin.querySelectorAll('img');
            let imageUrl = null;

            for (const img of images) {
              if (img.hasAttribute('data-src')) {
                const dataSrc = img.getAttribute('data-src');
                if (dataSrc && !dataSrc.includes('placeholder') && !dataSrc.includes('1x') && !dataSrc.includes('75x')) {
                  imageUrl = dataSrc;
                  break;
                }
              }
            }

            if (!imageUrl) {
              for (const img of images) {
                const src = img.src;
                if (src && !src.includes('placeholder') && !src.includes('1x') && !src.includes('75x') && !src.includes('236x')) {
                  imageUrl = src;
                  break;
                }
              }
            }

            if (!imageUrl && images.length > 0) {
              for (const img of images) {
                const src = img.src || img.getAttribute('data-src');
                if (src && !src.includes('placeholder')) {
                  imageUrl = src;
                  break;
                }
              }
            }

            if (imageUrl) {
              if (imageUrl.includes('https://i.pinimg.com')) {
                imageUrl = imageUrl.replace(/\/\d+x\d*\//g, '/originals/');
              }

              const link = pin.querySelector('a[href*="/pin/"]');
              const title = (images[0] && images[0].alt) || `Pinterest Outfit ${i + 1}`;
              const pinUrl = link ? `https://www.pinterest.com${link.getAttribute('href')}` : '';

              results.push({
                title: title.substring(0, 100),
                imageUrl,
                price: null,
                category: 'outfit',
                source: 'Pinterest',
                link: pinUrl
              });
            }
          } catch (error) {
            console.log(`Error processing pin ${i}:`, error.message);
          }
        }

        return results;
      }, maxResults);

      console.log(`✅ [Pinterest] Scraped ${outfits.length} outfits`);

      // Save to cache
      await saveToCache('pinterest', outfits);

      return outfits.map(item => this.normalizeItem(item));

    } catch (error) {
      console.error('❌ [Pinterest] Scraper error:', error.message);

      // Try cache
      const cached = await loadFromCache('pinterest');
      if (cached.length > 0) {
        console.log('✅ [Pinterest] Returning cached results');
        return cached;
      }

      // Fallback to sample data
      console.log('⚠️  [Pinterest] Using sample data');
      await saveToCache('pinterest', samplePinterestData);
      return samplePinterestData.slice(0, maxResults);

    } finally {
      if (browser) {
        try {
          const pages = await browser.pages();
          await Promise.all(pages.map(page => page.close()));
          await browser.close();
        } catch (closeError) {
          console.error('Error closing browser:', closeError.message);
        }
      }
    }
  }

  /**
   * Get cached results
   * @returns {Promise<Array>} Cached outfit objects
   */
  async getCached() {
    return await loadFromCache('pinterest');
  }

  /**
   * Save to cache
   * @param {Array} data - Outfit objects
   */
  async saveToCache(data) {
    return await saveToCache('pinterest', data);
  }
}

