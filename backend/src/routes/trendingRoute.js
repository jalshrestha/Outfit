import { Router } from 'express';
import {
  fetchPinterestTrends,
  fetchHollisterTrends,
  fetchHMTrends,
  fetchAllTrends
} from '../services/trendingScraper.js';
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

    let results = [];

    // Validate and parse maxResults
    const limit = Math.min(Math.max(parseInt(maxResults) || 20, 1), 50);

    // Fetch based on source parameter
    switch (source.toLowerCase()) {
      case 'pinterest':
        // Don't pass keyword - let it use the default URL from the function
        results = await fetchPinterestTrends(undefined, limit);
        break;

      case 'hollister':
        results = await fetchHollisterTrends(limit);
        break;

      case 'hm':
      case 'h&m':
        results = await fetchHMTrends(limit);
        break;

      case 'all':
        const allResults = await fetchAllTrends({ maxResults: limit });
        // Combine all results into a single array
        results = [
          ...allResults.pinterest,
          ...allResults.hollister,
          ...allResults.hm
        ];
        break;

      default:
        return res.status(400).json({
          error: 'Invalid source parameter',
          validSources: ['pinterest', 'hollister', 'hm', 'all']
        });
    }

    // Filter by category if specified
    if (category) {
      const categoryLower = category.toLowerCase();
      results = results.filter(item =>
        item.category.toLowerCase() === categoryLower
      );
      console.log(`🔍 Filtered to ${results.length} items in category: ${category}`);
    }

    // Add metadata to response
    const response = {
      success: true,
      count: results.length,
      source: source,
      category: category || 'all',
      timestamp: new Date().toISOString(),
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

    switch (source.toLowerCase()) {
      case 'pinterest':
        const pinterestResults = await fetchPinterestTrends(undefined, limit);
        itemsRefreshed = pinterestResults.length;
        break;

      case 'hollister':
        const hollisterResults = await fetchHollisterTrends(limit);
        itemsRefreshed = hollisterResults.length;
        break;

      case 'hm':
      case 'h&m':
        const hmResults = await fetchHMTrends(limit);
        itemsRefreshed = hmResults.length;
        break;

      case 'all':
        const allResults = await fetchAllTrends({ maxResults: limit });
        itemsRefreshed = allResults.pinterest.length +
                        allResults.hollister.length +
                        allResults.hm.length;
        break;

      default:
        return res.status(400).json({
          error: 'Invalid source parameter',
          validSources: ['pinterest', 'hollister', 'hm', 'all']
        });
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

    console.log('📊 Cache stats requested');

    res.status(200).json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Stats error:', error.message);

    res.status(200).json({
      success: true,
      stats: {},
      message: 'No cache data available yet',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
