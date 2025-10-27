import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { samplePinterestData, sampleHollisterData, sampleHMData } from './sampleTrendingData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to cache file
const CACHE_FILE = path.join(__dirname, '../../data/trending.json');

// User-Agent to avoid being blocked
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Save scraped results to cache file
 * @param {string} source - Source name (pinterest, hollister, hm)
 * @param {Array} data - Array of outfit objects
 */
async function saveToCache(source, data) {
  try {
    let cache = {};

    // Try to read existing cache
    try {
      const cacheContent = await fs.readFile(CACHE_FILE, 'utf-8');
      cache = JSON.parse(cacheContent);
    } catch (error) {
      // File doesn't exist or is invalid, start fresh
      console.log('📝 Creating new cache file');
    }

    // Update cache with new data
    cache[source] = {
      data,
      lastUpdated: new Date().toISOString()
    };

    await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
    console.log(`✅ Saved ${data.length} items to cache for ${source}`);
  } catch (error) {
    console.error('❌ Error saving to cache:', error.message);
  }
}

/**
 * Load cached results from file
 * @param {string} source - Source name (pinterest, hollister, hm)
 * @returns {Array} Array of outfit objects or empty array
 */
async function loadFromCache(source) {
  try {
    const cacheContent = await fs.readFile(CACHE_FILE, 'utf-8');
    const cache = JSON.parse(cacheContent);

    if (cache[source] && cache[source].data) {
      console.log(`📦 Loaded ${cache[source].data.length} items from cache for ${source}`);
      console.log(`🕒 Last updated: ${cache[source].lastUpdated}`);
      return cache[source].data;
    }

    return [];
  } catch (error) {
    console.log('📭 No cache available for', source);
    return [];
  }
}

/**
 * Scrape trending outfits from Pinterest using Puppeteer
 * @param {string} keyword - URL or search keyword (default: men's streetwear collection)
 * @param {number} maxResults - Maximum number of results (default: 10)
 * @returns {Promise<Array>} Array of outfit objects
 */
