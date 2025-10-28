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
 * Add timeout wrapper to prevent hanging
 */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), ms))
  ]);
}

/**
 * Scrape trending outfits from Pinterest using Puppeteer (internal function)
 * @param {string} keyword - URL or search keyword (default: men's streetwear collection)
 * @param {number} maxResults - Maximum number of results (default: 10)
 * @returns {Promise<Array>} Array of outfit objects
 */
async function _fetchPinterestTrendsInternal(keyword = 'https://www.pinterest.com/ideas/mens-streetwear/895613796302/', maxResults = 10) {
  let browser;

  try {
    console.log('🔍 Starting Pinterest scraper...');
    console.log(`   Target: "${keyword}"`);
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
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Wait for pins to load - Pinterest uses lazy loading
    console.log('⏳ Waiting for content to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Try to wait for pin elements to appear
    try {
      await page.waitForSelector('[data-test-id="pin"]', { timeout: 10000 });
    } catch (e) {
      console.log('⚠️  Could not find standard pin selector, trying alternatives...');
    }

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

      // Try multiple selectors to find pins
      let pinElements = [];
      
      // Try different selectors in order of preference
      const selectors = [
        '[data-test-id="pin"]',
        'article[data-test-id="pin"]',
        '[data-test-id="pin-rep"]',
        'div[data-test-id="pin-rep"]',
        'div[role="listitem"]',
        '.pinContainer',
        '.Grid__Item'
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`Found ${elements.length} pins using selector: ${selector}`);
          pinElements = Array.from(elements);
          break;
        }
      }

      console.log(`Total pin elements found: ${pinElements.length}`);

      // Process pins and extract data
      for (let i = 0; i < Math.min(pinElements.length, maxResults); i++) {
        const pin = pinElements[i];

        try {
          // Find all images in the pin
          const images = pin.querySelectorAll('img');
          let img = null;
          let imageUrl = null;

          // Strategy: Look for the highest quality image
          // 1. Check data sources (Pinterest often uses data-src for lazy loading)
          for (const candidateImg of images) {
            if (candidateImg.hasAttribute('data-src')) {
              const dataSrc = candidateImg.getAttribute('data-src');
              if (dataSrc && !dataSrc.includes('placeholder') && !dataSrc.includes('1x') && !dataSrc.includes('75x')) {
                imageUrl = dataSrc;
                img = candidateImg;
                break;
              }
            }
          }

          // 2. Get the best quality image from src (usually the largest one)
          if (!imageUrl) {
            for (const candidateImg of images) {
              const src = candidateImg.src;
              if (src && !src.includes('placeholder')) {
                // Skip very small images (likely icons or placeholders)
                if (!src.includes('1x') && !src.includes('75x') && !src.includes('236x')) {
                  imageUrl = src;
                  img = candidateImg;
                  break;
                }
              }
            }
          }

          // 3. Fallback: take any non-placeholder image
          if (!imageUrl && images.length > 0) {
            for (const candidateImg of images) {
              const src = candidateImg.src || candidateImg.getAttribute('data-src');
              if (src && !src.includes('placeholder')) {
                imageUrl = src;
                img = candidateImg;
                break;
              }
            }
          }

          // Find the link
          const link = pin.querySelector('a[href*="/pin/"]');

          if (imageUrl) {
            // Clean up the image URL - Pinterest sometimes uses encoded URLs
            if (imageUrl.includes('https://i.pinimg.com')) {
              // Try to get the full resolution image by replacing size parameters
              // Pinterest URLs look like: /236x/abc123/ or /474x/abc123/
              // We want: /originals/abc123/
              imageUrl = imageUrl.replace(/\/\d+x\d*\//g, '/originals/');
            }

            const title = (img && img.alt) || `Pinterest Outfit ${i + 1}`;
            const pinUrl = link ? `https://www.pinterest.com${link.getAttribute('href')}` : '';

            results.push({
              title: title.substring(0, 100), // Limit title length
              imageUrl,
              price: null,
              category: 'outfit',
              source: 'Pinterest',
              link: pinUrl
            });

            console.log(`Processed pin ${i + 1}: ${title}`);
          }
        } catch (error) {
          console.log(`Error processing pin ${i}:`, error.message);
        }
      }

      console.log(`Total results collected: ${results.length}`);
      return results;
    }, maxResults);

    console.log(`✅ Scraped ${outfits.length} outfits from Pinterest`);

    // Save to cache
    await saveToCache('pinterest', outfits);

    return outfits;

  } catch (error) {
    console.error('❌ Pinterest scraper error:', error.message);
    console.error('Error details:', error);

    // Ensure browser is closed even if there's an error
    try {
      if (browser) {
        const pages = await browser.pages();
        await Promise.all(pages.map(page => page.close()));
        await browser.close();
      }
    } catch (closeError) {
      console.error('Error closing browser:', closeError.message);
    }

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
    // Make sure browser is always closed
    if (browser) {
      try {
        const pages = await browser.pages();
        await Promise.all(pages.map(page => page.close()));
        await browser.close();
        console.log('🔒 Browser closed');
      } catch (closeError) {
        console.error('Error in finally block:', closeError.message);
      }
    }
  }
}

/**
 * Public wrapper with timeout protection and default parameters
 */
export async function fetchPinterestTrends(keyword = 'https://www.pinterest.com/ideas/mens-streetwear/895613796302/', maxResults = 10) {
  try {
    // Set a 90-second timeout for the entire scraping operation
    return await withTimeout(_fetchPinterestTrendsInternal(keyword, maxResults), 90000);
  } catch (error) {
    if (error.message === 'Operation timed out') {
      console.error('❌ Pinterest scraper timed out after 90 seconds');
    }
    throw error;
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
