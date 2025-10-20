# Outfit - Virtual Fitting Room Application

## Project Structure

This project is organized into separate frontend and backend directories for better modularity and maintainability.

```
Outfit/
├── frontend/              # React + Vite frontend application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility libraries
│   │   ├── App.tsx       # Main App component
│   │   └── main.tsx      # Entry point
│   ├── public/
│   │   └── uploads/      # User uploaded images
│   ├── package.json
│   ├── vite.config.ts
│   └── ...config files
│
├── backend/              # Node.js + Express backend server
│   ├── src/
│   │   ├── api/
│   │   │   └── routes.js         # API endpoints
│   │   ├── services/
│   │   │   ├── geminiService.js  # Google Gemini AI integration
│   │   │   └── imageService.js   # Image processing with Sharp
│   │   ├── config/
│   │   │   └── multer.js         # File upload configuration
│   │   └── index.js              # Server entry point
│   ├── .env                      # Environment variables
│   └── package.json
│
└── README.md
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:8080`

## API Endpoints

### POST /api/upload
Upload clothing or model images.

**Request:**
- Form data with `image` field

**Response:**
```json
{
  "url": "/uploads/image-1234567890-123456789.jpg"
}
```

### POST /api/categorize
Categorize clothing items using Google Gemini AI.

**Request:**
```json
{
  "localPath": "/uploads/image-1234567890-123456789.jpg"
}
```

**Response:**
```json
{
  "category": "upper_body"
}
```

Categories: `upper_body`, `lower_body`, `shoes`

### POST /api/try-on
Composite images to create virtual try-on result.

**Request:**
```json
{
  "modelUrl": "/uploads/model-1234567890.jpg",
  "clothingItems": {
    "upper_body": "/uploads/shirt-1234567890.jpg",
    "lower_body": "/uploads/pants-1234567890.jpg",
    "shoes": "/uploads/shoes-1234567890.jpg"
  }
}
```

**Response:**
```json
{
  "resultUrl": "/uploads/result-1234567890.png"
}
```

## Technologies Used

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express.js
- Google Generative AI (Gemini)
- Sharp (image processing)
- Multer (file uploads)

## Environment Variables

Backend `.env` file:
```
GEMINI_API_KEY=your_api_key_here
PORT=3001
```
