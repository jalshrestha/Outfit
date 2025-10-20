import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './api/routes.js';

// --- Basic Setup ---
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Middleware ---
app.use(cors({ origin: 'http://localhost:3000' })); // Next.js default port
app.use(express.json());

// Serve the static uploads directory
const uploadsPath = path.join(__dirname, '../../frontend/public/uploads');
app.use('/uploads', express.static(uploadsPath));

// --- API Routes ---
app.use('/api', apiRoutes);

// --- Server Startup ---
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
});
