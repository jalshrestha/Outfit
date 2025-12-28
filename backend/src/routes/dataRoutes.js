import { Router } from 'express';
import { query } from '../db/index.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// ============= CLOTHING ITEMS =============

// GET all clothing items
router.get('/clothing', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM clothing_items WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching clothing items:', error);
        res.status(500).json({ error: 'Failed to fetch clothing items' });
    }
});

// POST new clothing item
router.post('/clothing', authMiddleware, async (req, res) => {
    try {
        const { id, name, imageUrl, category, color, brand } = req.body;

        if (!id || !name || !imageUrl || !category) {
            return res.status(400).json({ error: 'id, name, imageUrl, and category are required' });
        }

        const result = await query(
            `INSERT INTO clothing_items (id, name, image_url, category, color, brand, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         image_url = EXCLUDED.image_url,
         category = EXCLUDED.category,
         color = EXCLUDED.color,
         brand = EXCLUDED.brand
       RETURNING *`,
            [id, name, imageUrl, category, color || null, brand || null, req.user.id]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding clothing item:', error);
        res.status(500).json({ error: 'Failed to add clothing item' });
    }
});

// DELETE clothing item
router.delete('/clothing/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'DELETE FROM clothing_items WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Clothing item not found' });
        }

        res.json({ message: 'Clothing item deleted', item: result.rows[0] });
    } catch (error) {
        console.error('Error deleting clothing item:', error);
        res.status(500).json({ error: 'Failed to delete clothing item' });
    }
});

// ============= MODEL IMAGES =============

// GET all model images
router.get('/models', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM model_images WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching model images:', error);
        res.status(500).json({ error: 'Failed to fetch model images' });
    }
});

// POST new model image
router.post('/models', authMiddleware, async (req, res) => {
    try {
        const { imageUrl } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ error: 'imageUrl is required' });
        }

        const result = await query(
            'INSERT INTO model_images (image_url, user_id) VALUES ($1, $2) RETURNING *',
            [imageUrl, req.user.id]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding model image:', error);
        res.status(500).json({ error: 'Failed to add model image' });
    }
});

// DELETE model image
router.delete('/models/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'DELETE FROM model_images WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Model image not found' });
        }

        res.json({ message: 'Model image deleted', item: result.rows[0] });
    } catch (error) {
        console.error('Error deleting model image:', error);
        res.status(500).json({ error: 'Failed to delete model image' });
    }
});

// ============= SAVED OUTFITS =============

// GET all saved outfits (with clothing item details)
router.get('/outfits', authMiddleware, async (req, res) => {
    try {
        const result = await query(`
      SELECT 
        o.*,
        t.id as top_id, t.name as top_name, t.image_url as top_image_url, t.category as top_category,
        b.id as bottom_id, b.name as bottom_name, b.image_url as bottom_image_url, b.category as bottom_category,
        s.id as shoes_id, s.name as shoes_name, s.image_url as shoes_image_url, s.category as shoes_category,
        f.id as full_outfit_id, f.name as full_outfit_name, f.image_url as full_outfit_image_url, f.category as full_outfit_category
      FROM saved_outfits o
      LEFT JOIN clothing_items t ON o.top_item_id = t.id
      LEFT JOIN clothing_items b ON o.bottom_item_id = b.id
      LEFT JOIN clothing_items s ON o.shoes_item_id = s.id
      LEFT JOIN clothing_items f ON o.full_outfit_item_id = f.id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `, [req.user.id]);

        // Transform to match frontend format
        const outfits = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            timestamp: new Date(row.created_at).getTime(),
            generatedImageUrl: row.generated_image_url,
            modelImageUrl: row.model_image_url,
            clothingItems: {
                top: row.top_id ? { id: row.top_id, name: row.top_name, imageUrl: row.top_image_url, category: row.top_category } : undefined,
                bottom: row.bottom_id ? { id: row.bottom_id, name: row.bottom_name, imageUrl: row.bottom_image_url, category: row.bottom_category } : undefined,
                shoes: row.shoes_id ? { id: row.shoes_id, name: row.shoes_name, imageUrl: row.shoes_image_url, category: row.shoes_category } : undefined,
                fullOutfit: row.full_outfit_id ? { id: row.full_outfit_id, name: row.full_outfit_name, imageUrl: row.full_outfit_image_url, category: row.full_outfit_category } : undefined,
            },
            metadata: {
                aiRating: parseFloat(row.ai_rating) || 0,
                style: row.style || '',
                occasion: row.occasion || '',
                tags: row.tags || [],
            },
            isFavorite: row.is_favorite,
        }));

        res.json(outfits);
    } catch (error) {
        console.error('Error fetching saved outfits:', error);
        res.status(500).json({ error: 'Failed to fetch saved outfits' });
    }
});

