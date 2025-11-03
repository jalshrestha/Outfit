import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './api/routes.js';
import { startTrendingCronJob, runInitialRefresh } from './services/trendingCronJob.js';

// --- Basic Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
const envPath = path.join(__dirname, '../.env');
console.log('📂 Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('❌ Error loading .env:', result.error);
} else {
  console.log('✅ .env loaded successfully');
  console.log('🔑 GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');
}

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors({ 
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true 
}));
// Increase JSON payload limit to handle base64 image data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve the static uploads directory
const uploadsPath = path.join(__dirname, '../../frontend/public/uploads');
app.use('/uploads', express.static(uploadsPath));

// --- API Routes ---
app.use('/api', apiRoutes);

// --- Optional: Enable Trending Outfits Cron Job ---
// Uncomment the lines below to enable automatic refresh of trending outfits every 12 hours
// const ENABLE_TRENDING_CRON = process.env.ENABLE_TRENDING_CRON === 'true';
// if (ENABLE_TRENDING_CRON) {
//   startTrendingCronJob();
//   // Optionally run initial refresh on startup
//   // runInitialRefresh().catch(err => console.error('Initial refresh failed:', err));
// }

// --- Server Startup ---
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log('📡 API Endpoints:');
  console.log('   POST /api/upload - Upload clothing images');
  console.log('   POST /api/categorize - Categorize clothing');
  console.log('   POST /api/label - Generate clothing labels');
  console.log('   POST /api/try-on - Virtual try-on');
  console.log('   POST /api/rate-outfit - Rate outfit');
  console.log('   GET  /api/trending - Get trending outfits');
  console.log('   POST /api/trending/refresh - Refresh trending cache');
  console.log('   POST /api/trending/classify-image - Classify image with AI');
  console.log('   GET  /api/trending/stats - Get cache statistics');
});
