import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getMimeType } from '../utils/mimeTypes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Rate an outfit combination using Gemini AI
 * Analyzes the model image and clothing items to provide a rating, style, occasion, and tags
 */
export const rateOutfitWithAI = async (modelUrl, clothingItems) => {
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  console.log('⭐ Rating outfit with AI...');
  console.log('Model:', modelUrl);
  console.log('Clothing items:', clothingItems);

  // Prepare parts array with model image and clothing images
  const parts = [];

  // Add model image
  const modelPath = path.join(__dirname, '../../../frontend/public', modelUrl);
  if (!fs.existsSync(modelPath)) {
    throw new Error(`Model image not found: ${modelPath}`);
  }
  const modelImageData = fs.readFileSync(modelPath);
  const modelBase64 = modelImageData.toString('base64');
  parts.push({
    inline_data: {
      mime_type: getMimeType(modelPath),
      data: modelBase64,
    },
  });

  // Add clothing images
  const clothingDescriptions = [];

  if (clothingItems.upper_body) {
    const upperPath = path.join(__dirname, '../../../frontend/public', clothingItems.upper_body);
    if (fs.existsSync(upperPath)) {
      const upperData = fs.readFileSync(upperPath);
      parts.push({
        inline_data: {
          mime_type: getMimeType(upperPath),
          data: upperData.toString('base64'),
        },
      });
      clothingDescriptions.push('upper body clothing');
    }
  }

  if (clothingItems.lower_body) {
    const lowerPath = path.join(__dirname, '../../../frontend/public', clothingItems.lower_body);
    if (fs.existsSync(lowerPath)) {
      const lowerData = fs.readFileSync(lowerPath);
      parts.push({
        inline_data: {
          mime_type: getMimeType(lowerPath),
          data: lowerData.toString('base64'),
        },
      });
      clothingDescriptions.push('lower body clothing');
    }
  }

  if (clothingItems.shoes) {
    const shoesPath = path.join(__dirname, '../../../frontend/public', clothingItems.shoes);
    if (fs.existsSync(shoesPath)) {
      const shoesData = fs.readFileSync(shoesPath);
      parts.push({
        inline_data: {
          mime_type: getMimeType(shoesPath),
          data: shoesData.toString('base64'),
        },
      });
      clothingDescriptions.push('shoes');
    }
  }

  // Add text prompt
  const prompt = `Analyze this outfit combination. The first image is the model, and the following images are the clothing items (${clothingDescriptions.join(', ')}).

Rate this outfit and provide detailed analysis in JSON format with the following structure:
{
  "rating": <number between 1-10>,
  "style": "<fashion style, e.g., Casual, Formal, Business Casual, Sporty, Street Style, Chic, Bohemian, etc.>",
  "occasion": "<suitable occasion, e.g., Office, Party, Casual Outing, Date Night, Sports, Wedding, etc.>",
  "tags": [<array of 3-5 descriptive tags like "modern", "elegant", "comfortable", "trendy", etc.>]
}

Consider these factors in your rating:
- Color coordination and harmony
- Style consistency across pieces
- Appropriateness of the combination
- Overall aesthetic appeal
- Fashion sense and trends

Provide only the JSON response, no additional text.`;

  parts.push({ text: prompt });

  const requestBody = {
    contents: [{
      parts: parts
    }]
  };

  const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  const responseText = data.candidates[0].content.parts[0].text.trim();

  console.log('📝 Raw Gemini rating response:', responseText);

  // Parse JSON response
  try {
    // Remove markdown code blocks if present
    const cleanedText = responseText.replace(/```json|```/g, '').trim();
    const ratingData = JSON.parse(cleanedText);

    // Validate and normalize the response
    const rating = Math.min(Math.max(Number(ratingData.rating) || 5, 1), 10);
    const style = ratingData.style || 'Casual';
    const occasion = ratingData.occasion || 'Everyday';
    const tags = Array.isArray(ratingData.tags) ? ratingData.tags.slice(0, 5) : ['stylish'];

    const result = {
      rating,
      style,
      occasion,
      tags
    };

    console.log('✅ Outfit rating:', result);
    return result;
  } catch (e) {
    console.error('❌ Failed to parse rating response:', e);
    // Return default values if parsing fails
    return {
      rating: 7,
      style: 'Casual',
      occasion: 'Everyday',
      tags: ['comfortable', 'stylish']
    };
  }
};
