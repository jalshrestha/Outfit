import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_PATH = path.join(__dirname, '../../frontend/public/uploads');

/**
 * Image optimization settings
 */
const OPTIMIZATION_CONFIG = {
    // Main image settings
    main: {
        maxWidth: 1200,
        maxHeight: 1600,
        quality: 85,
    },
    // Thumbnail settings
    thumbnail: {
        width: 300,
        height: 400,
        quality: 75,
    }
};

/**
 * Optimize an uploaded image
 * - Converts to WebP for smaller file size
 * - Resizes if larger than max dimensions
 * - Creates a thumbnail version
 */
export async function optimizeImage(inputPath, filename) {
    const ext = path.extname(filename);
    const baseName = path.basename(filename, ext);

    try {
        // Get image metadata
        const metadata = await sharp(inputPath).metadata();

        // Determine if we need to resize
        const needsResize =
            (metadata.width && metadata.width > OPTIMIZATION_CONFIG.main.maxWidth) ||
            (metadata.height && metadata.height > OPTIMIZATION_CONFIG.main.maxHeight);

        // Process main image
        let mainPipeline = sharp(inputPath)
            .rotate(); // Auto-rotate based on EXIF

        if (needsResize) {
            mainPipeline = mainPipeline.resize({
                width: OPTIMIZATION_CONFIG.main.maxWidth,
                height: OPTIMIZATION_CONFIG.main.maxHeight,
                fit: 'inside',
                withoutEnlargement: true,
            });
        }

        // Convert to WebP for better compression
        const webpFilename = `${baseName}.webp`;
        const webpPath = path.join(UPLOADS_PATH, webpFilename);

        await mainPipeline
            .webp({ quality: OPTIMIZATION_CONFIG.main.quality })
            .toFile(webpPath);

        // Create thumbnail
        const thumbFilename = `${baseName}-thumb.webp`;
        const thumbPath = path.join(UPLOADS_PATH, thumbFilename);

        await sharp(inputPath)
            .rotate()
            .resize({
                width: OPTIMIZATION_CONFIG.thumbnail.width,
                height: OPTIMIZATION_CONFIG.thumbnail.height,
                fit: 'cover',
                position: 'center',
            })
            .webp({ quality: OPTIMIZATION_CONFIG.thumbnail.quality })
            .toFile(thumbPath);

        // Get file sizes for logging
        const originalStats = await fs.stat(inputPath);
        const webpStats = await fs.stat(webpPath);
        const compression = ((1 - webpStats.size / originalStats.size) * 100).toFixed(1);

        console.log(`🖼️  Image optimized: ${filename}`);
        console.log(`   Original: ${(originalStats.size / 1024).toFixed(1)}KB`);
        console.log(`   WebP: ${(webpStats.size / 1024).toFixed(1)}KB (${compression}% smaller)`);

        // Optionally remove original if it's different from WebP
        if (ext.toLowerCase() !== '.webp') {
            await fs.unlink(inputPath).catch(() => { });
        }

        return {
            main: `/uploads/${webpFilename}`,
            thumbnail: `/uploads/${thumbFilename}`,
            originalSize: originalStats.size,
            optimizedSize: webpStats.size,
            compressionRatio: parseFloat(compression),
        };
    } catch (error) {
        console.error('Image optimization error:', error);
        // Return original path if optimization fails
        return {
            main: `/uploads/${filename}`,
            thumbnail: `/uploads/${filename}`,
            error: error.message,
        };
    }
}

/**
 * Process an image from URL (for trending downloads)
 */
export async function optimizeImageFromBuffer(buffer, filename) {
    const baseName = path.basename(filename, path.extname(filename));

    try {
        // Process main image
        const webpFilename = `${baseName}.webp`;
        const webpPath = path.join(UPLOADS_PATH, webpFilename);

        await sharp(buffer)
            .resize({
                width: OPTIMIZATION_CONFIG.main.maxWidth,
                height: OPTIMIZATION_CONFIG.main.maxHeight,
                fit: 'inside',
                withoutEnlargement: true,
            })
            .webp({ quality: OPTIMIZATION_CONFIG.main.quality })
            .toFile(webpPath);

        // Create thumbnail
        const thumbFilename = `${baseName}-thumb.webp`;
        const thumbPath = path.join(UPLOADS_PATH, thumbFilename);

        await sharp(buffer)
            .resize({
                width: OPTIMIZATION_CONFIG.thumbnail.width,
                height: OPTIMIZATION_CONFIG.thumbnail.height,
                fit: 'cover',
                position: 'center',
            })
            .webp({ quality: OPTIMIZATION_CONFIG.thumbnail.quality })
            .toFile(thumbPath);

        console.log(`🖼️  Image optimized from buffer: ${webpFilename}`);

        return {
            main: `/uploads/${webpFilename}`,
            thumbnail: `/uploads/${thumbFilename}`,
        };
    } catch (error) {
        console.error('Buffer optimization error:', error);
        throw error;
    }
}