export async function fetchPinterestTrends(keyword = 'https://www.pinterest.com/ideas/mens-streetwear/895613796302/', maxResults = 10) {
  let browser;

  try {
    console.log('🔍 Starting Pinterest scraper...');
    console.log(`   Target: "${keyword}"`);
    console.log(`   Max Results: ${maxResults}`);

    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Determine if it's a URL or search keyword
    let targetUrl;
    if (keyword.startsWith('http')) {
      targetUrl = keyword;
    } else {
      targetUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(keyword)}`;
    }

    console.log('🌐 Navigating to:', targetUrl);

    await page.goto(targetUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Scroll to load more images
    console.log('📜 Scrolling to load more images...');
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Extract image data
    const outfits = await page.evaluate((maxResults) => {
      const results = [];

      // Try multiple selectors as Pinterest structure may vary
      const pinElements = document.querySelectorAll('[data-test-id="pin"]');

      for (let i = 0; i < Math.min(pinElements.length, maxResults); i++) {
        const pin = pinElements[i];

        try {
          // Extract image
          const img = pin.querySelector('img');
          const link = pin.querySelector('a[href*="/pin/"]');

          if (img && img.src && !img.src.includes('placeholder')) {
            const imageUrl = img.src;
            const title = img.alt || `Pinterest Outfit ${i + 1}`;
            const pinUrl = link ? `https://www.pinterest.com${link.getAttribute('href')}` : '';

            results.push({
              title: title.substring(0, 100), // Limit title length
              imageUrl,
              price: null,
              category: 'outfit',
              source: 'Pinterest',
              link: pinUrl
            });
          }
        } catch (error) {
          console.log('Error processing pin:', error.message);
        }
      }

      return results;
    }, maxResults);

    console.log(`✅ Scraped ${outfits.length} outfits from Pinterest`);

    // Save to cache
    await saveToCache('pinterest', outfits);

    return outfits;

  } catch (error) {
    console.error('❌ Pinterest scraper error:', error.message);

    // Try to load from cache as fallback
    console.log('🔄 Attempting to load from cache...');
    const cached = await loadFromCache('pinterest');

    if (cached.length > 0) {
      console.log('✅ Returning cached results');
      return cached;
    }

    // Use sample data as final fallback
    console.log('⚠️  Using sample data as fallback');
    await saveToCache('pinterest', samplePinterestData);
    return samplePinterestData.slice(0, maxResults);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Scrape trending outfits from Hollister using Axios + Cheerio
 * @param {number} maxResults - Maximum number of results (default: 20)
 * @returns {Promise<Array>} Array of outfit objects
 */
export async function fetchHollisterTrends(maxResults = 20) {
  try {
    console.log('🔍 Starting Hollister scraper...');
    console.log(`   Max Results: ${maxResults}`);

    const url = 'https://www.hollisterco.com/shop/us/mens-new-arrivals';
    console.log('🌐 Fetching:', url);

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

    // Hollister uses product tiles - try multiple selectors
    const selectors = [
      '.product-tile',
      '.product-card',
      '[data-product-tile]',
      '.product-item',
      'article.product'
    ];

    let productElements = null;
    for (const selector of selectors) {
      productElements = $(selector);
      if (productElements.length > 0) {
        console.log(`✅ Found ${productElements.length} products using selector: ${selector}`);
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
        const title = $el.find('.product-name, .product-title, h3, h2').first().text().trim()
          || $el.find('img').attr('alt')
          || `Hollister Item ${i + 1}`;

        // Extract image
        const img = $el.find('img').first();
        let imageUrl = img.attr('src') || img.attr('data-src') || img.attr('data-original');

        // Handle relative URLs
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = imageUrl.startsWith('//')
            ? `https:${imageUrl}`
            : `https://www.hollisterco.com${imageUrl}`;
        }

        // Extract price
        const priceText = $el.find('.price, .product-price, [class*="price"]').first().text().trim();
        const price = priceText || 'Check site';

        // Extract link
        const link = $el.find('a').first().attr('href');
        const productUrl = link
          ? (link.startsWith('http') ? link : `https://www.hollisterco.com${link}`)
          : url;

        // Auto-categorize based on title
        let category = 'outfit';
        const titleLower = title.toLowerCase();
        if (titleLower.includes('shirt') || titleLower.includes('tee') || titleLower.includes('hoodie') || titleLower.includes('jacket')) {
          category = 'top';
        } else if (titleLower.includes('jean') || titleLower.includes('pant') || titleLower.includes('short')) {
          category = 'bottom';
        } else if (titleLower.includes('shoe') || titleLower.includes('sneaker') || titleLower.includes('boot')) {
          category = 'shoes';
        }

        if (imageUrl && !imageUrl.includes('placeholder')) {
          outfits.push({
            title,
            imageUrl,
            price,
            category,
            source: 'Hollister',
            link: productUrl
          });
        }
      } catch (error) {
        console.log(`⚠️  Error processing Hollister item ${i}:`, error.message);
      }
    });

    console.log(`✅ Scraped ${outfits.length} outfits from Hollister`);

    // Save to cache
    await saveToCache('hollister', outfits);

    return outfits;

  } catch (error) {
    console.error('❌ Hollister scraper error:', error.message);

    // Try to load from cache as fallback
    console.log('🔄 Attempting to load from cache...');
    const cached = await loadFromCache('hollister');

    if (cached.length > 0) {
      console.log('✅ Returning cached results');
      return cached;
    }

    // Use sample data as final fallback
    console.log('⚠️  Using sample data as fallback');
    await saveToCache('hollister', sampleHollisterData);
    return sampleHollisterData.slice(0, maxResults);
  }
}

/**
 * Scrape trending outfits from H&M using Axios + Cheerio
 * @param {number} maxResults - Maximum number of results (default: 20)
 * @returns {Promise<Array>} Array of outfit objects
 */
