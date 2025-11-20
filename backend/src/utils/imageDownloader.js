import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory to save trending outfit images
const IMAGES_DIR = path.join(__dirname, '../../../frontend/public/uploads/trending');

// Ensure directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  console.log('✅ Created trending images directory:', IMAGES_DIR);
}

/**
 * Download an image from a URL and save it locally
 * @param {string} imageUrl - The URL of the image to download
 * @param {string} source - The source name (pinterest, hollister, hm)
 * @returns {Promise<string>} Local path to the saved image
 */
export async function downloadImage(imageUrl, source = 'unknown') {
  try {
    // Generate a unique filename based on URL hash
    const hash = crypto.createHash('md5').update(imageUrl).digest('hex');
    const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
    const filename = `${source}_${hash}${ext}`;
    const filepath = path.join(IMAGES_DIR, filename);

    // Check if file already exists
    if (fs.existsSync(filepath)) {
      return `/uploads/trending/${filename}`;
    }

    // Download the image
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    // Save to file
    fs.writeFileSync(filepath, response.data);

    return `/uploads/trending/${filename}`;
  } catch (error) {
    console.error(`⚠️  Failed to download image: ${imageUrl.substring(0, 60)}...`, error.message);
    // Return original URL if download fails
    return imageUrl;
  }
}

/**
 * Download multiple images in parallel with rate limiting
 * @param {Array} items - Array of outfit items with imageUrl property
 * @param {string} source - The source name
 * @returns {Promise<Array>} Array with updated local image paths
 */
export async function downloadImages(items, source) {
  console.log(`📥 Downloading ${items.length} images for ${source}...`);

  const results = [];

  // Process in batches of 5 to avoid overwhelming the server
  const batchSize = 5;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (item) => {
        const localPath = await downloadImage(item.imageUrl, source);
        return {
          ...item,
          imageUrl: localPath,
          originalImageUrl: item.imageUrl // Keep original URL as backup
        };
      })
    );

    results.push(...batchResults);

    // Small delay between batches
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  const successCount = results.filter(r => r.imageUrl.startsWith('/uploads')).length;
  console.log(`✅ Downloaded ${successCount}/${items.length} images successfully`);

  return results;
}

/**
 * Clean up old cached images that are no longer in use
 * @param {Array} activeImagePaths - Array of image paths currently in use
 */
export function cleanupOldImages(activeImagePaths) {
  try {
    const files = fs.readdirSync(IMAGES_DIR);
    const activeFiles = new Set(activeImagePaths.map(p => path.basename(p)));

    let deletedCount = 0;
    files.forEach(file => {
      if (!activeFiles.has(file)) {
        const filepath = path.join(IMAGES_DIR, file);
        fs.unlinkSync(filepath);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      console.log(`🗑️  Cleaned up ${deletedCount} old images`);
    }
  } catch (error) {
    console.error('⚠️  Error cleaning up images:', error.message);
  }
}
