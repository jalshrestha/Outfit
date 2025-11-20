import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadImages } from '../utils/imageDownloader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.join(__dirname, '../../data/trending.json');

/**
 * Save scraped results to cache file
 * @param {string} source - Source name (pinterest, hollister, hm)
 * @param {Array} data - Array of outfit objects
 * @param {boolean} downloadLocalImages - Whether to download images locally (default: true)
 */
export async function saveToCache(source, data, downloadLocalImages = true) {
  try {
    let cache = {};

    try {
      const cacheContent = await fs.readFile(CACHE_FILE, 'utf-8');
      cache = JSON.parse(cacheContent);
    } catch (error) {
      console.log('📝 Creating new cache file');
    }

    // Download images locally if enabled
    let finalData = data;
    if (downloadLocalImages && data.length > 0) {
      console.log(`   └─ 📥 Downloading images locally...`);
      finalData = await downloadImages(data, source);
    }

    cache[source] = {
      data: finalData,
      lastUpdated: new Date().toISOString()
    };

    await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
    console.log(`   └─ ✅ Saved ${finalData.length} items to cache for ${source}`);
  } catch (error) {
    console.error('❌ Error saving to cache:', error.message);
  }
}

/**
 * Load cached results from file
 * @param {string} source - Source name (pinterest, hollister, hm)
 * @returns {Array} Array of outfit objects or empty array
 */
export async function loadFromCache(source) {
  try {
    const cacheContent = await fs.readFile(CACHE_FILE, 'utf-8');
    const cache = JSON.parse(cacheContent);

    if (cache[source] && cache[source].data) {
      console.log(`📦 Loaded ${cache[source].data.length} items from cache for ${source}`);
      return cache[source].data;
    }

    return [];
  } catch (error) {
    console.log('📭 No cache available for', source);
    return [];
  }
}

