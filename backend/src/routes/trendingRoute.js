import { Router } from 'express';
import { scraperRegistry } from '../services/scraperRegistry.js';
import { getCategoryFromUrl } from '../services/geminiService.js';

const router = Router();

/**
 * GET /api/trending
 * Query parameters:
 * - source: 'pinterest' | 'hollister' | 'hm' | 'all' (default: 'all')
 * - category: 'top' | 'bottom' | 'shoes' | 'outfit' (optional filter)
 * - maxResults: number (default: 20)
 * - keyword: string (for Pinterest search, default: 'latest outfit trends 2025')
 *
 * Response format:
 * [
 *   {
 *     "title": "Fall Streetwear Look",
 *     "imageUrl": "https://...",
 *     "price": "$45" | null,
 *     "category": "top" | "bottom" | "shoes" | "outfit",
 *     "source": "Pinterest" | "Hollister" | "H&M",
 *     "link": "https://..."
 *   }
 * ]
 */
router.get('/', async (req, res) => {
  try {
    const {
      source = 'all',
      category,
      maxResults = 20
    } = req.query;

    console.log('🔍 Trending API called:');
    console.log('   Source:', source);
    console.log('   Category:', category || 'all');
    console.log('   Max Results:', maxResults);

    // Validate and parse maxResults
    const limit = Math.min(Math.max(parseInt(maxResults) || 20, 1), 50);

    // First, try to get cached data immediately (fast response)
    let results = [];
    let fromCache = true;

    try {
      if (source.toLowerCase() === 'all') {
        // Get cached from all sources
        const cachedResults = await scraperRegistry.getAllCached();
        results = [
          ...(cachedResults.pinterest || []),
          ...(cachedResults.hollister || []),
          ...(cachedResults.hm || [])
        ];
      } else {
        // Get cached from specific source
        results = await scraperRegistry.getCached(source.toLowerCase());
      }

      // If we have cached data, return it immediately while refreshing in background
      if (results.length > 0) {
        // Start background refresh (don't wait for it)
        const refreshSource = source.toLowerCase() === 'all' ? 'all' : source.toLowerCase();
        scraperRegistry.scrapeMultiple(refreshSource, { maxResults: limit }).catch(err => {
          console.error('Background refresh failed:', err.message);
        });

        // Filter cached results by category if needed
        if (category) {
          const categoryLower = category.toLowerCase();
          results = results.filter(item =>
            item && item.category && item.category.toLowerCase() === categoryLower
          );
        }

        // Limit results
        results = results.slice(0, limit);

        console.log(`✅ Returning ${results.length} cached outfits (refreshing in background)`);

        return res.status(200).json({
          success: true,
          count: results.length,
          source: source,
          category: category || 'all',
          timestamp: new Date().toISOString(),
          fromCache: true,
          data: results
        });
      }
    } catch (cacheError) {
      console.log('⚠️  Cache error, will try fresh scrape:', cacheError.message);
      fromCache = false;
    }

    // No cached data or cache failed, try fresh scrape with timeout
    console.log('🔄 No cache available, scraping fresh data...');
    fromCache = false;

    // Set a timeout to prevent hanging
    const scrapePromise = source.toLowerCase() === 'all'
      ? scraperRegistry.scrapeMultiple('all', { maxResults: limit }).then(allResults => {
          return [
            ...(allResults.pinterest || []),
            ...(allResults.hollister || []),
            ...(allResults.hm || [])
          ];
        })
      : scraperRegistry.scrape(source.toLowerCase(), { maxResults: limit });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Scraping timed out')), 15000)
    );

    try {
      results = await Promise.race([scrapePromise, timeoutPromise]);
    } catch (error) {
      console.error('❌ Scraping failed or timed out:', error.message);
      
      // Try one more time with cached data as fallback
      if (source.toLowerCase() === 'all') {
        const cachedResults = await scraperRegistry.getAllCached();
        results = [
          ...(cachedResults.pinterest || []),
          ...(cachedResults.hollister || []),
          ...(cachedResults.hm || [])
        ];
      } else {
        results = await scraperRegistry.getCached(source.toLowerCase());
      }

      if (results.length === 0) {
        throw new Error('No data available from cache or scraping');
      }
    }

    // Ensure results is an array
    if (!Array.isArray(results)) {
      console.warn('⚠️  Results is not an array, defaulting to empty array');
      results = [];
    }

    // Filter by category if specified
    if (category) {
      const categoryLower = category.toLowerCase();
      results = results.filter(item =>
        item && item.category && item.category.toLowerCase() === categoryLower
      );
      console.log(`🔍 Filtered to ${results.length} items in category: ${category}`);
    }

    // Limit results
    results = results.slice(0, limit);

    // Add metadata to response
    const response = {
      success: true,
      count: results.length,
      source: source,
      category: category || 'all',
      timestamp: new Date().toISOString(),
      fromCache: fromCache,
      data: results
    };

    console.log(`✅ Returning ${results.length} trending outfits`);

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Trending API error:', error.message);
    console.error('Full error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending outfits',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/trending/refresh
 * Manually trigger a refresh of the trending data cache
 * Body parameters:
 * - source: 'pinterest' | 'hollister' | 'hm' | 'all' (default: 'all')
 * - maxResults: number (default: 20)
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Cache refreshed successfully",
 *   "itemsRefreshed": 60
 * }
 */
router.post('/refresh', async (req, res) => {
  try {
    const { source = 'all', maxResults = 20 } = req.body;

    console.log('🔄 Manual cache refresh requested:');
    console.log('   Source:', source);
    console.log('   Max Results:', maxResults);

    const limit = Math.min(Math.max(parseInt(maxResults) || 20, 1), 50);
    let itemsRefreshed = 0;

    try {
      if (source.toLowerCase() === 'all') {
        const allResults = await scraperRegistry.scrapeMultiple('all', { maxResults: limit });
        itemsRefreshed = (allResults.pinterest?.length || 0) +
                        (allResults.hollister?.length || 0) +
                        (allResults.hm?.length || 0);
      } else {
        if (!scraperRegistry.has(source.toLowerCase())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid source parameter',
            validSources: scraperRegistry.getNames()
          });
        }

        const results = await scraperRegistry.scrape(source.toLowerCase(), { maxResults: limit });
        itemsRefreshed = results.length;
      }

      console.log(`✅ Cache refreshed: ${itemsRefreshed} items`);

      res.status(200).json({
        success: true,
        message: 'Cache refreshed successfully',
        source,
        itemsRefreshed,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Cache refresh error:', error.message);

      res.status(500).json({
        success: false,
        error: 'Failed to refresh cache',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Cache refresh error:', error.message);

    res.status(500).json({
      success: false,
      error: 'Failed to refresh cache',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/trending/classify-image
 * Classify an image URL using Gemini AI
 * Body parameters:
 * - imageUrl: string (required) - The URL of the image to classify
 *
 * Response:
 * {
 *   "success": true,
 *   "category": "top" | "bottom" | "shoes",
 *   "imageUrl": "https://..."
 * }
 */
router.post('/classify-image', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'imageUrl is required in request body'
      });
    }

    console.log('🤖 Classifying image with Gemini AI:', imageUrl);

    const category = await getCategoryFromUrl(imageUrl);

    console.log(`✅ Image classified as: ${category}`);

    res.status(200).json({
      success: true,
      category,
      imageUrl,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Image classification error:', error.message);

    res.status(500).json({
      success: false,
      error: 'Failed to classify image',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/trending/stats
 * Get statistics about cached trending data
 *
 * Response:
 * {
 *   "pinterest": { "count": 20, "lastUpdated": "2025-10-27T..." },
 *   "hollister": { "count": 20, "lastUpdated": "2025-10-27T..." },
 *   "hm": { "count": 20, "lastUpdated": "2025-10-27T..." }
 * }
 */
router.get('/stats', async (req, res) => {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const CACHE_FILE = path.join(__dirname, '../../data/trending.json');

    const cacheContent = await fs.readFile(CACHE_FILE, 'utf-8');
    const cache = JSON.parse(cacheContent);

    const stats = {};
    for (const [source, data] of Object.entries(cache)) {
      stats[source] = {
        count: data.data ? data.data.length : 0,
        lastUpdated: data.lastUpdated || 'unknown'
      };
    }

    // Also include registry info
    const availableSources = scraperRegistry.getNames();

    console.log('📊 Cache stats requested');

    res.status(200).json({
      success: true,
      stats,
      availableSources,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Stats error:', error.message);

    res.status(200).json({
      success: true,
      stats: {},
      availableSources: scraperRegistry.getNames(),
      message: 'No cache data available yet',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
