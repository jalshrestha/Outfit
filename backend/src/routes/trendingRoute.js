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

    console.log('\n📥 [GET /api/trending] Request received');
    console.log('   Source:', source);
    console.log('   Category:', category || 'all');
    console.log('   Max Results:', maxResults);

    // Validate and parse maxResults
    const limit = Math.min(Math.max(parseInt(maxResults) || 20, 1), 50);

    // PRIORITY: Always return cached data first (fast response)
    console.log('📦 Loading cached data...');
    let results = [];
    let fromCache = true;

    try {
      if (source.toLowerCase() === 'all') {
        const cachedResults = await scraperRegistry.getAllCached();
        results = [
          ...(cachedResults.pinterest || []),
          ...(cachedResults.hollister || []),
          ...(cachedResults.hm || [])
        ];
        console.log(`   📊 Cache stats: Pinterest(${cachedResults.pinterest?.length || 0}), Hollister(${cachedResults.hollister?.length || 0}), H&M(${cachedResults.hm?.length || 0})`);
      } else {
        results = await scraperRegistry.getCached(source.toLowerCase());
        console.log(`   📊 Cached items for ${source}: ${results.length}`);
      }

      // Filter cached results by category if needed
      if (category && results.length > 0) {
        const categoryLower = category.toLowerCase();
        const beforeFilter = results.length;
        results = results.filter(item =>
          item && item.category && item.category.toLowerCase() === categoryLower
        );
        console.log(`   🔍 Category filter "${category}": ${beforeFilter} → ${results.length} items`);
      }

      // Limit results
      results = results.slice(0, limit);

      console.log(`✅ [GET] Returning ${results.length} cached outfits (fromCache: true)`);
      console.log('─────────────────────────────────────────────\n');

      return res.status(200).json({
        success: true,
        count: results.length,
        source: source,
        category: category || 'all',
        timestamp: new Date().toISOString(),
        fromCache: true,
        data: results
      });

    } catch (cacheError) {
      console.log('⚠️  Cache unavailable:', cacheError.message);
      console.log('   Will return empty results (use /refresh to scrape)\n');
      
      return res.status(200).json({
        success: true,
        count: 0,
        source: source,
        category: category || 'all',
        timestamp: new Date().toISOString(),
        fromCache: false,
        data: [],
        message: 'No cached data available. Click refresh to scrape new data.'
      });
    }

  } catch (error) {
    console.error('❌ [GET /api/trending] Error:', error.message);
    console.error('─────────────────────────────────────────────\n');

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

    console.log('\n🔄 [POST /api/trending/refresh] Manual refresh requested');
    console.log('   Source:', source);
    console.log('   Max Results:', maxResults);
    console.log('   Starting fresh scrape (this may take 30-90 seconds)...\n');

    const limit = Math.min(Math.max(parseInt(maxResults) || 20, 1), 50);
    let itemsRefreshed = 0;
    const startTime = Date.now();

    try {
      if (source.toLowerCase() === 'all') {
        console.log('📡 Scraping from all sources...');
        console.log('   └─ Pinterest...');
        const pinterestStart = Date.now();
        const pinterestResults = await scraperRegistry.scrape('pinterest', { maxResults: limit });
        console.log(`   └─ ✅ Pinterest: ${pinterestResults.length} items (${((Date.now() - pinterestStart) / 1000).toFixed(1)}s)`);

        console.log('   └─ Hollister...');
        const hollisterStart = Date.now();
        const hollisterResults = await scraperRegistry.scrape('hollister', { maxResults: limit });
        console.log(`   └─ ✅ Hollister: ${hollisterResults.length} items (${((Date.now() - hollisterStart) / 1000).toFixed(1)}s)`);

        console.log('   └─ H&M...');
        const hmStart = Date.now();
        const hmResults = await scraperRegistry.scrape('hm', { maxResults: limit });
        console.log(`   └─ ✅ H&M: ${hmResults.length} items (${((Date.now() - hmStart) / 1000).toFixed(1)}s)`);

        itemsRefreshed = (pinterestResults?.length || 0) +
                        (hollisterResults?.length || 0) +
                        (hmResults?.length || 0);
      } else {
        const sourceName = source.toLowerCase();
        if (!scraperRegistry.has(sourceName)) {
          console.error(`❌ Invalid source: ${sourceName}`);
          return res.status(400).json({
            success: false,
            error: 'Invalid source parameter',
            validSources: scraperRegistry.getNames()
          });
        }

        console.log(`📡 Scraping from ${sourceName}...`);
        const scrapeStart = Date.now();
        const results = await scraperRegistry.scrape(sourceName, { maxResults: limit });
        const scrapeTime = ((Date.now() - scrapeStart) / 1000).toFixed(1);
        console.log(`✅ ${sourceName}: ${results.length} items scraped (${scrapeTime}s)`);
        itemsRefreshed = results.length;
      }

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n✅ [POST /refresh] Cache refreshed successfully!`);
      console.log(`   Total items: ${itemsRefreshed}`);
      console.log(`   Total time: ${totalTime}s`);
      console.log('─────────────────────────────────────────────\n');

      res.status(200).json({
        success: true,
        message: 'Cache refreshed successfully',
        source,
        itemsRefreshed,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`\n❌ [POST /refresh] Scraping failed after ${totalTime}s`);
      console.error('   Error:', error.message);
      console.error('─────────────────────────────────────────────\n');

      res.status(500).json({
        success: false,
        error: 'Failed to refresh cache',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('\n❌ [POST /refresh] Unexpected error:', error.message);
    console.error('─────────────────────────────────────────────\n');

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

    // Map backend category format to frontend format
    const categoryMap = {
      'upper_body': 'top',
      'lower_body': 'bottom',
      'full_outfit': 'full-outfit',
      'full-outfit': 'full-outfit', // Also handle already mapped
      'shoes': 'shoes',
      'top': 'top', // Handle if already in frontend format
      'bottom': 'bottom'
    };

    const frontendCategory = categoryMap[category] || category;

    console.log(`✅ Image classified as: ${category} -> ${frontendCategory}`);

    res.status(200).json({
      success: true,
      category: frontendCategory,
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
 * POST /api/trending/download-image
 * Download and proxy an image from external URL (bypasses CORS)
 * Body parameters:
 * - imageUrl: string (required) - The URL of the image to download
 *
 * Response:
 * {
 *   "success": true,
 *   "dataUrl": "data:image/jpeg;base64,...",
 *   "imageUrl": "https://..."
 * }
 */
router.post('/download-image', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'imageUrl is required in request body'
      });
    }

    console.log('📥 Downloading image:', imageUrl);

    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const uploadsDir = path.join(__dirname, '../../../frontend/public/uploads');

    // Check if this is a local file path (already scraped/cached)
    const isLocalPath = imageUrl.startsWith('/uploads/');

    if (isLocalPath) {
      // Image is already stored locally - just copy it
      console.log('📁 Image is local, copying file...');

      const sourcePath = path.join(__dirname, '../../../frontend/public', imageUrl);

      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Local file not found: ${sourcePath}`);
      }

      // Determine extension from source file
      const ext = path.extname(sourcePath) || '.jpg';
      const filename = `trending-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
      const filepath = path.join(uploadsDir, filename);

      // Copy the file
      fs.copyFileSync(sourcePath, filepath);

      const url = `/uploads/${filename}`;
      console.log('✅ Local image copied:', url);

      return res.status(200).json({
        success: true,
        url,
        imageUrl,
        contentType: `image/${ext.replace('.', '')}`,
        timestamp: new Date().toISOString()
      });
    }

    // External URL - download it
    const axios = (await import('axios')).default;

    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 30000
    });

    // Determine content type and extension
    const contentType = response.headers['content-type'] || 'image/jpeg';
    const ext = contentType.includes('png') ? '.png' : contentType.includes('webp') ? '.webp' : '.jpeg';

    const filename = `trending-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    // Write file
    fs.writeFileSync(filepath, Buffer.from(response.data));

    const url = `/uploads/${filename}`;
    console.log('✅ External image downloaded and saved:', url);

    res.status(200).json({
      success: true,
      url,
      imageUrl,
      contentType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Image download error:', error.message);

    res.status(500).json({
      success: false,
      error: 'Failed to download image',
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
