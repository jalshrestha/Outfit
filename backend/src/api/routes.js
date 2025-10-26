import { Router } from 'express';
import { upload } from '../config/multer.js';
import { getCategoryFromGemini } from '../services/geminiService.js';
import { generateVirtualTryOn, generateClothingLabel } from '../services/virtualTryOnService.js';
import { rateOutfitWithAI } from '../services/outfitRatingService.js';

const router = Router();

// 1. File Upload Endpoint
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  res.status(200).json({ url: `/uploads/${req.file.filename}` });
});

// 2. Clothing Categorization Endpoint
router.post('/categorize', async (req, res) => {
  try {
    const { localPath } = req.body;
    if (!localPath) {
      return res.status(400).json({ error: 'localPath is required.' });
    }
    console.log('📋 Received categorize request for:', localPath);
    const category = await getCategoryFromGemini(localPath);
    console.log('✅ Category determined:', category);
    res.status(200).json({ category });
  } catch (error) {
    console.error('❌ Categorization error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ error: 'Failed to categorize image: ' + error.message });
  }
});

// 2b. Generate Clothing Label Endpoint
router.post('/label', async (req, res) => {
  try {
    const { localPath } = req.body;
    if (!localPath) {
      return res.status(400).json({ error: 'localPath is required.' });
    }
    const label = await generateClothingLabel(localPath);
    res.status(200).json({ label });
  } catch (error) {
    console.error('Label generation error:', error);
    res.status(500).json({ error: 'Failed to generate label.' });
  }
});

// 3. AI Virtual Try-On Endpoint (using Gemini Image Generation)
router.post('/try-on', async (req, res) => {
  try {
    const { modelUrl, clothingItems } = req.body;
    if (!modelUrl || !clothingItems) {
      return res.status(400).json({ error: 'modelUrl and clothingItems are required.' });
    }

    console.log('📸 Generating virtual try-on...');
    console.log('Model:', modelUrl);
    console.log('Clothing items:', clothingItems);

    const resultUrl = await generateVirtualTryOn(modelUrl, clothingItems);
    res.status(200).json({ resultUrl });
  } catch (error) {
    console.error('Virtual try-on error:', error);
    res.status(500).json({ error: 'Failed to generate virtual try-on: ' + error.message });
  }
});

// 4. Outfit Rating Endpoint (using Gemini AI)
router.post('/rate-outfit', async (req, res) => {
  try {
    const { modelUrl, clothingItems } = req.body;
    if (!modelUrl || !clothingItems) {
      return res.status(400).json({ error: 'modelUrl and clothingItems are required.' });
    }

    console.log('⭐ Rating outfit...');
    console.log('Model:', modelUrl);
    console.log('Clothing items:', clothingItems);

    const rating = await rateOutfitWithAI(modelUrl, clothingItems);
    res.status(200).json(rating);
  } catch (error) {
    console.error('Outfit rating error:', error);
    res.status(500).json({ error: 'Failed to rate outfit: ' + error.message });
  }
});

export default router;