export async function fetchHMTrends(maxResults = 20) {
  try {
    console.log('🔍 Starting H&M scraper...');
    console.log(`   Max Results: ${maxResults}`);

    const url = 'https://www2.hm.com/en_us/men/new-arrivals.html';
    console.log('🌐 Fetching:', url);

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

    // H&M uses product items - try multiple selectors
    const selectors = [
      '.product-item',
      'article.hm-product-item',
      '.hm-product',
      '[data-product]',
      'li.product-item'
    ];

    let productElements = null;
    for (const selector of selectors) {
      productElements = $(selector);
      if (productElements.length > 0) {
        console.log(`✅ Found ${productElements.length} products using selector: ${selector}`);
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
        const title = $el.find('.item-heading, .product-item-headline, h3, h2').first().text().trim()
          || $el.find('img').attr('alt')
          || `H&M Item ${i + 1}`;

        // Extract image
        const img = $el.find('img').first();
        let imageUrl = img.attr('src') || img.attr('data-src') || img.attr('data-original');

        // Handle relative URLs
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = imageUrl.startsWith('//')
            ? `https:${imageUrl}`
            : `https://www2.hm.com${imageUrl}`;
        }

        // Extract price
        const priceText = $el.find('.price, .item-price, [class*="price"]').first().text().trim();
        const price = priceText || 'Check site';

        // Extract link
        const link = $el.find('a').first().attr('href');
        const productUrl = link
          ? (link.startsWith('http') ? link : `https://www2.hm.com${link}`)
          : url;

        // Auto-categorize based on title
        let category = 'outfit';
        const titleLower = title.toLowerCase();
        if (titleLower.includes('shirt') || titleLower.includes('tee') || titleLower.includes('hoodie') || titleLower.includes('jacket') || titleLower.includes('sweater')) {
          category = 'top';
        } else if (titleLower.includes('jean') || titleLower.includes('pant') || titleLower.includes('short') || titleLower.includes('trouser')) {
          category = 'bottom';
        } else if (titleLower.includes('shoe') || titleLower.includes('sneaker') || titleLower.includes('boot') || titleLower.includes('loafer')) {
          category = 'shoes';
        }

        if (imageUrl && !imageUrl.includes('placeholder')) {
          outfits.push({
            title,
            imageUrl,
            price,
            category,
            source: 'H&M',
            link: productUrl
          });
        }
      } catch (error) {
        console.log(`⚠️  Error processing H&M item ${i}:`, error.message);
      }
    });

    console.log(`✅ Scraped ${outfits.length} outfits from H&M`);

    // Save to cache
    await saveToCache('hm', outfits);

    return outfits;

  } catch (error) {
    console.error('❌ H&M scraper error:', error.message);

    // Try to load from cache as fallback
    console.log('🔄 Attempting to load from cache...');
    const cached = await loadFromCache('hm');

    if (cached.length > 0) {
      console.log('✅ Returning cached results');
      return cached;
    }

    // Use sample data as final fallback
    console.log('⚠️  Using sample data as fallback');
    await saveToCache('hm', sampleHMData);
    return sampleHMData.slice(0, maxResults);
  }
}

/**
 * Fetch trending outfits from all sources
 * @param {Object} options - Options object
 * @param {number} options.maxResults - Max results per source
 * @returns {Promise<Object>} Object with results from all sources
 */
export async function fetchAllTrends(options = {}) {
  const { maxResults = 20 } = options;

  console.log('🚀 Fetching trends from all sources...');

  const results = {
    pinterest: [],
    hollister: [],
    hm: []
  };

  // Fetch from all sources concurrently
  const [pinterestResults, hollisterResults, hmResults] = await Promise.allSettled([
    fetchPinterestTrends(undefined, maxResults),
    fetchHollisterTrends(maxResults),
    fetchHMTrends(maxResults)
  ]);

  // Process results
  if (pinterestResults.status === 'fulfilled') {
    results.pinterest = pinterestResults.value;
  } else {
    console.error('Pinterest fetch failed:', pinterestResults.reason);
  }

  if (hollisterResults.status === 'fulfilled') {
    results.hollister = hollisterResults.value;
  } else {
    console.error('Hollister fetch failed:', hollisterResults.reason);
  }

  if (hmResults.status === 'fulfilled') {
    results.hm = hmResults.value;
  } else {
    console.error('H&M fetch failed:', hmResults.reason);
  }

  const totalItems = results.pinterest.length + results.hollister.length + results.hm.length;
  console.log(`✅ Total items fetched: ${totalItems}`);

  return results;
}

// Allow running this file directly for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Running scrapers in test mode...\n');

  try {
    const results = await fetchAllTrends({ maxResults: 10 });
    console.log('\n📊 RESULTS SUMMARY:');
    console.log('Pinterest:', results.pinterest.length, 'items');
    console.log('Hollister:', results.hollister.length, 'items');
    console.log('H&M:', results.hm.length, 'items');
    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}
