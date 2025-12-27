import puppeteer from 'puppeteer';
import { BaseScraper } from './BaseScraper.js';
import { saveToCache, loadFromCache } from '../scraperCache.js';
import { sampleHMData } from '../sampleTrendingData.js';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * H&M Scraper
 * Scrapes trending outfits from H&M using Puppeteer (browser automation)
 * H&M uses JavaScript-rendered content, so we need a real browser
 */
export class HMScraper extends BaseScraper {
  constructor() {
    super('hm', 'H&M');
  }

  /**
   * Scrape trending outfits from H&M
   * @param {Object} options - Scraping options
   * @param {number} options.maxResults - Maximum number of results
   * @param {string} options.keyword - URL or search keyword (optional)
   * @returns {Promise<Array>} Array of outfit objects
   */
  async scrape(options = {}) {
    const { maxResults = 20, keyword } = options;

    // Use provided keyword/URL or default to premium selection page
    const defaultUrl = 'https://www2.hm.com/en_us/men/products/premium-selection.html';
    const url = keyword || defaultUrl;

    let browser;
    try {
      console.log(`\n🔍 [H&M] Starting scraper...`);
      console.log(`   Target: "${url}"`);
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

      console.log('🌐 [H&M] Navigating to:', url);

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      console.log('   ✓ Page loaded');

      // Wait for products to load (H&M is JavaScript-rendered)
      console.log('⏳ [H&M] Waiting for content to render...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log('   ✓ Content rendered');

      // Scroll to load more products
      console.log('📜 [H&M] Scrolling to load products...');
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Extract data using page.evaluate
      const outfits = await page.evaluate((maxResults) => {
        const results = [];
        const selectors = [
          '.product-item',
          'article.hm-product-item',
          '.hm-product',
          '[data-product]',
          'li.product-item',
          '.product-tile',
          '.product-card',
          'article.product',
          '[data-product-id]',
          '.productCard',
          'li[class*="product"]',
          'div[class*="product"]',
          '.item-details',
          '.product-item-link',
          '[class*="ProductItem"]',
          '[class*="product-item"]',
          'a[href*="/productpage"]',
          'a[href*="/products"]',
          '.l-product-item',
          '.product-list-item',
          'article',
          '[data-item]'
        ];

        let productElements = [];
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            productElements = Array.from(elements);
            break;
          }
        }

        if (productElements.length === 0) {
          return results; // Return empty array if no products found
        }

        for (let i = 0; i < Math.min(productElements.length, maxResults); i++) {
          const product = productElements[i];
          try {
            // Extract title
            const titleEl = product.querySelector('.item-heading, .product-item-headline, .product-name, .product-title, h3, h2, [class*="title"], [class*="name"]');
            let title = titleEl ? titleEl.textContent.trim() : '';
            
            // Try image alt as fallback
            const img = product.querySelector('img');
            if (!title && img) {
              title = img.getAttribute('alt') || '';
            }
            
            if (!title) {
              title = `H&M Item ${i + 1}`;
            }

            // Extract image
            let imageUrl = null;
            if (img) {
              imageUrl = img.getAttribute('src') || 
                        img.getAttribute('data-src') || 
                        img.getAttribute('data-original') || 
                        img.getAttribute('data-lazy-src') ||
                        img.getAttribute('data-image-src');
              
              if (imageUrl && !imageUrl.startsWith('http')) {
                imageUrl = imageUrl.startsWith('//')
                  ? `https:${imageUrl}`
                  : `https://www2.hm.com${imageUrl}`;
              }
              
              // Upgrade to high-res for H&M CDN
              if (imageUrl && imageUrl.includes('hm.com')) {
                imageUrl = imageUrl.replace(/\?.*$/, '');
                if (!imageUrl.includes('?')) {
                  imageUrl = `${imageUrl}?wid=800&hei=1000&fit=crop`;
                }
              }
            }

            // Extract price
            const priceEl = product.querySelector('.price, .item-price, .product-price, [class*="price"], [class*="Price"]');
            const price = priceEl ? priceEl.textContent.trim() : null;

            // Extract link
            const linkEl = product.querySelector('a[href*="/productpage"], a[href*="/products"], a[href*="product"]') || product.closest('a');
            let productUrl = '';
            if (linkEl) {
              const href = linkEl.getAttribute('href') || linkEl.href;
              productUrl = href.startsWith('http') ? href : `https://www2.hm.com${href}`;
            }

            // Determine category
            let category = 'outfit';
            const titleLower = title.toLowerCase();
            if (titleLower.includes('shirt') || titleLower.includes('tee') || titleLower.includes('t-shirt') ||
                titleLower.includes('hoodie') || titleLower.includes('jacket') || titleLower.includes('sweater') ||
                titleLower.includes('top') || titleLower.includes('polo') || titleLower.includes('blazer') ||
                titleLower.includes('cardigan') || titleLower.includes('vest') || titleLower.includes('tank')) {
              category = 'top';
            } else if (titleLower.includes('jean') || titleLower.includes('pant') || titleLower.includes('short') ||
                       titleLower.includes('trouser') || titleLower.includes('jogger') || titleLower.includes('chino') ||
                       titleLower.includes('cargo')) {
              category = 'bottom';
            } else if (titleLower.includes('shoe') || titleLower.includes('sneaker') || titleLower.includes('boot') ||
                       titleLower.includes('loafer') || titleLower.includes('sandal') || titleLower.includes('slipper')) {
              category = 'shoes';
            }

            // Filter out placeholder and navigation images
            if (imageUrl && !imageUrl.includes('placeholder') && !imageUrl.includes('Flyout') && 
                !imageUrl.includes('Nav-') && !imageUrl.includes('logo') && !imageUrl.includes('icon')) {
              results.push({
                title: title.substring(0, 150),
                imageUrl,
                price,
                category,
                source: 'H&M',
                link: productUrl
              });
            }
          } catch (error) {
            console.log(`Error processing item ${i}:`, error.message);
          }
        }

        return results;
      }, maxResults);

      if (outfits.length === 0) {
        throw new Error('No products found on page');
      }

      console.log(`✅ [H&M] Successfully scraped ${outfits.length} outfits`);
      console.log(`   └─ Saving to cache...`);
      await saveToCache('hm', outfits);
      console.log(`   └─ ✅ Cache updated\n`);

      return outfits.map(item => this.normalizeItem(item));

    } catch (error) {
      console.error('❌ [H&M] Scraper error:', error.message);

      // Try to get cached results first
      const cached = await loadFromCache('hm');
      if (cached.length > 0) {
        console.log('✅ [H&M] Returning cached results');
        return cached;
      }

      // Only return sample data as fallback, but DON'T save it to cache
      // This prevents fake URLs from being cached and causing 404s
      console.log('⚠️  [H&M] Using sample data (not saving to cache)');
      return sampleHMData.slice(0, maxResults);

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

  async getCached() {
    return await loadFromCache('hm');
  }

  async saveToCache(data) {
    return await saveToCache('hm', data);
  }
}

