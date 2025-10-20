import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to get MIME type from file extension
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  return mimeTypes[ext] || 'image/jpeg';
}

// Helper function to convert image file to proper format for SDK
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
      mimeType,
    },
  };
}

export const generateVirtualTryOn = async (modelUrl, clothingItems) => {
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  // Lazy import to avoid loading SDK before env vars are set
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(API_KEY);
  const uploadsDir = path.join(__dirname, '../../../frontend/public');

  try {
    console.log('🎨 Starting AI Virtual Try-On Generation...');
    console.log('Model:', modelUrl);
    console.log('Clothing items:', clothingItems);

    // Helper to check if URL is external
    const isExternalUrl = (url) => url.startsWith('http://') || url.startsWith('https://');

    // Validate model URL is not external
    if (isExternalUrl(modelUrl)) {
      throw new Error('Model image must be uploaded to the backend. External URLs are not supported.');
    }

    // Read model image
    const modelPath = path.join(uploadsDir, modelUrl);
    if (!fs.existsSync(modelPath)) {
      throw new Error(`Model image not found: ${modelPath}`);
    }

    // Build the prompt parts array
    const imageParts = [];
    let clothingDescriptions = [];

    // Add clothing images first (skip external URLs)
    if (clothingItems.upper_body && !isExternalUrl(clothingItems.upper_body)) {
      const upperPath = path.join(uploadsDir, clothingItems.upper_body);
      if (fs.existsSync(upperPath)) {
        imageParts.push(fileToGenerativePart(upperPath, getMimeType(upperPath)));
        clothingDescriptions.push('the upper body clothing (shirt/jacket/top) from the first image');
      }
    }

    if (clothingItems.lower_body && !isExternalUrl(clothingItems.lower_body)) {
      const lowerPath = path.join(uploadsDir, clothingItems.lower_body);
      if (fs.existsSync(lowerPath)) {
        const ordinal = imageParts.length === 0 ? 'first' : imageParts.length === 1 ? 'second' : 'third';
        imageParts.push(fileToGenerativePart(lowerPath, getMimeType(lowerPath)));
        clothingDescriptions.push(`the lower body clothing (pants/skirt/shorts) from the ${ordinal} image`);
      }
    }

    if (clothingItems.shoes && !isExternalUrl(clothingItems.shoes)) {
      const shoesPath = path.join(uploadsDir, clothingItems.shoes);
      if (fs.existsSync(shoesPath)) {
        const ordinal = imageParts.length === 0 ? 'first' : imageParts.length === 1 ? 'second' : 'third';
        imageParts.push(fileToGenerativePart(shoesPath, getMimeType(shoesPath)));
        clothingDescriptions.push(`the shoes from the ${ordinal} image`);
      }
    }

    // Check if we have any clothing items to try on
    if (imageParts.length === 0) {
      throw new Error('No valid clothing items found. Please upload clothing items to your wardrobe first.');
    }

    // Add the model image last
    const modelPart = fileToGenerativePart(modelPath, getMimeType(modelPath));
    imageParts.push(modelPart);

    const modelImageOrdinal = imageParts.length === 1 ? 'first' : imageParts.length === 2 ? 'second' : imageParts.length === 3 ? 'third' : 'last';

    // Create the text prompt
    const textPrompt = `Create a professional fashion photo. Take ${clothingDescriptions.join(', ')} and let the person from the ${modelImageOrdinal} image wear them. Generate a realistic, full-body shot of the person wearing all the selected clothing items together. The person's pose, face, and body should remain exactly the same as in the original photo. Make the clothes fit naturally on their body with proper lighting, shadows, and realistic fabric textures. Ensure the outfit looks cohesive and professional.`;

    console.log('📤 Sending request to Gemini...');
    console.log('Number of images:', imageParts.length);

    // Use the SDK for image generation with gemini-2.0-flash-preview-image-generation
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-preview-image-generation' });

    const result = await model.generateContent([textPrompt, ...imageParts]);
    const response = result.response;

    console.log('📥 Received response from Gemini');

    // Check if we got an image back
    const parts = response.candidates[0].content.parts;
    for (const part of parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, 'base64');

        const resultFilename = `tryon-${Date.now()}.png`;
        const resultPath = path.join(uploadsDir, 'uploads', resultFilename);

        fs.writeFileSync(resultPath, buffer);
        console.log('✅ Virtual try-on image saved:', resultFilename);

        return `/uploads/${resultFilename}`;
      }
    }

    // If no image was generated, throw error
    throw new Error('No image was generated by the AI model');

  } catch (error) {
    console.error('❌ Error in virtual try-on generation:', error);
    throw error;
  }
};

// Generate a descriptive label for clothing items using AI
export const generateClothingLabel = async (imageUrl) => {
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  const uploadsDir = path.join(__dirname, '../../../frontend/public');
  const IMAGE_GEN_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  try {
    const imagePath = path.join(uploadsDir, imageUrl);
    const mimeType = getMimeType(imagePath);
    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString('base64');

    const requestBody = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image,
              },
            },
            {
              text: 'Analyze this clothing item and provide a detailed, descriptive label. Include the type of garment, color, style, and any distinctive features. Format your response as a single descriptive phrase suitable for a wardrobe label (e.g., "Blue Denim Jacket with Silver Buttons", "Black Leather Ankle Boots", "White Cotton T-Shirt"). Be specific and concise.'
            }
          ]
        }
      ]
    };

    const response = await fetch(`${IMAGE_GEN_ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Label generation error:', errorText);
      return 'Clothing Item'; // Fallback
    }

    const data = await response.json();
    const label = data.candidates[0].content.parts[0].text.trim();

    console.log('🏷️  Generated label:', label);
    return label;

  } catch (error) {
    console.error('Error generating label:', error);
    return 'Clothing Item'; // Fallback label
  }
};