// POST new saved outfit
router.post('/outfits', authMiddleware, async (req, res) => {
    try {
        const { id, name, generatedImageUrl, modelImageUrl, clothingItems, metadata, isFavorite } = req.body;

        if (!id || !name || !generatedImageUrl || !modelImageUrl) {
            return res.status(400).json({ error: 'id, name, generatedImageUrl, and modelImageUrl are required' });
        }

        const result = await query(
            `INSERT INTO saved_outfits 
        (id, name, generated_image_url, model_image_url, top_item_id, bottom_item_id, shoes_item_id, full_outfit_item_id, ai_rating, style, occasion, tags, is_favorite, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
            [
                id,
                name,
                generatedImageUrl,
                modelImageUrl,
                clothingItems?.top?.id || null,
                clothingItems?.bottom?.id || null,
                clothingItems?.shoes?.id || null,
                clothingItems?.fullOutfit?.id || null,
                metadata?.aiRating || null,
                metadata?.style || null,
                metadata?.occasion || null,
                metadata?.tags || [],
                isFavorite || false,
                req.user.id
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error saving outfit:', error);
        res.status(500).json({ error: 'Failed to save outfit' });
    }
});

// DELETE saved outfit
router.delete('/outfits/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'DELETE FROM saved_outfits WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Outfit not found' });
        }

        res.json({ message: 'Outfit deleted', item: result.rows[0] });
    } catch (error) {
        console.error('Error deleting outfit:', error);
        res.status(500).json({ error: 'Failed to delete outfit' });
    }
});

// PATCH update outfit (favorite, name)
router.patch('/outfits/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, isFavorite } = req.body;

        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            values.push(name);
        }
        if (isFavorite !== undefined) {
            updates.push(`is_favorite = $${paramIndex++}`);
            values.push(isFavorite);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No updates provided' });
        }

        values.push(id);
        values.push(req.user.id);
        const result = await query(
            `UPDATE saved_outfits SET ${updates.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`,
            values
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Outfit not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating outfit:', error);
        res.status(500).json({ error: 'Failed to update outfit' });
    }
});

// ============= USER PREFERENCES =============

// GET preference by key
router.get('/preferences/:key', authMiddleware, async (req, res) => {
    try {
        const { key } = req.params;
        const result = await query(
            'SELECT * FROM user_preferences WHERE key = $1 AND user_id = $2',
            [key, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.json({ key, value: null });
        }

        res.json({ key, value: result.rows[0].value });
    } catch (error) {
        console.error('Error fetching preference:', error);
        res.status(500).json({ error: 'Failed to fetch preference' });
    }
});

// PUT set preference
router.put('/preferences/:key', authMiddleware, async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        const result = await query(
            `INSERT INTO user_preferences (key, value, user_id, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (key, user_id) DO UPDATE SET value = $2, updated_at = NOW()
       RETURNING *`,
            [key, value, req.user.id]
        );

        res.json({ key, value: result.rows[0].value });
    } catch (error) {
        console.error('Error setting preference:', error);
        res.status(500).json({ error: 'Failed to set preference' });
    }
});

// ============= DATA MIGRATION (one-time import from localStorage) =============

// POST bulk import data
router.post('/migrate', async (req, res) => {
    try {
        const { clothingItems, modelImages, savedOutfits, preferences } = req.body;
        let imported = { clothingItems: 0, modelImages: 0, savedOutfits: 0, preferences: 0 };

        // Import clothing items
        if (clothingItems && Array.isArray(clothingItems)) {
            for (const item of clothingItems) {
                await query(
                    `INSERT INTO clothing_items (id, name, image_url, category, color, brand)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
                    [item.id, item.name, item.imageUrl || item.image, item.category, item.color || null, item.brand || null]
                );
                imported.clothingItems++;
            }
        }

        // Import model images (check for duplicates)
        if (modelImages && Array.isArray(modelImages)) {
            for (const imageUrl of modelImages) {
                const existing = await query(
                    'SELECT id FROM model_images WHERE image_url = $1',
                    [imageUrl]
                );
                if (existing.rowCount === 0) {
                    await query(
                        'INSERT INTO model_images (image_url) VALUES ($1)',
                        [imageUrl]
                    );
                    imported.modelImages++;
                }
            }
        }

        // Import saved outfits (validate foreign keys first)
        if (savedOutfits && Array.isArray(savedOutfits)) {
            for (const outfit of savedOutfits) {
                // Check if referenced clothing items exist, set to null if not
                const topId = outfit.clothingItems?.top?.id;
                const bottomId = outfit.clothingItems?.bottom?.id;
                const shoesId = outfit.clothingItems?.shoes?.id;
                const fullOutfitId = outfit.clothingItems?.fullOutfit?.id;

                const validateId = async (id) => {
                    if (!id) return null;
                    const result = await query('SELECT id FROM clothing_items WHERE id = $1', [id]);
                    return result.rowCount > 0 ? id : null;
                };

                const validTopId = await validateId(topId);
                const validBottomId = await validateId(bottomId);
                const validShoesId = await validateId(shoesId);
                const validFullOutfitId = await validateId(fullOutfitId);

                await query(
                    `INSERT INTO saved_outfits 
            (id, name, generated_image_url, model_image_url, top_item_id, bottom_item_id, shoes_item_id, full_outfit_item_id, ai_rating, style, occasion, tags, is_favorite, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, to_timestamp($14 / 1000.0))
           ON CONFLICT (id) DO NOTHING`,
                    [
                        outfit.id,
                        outfit.name,
                        outfit.generatedImageUrl,
                        outfit.modelImageUrl,
                        validTopId,
                        validBottomId,
                        validShoesId,
                        validFullOutfitId,
                        outfit.metadata?.aiRating || null,
                        outfit.metadata?.style || null,
                        outfit.metadata?.occasion || null,
                        outfit.metadata?.tags || [],
                        outfit.isFavorite || false,
                        outfit.timestamp
                    ]
                );
                imported.savedOutfits++;
            }
        }

        // Import preferences
        if (preferences && typeof preferences === 'object') {
            for (const [key, value] of Object.entries(preferences)) {
                await query(
                    `INSERT INTO user_preferences (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
                    [key, String(value)]
                );
                imported.preferences++;
            }
        }

        res.json({ success: true, imported });
    } catch (error) {
        console.error('Error migrating data:', error);
        res.status(500).json({ error: 'Failed to migrate data: ' + error.message });
    }
});

// GET health check for database
router.get('/health', async (req, res) => {
    try {
        const result = await query('SELECT NOW() as time');
        res.json({ status: 'healthy', database: 'connected', time: result.rows[0].time });
    } catch (error) {
        res.status(500).json({ status: 'unhealthy', error: error.message });
    }
});

export default router;
