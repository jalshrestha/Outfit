import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadImages } from '../src/utils/imageDownloader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.join(__dirname, '../data/trending.json');

/**
 * Download all existing cached images locally
 */
async function downloadExistingImages() {
  try {
    console.log('📚 Loading existing cache...');
    const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
    const cache = JSON.parse(cacheContent);

    const updatedCache = {};

    for (const [source, sourceData] of Object.entries(cache)) {
      console.log(`\n🔍 Processing ${source}...`);
      const items = sourceData.data || [];

      if (items.length === 0) {
        console.log(`   No items found for ${source}`);
        updatedCache[source] = sourceData;
        continue;
      }

      // Download images
      const updatedItems = await downloadImages(items, source);

      updatedCache[source] = {
        data: updatedItems,
        lastUpdated: new Date().toISOString()
      };
    }

    // Save updated cache
    fs.writeFileSync(CACHE_FILE, JSON.stringify(updatedCache, null, 2));
    console.log('\n✅ All images downloaded and cache updated!');
    console.log('📂 Images saved to: frontend/public/uploads/trending/');
    console.log('🚀 You can now commit these images to GitHub!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
downloadExistingImages();
