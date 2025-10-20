import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure disk storage for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save files to the frontend's public uploads directory
    const uploadsPath = path.join(__dirname, '../../../frontend/public/uploads');
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    // Create a unique filename to prevent overwrites
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({ storage: storage });
