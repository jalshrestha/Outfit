import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getMimeType } from '../utils/mimeTypes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export const getCategoryFromGemini = async (localPath) => {
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  // Resolve path relative to backend directory
  const fullPath = path.join(__dirname, '../../../frontend/public', localPath);

  console.log('🔍 Categorizing image:', fullPath);

  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Image file not found: ${fullPath}`);
  }

  const mimeType = getMimeType(fullPath);
  const imageData = fs.readFileSync(fullPath);
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
            text: "Analyze this clothing image. Respond with a single JSON object containing one key, 'category'. The value for 'category' must be one of the following exact strings: 'upper_body', 'lower_body', 'shoes', or 'full_outfit'. \n\nClassification rules:\n- 'upper_body': Single item showing only a top, shirt, jacket, sweater, hoodie, or similar upper garment\n- 'lower_body': Single item showing only pants, jeans, shorts, skirt, or similar lower garment\n- 'shoes': Single item showing only shoes, sneakers, boots, or footwear\n- 'full_outfit': A complete outfit showing multiple pieces together (person wearing top AND bottom together, complete looks, styled outfits with multiple garments visible, fashion photos showing full body outfits). If you see a person wearing both top and bottom clothing items together, it's a 'full_outfit'."
          }
        ]
      }
    ]
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

  console.log('📝 Raw Gemini response:', responseText);

  // Try to parse as JSON first
  let category;
  try {
    // Remove markdown code blocks if present
    const cleanedText = responseText.replace(/```json|```/g, '').trim();
    const jsonResponse = JSON.parse(cleanedText);
    category = jsonResponse.category;
  } catch (e) {
    // If not JSON, check if it's a plain string with a valid category
    const validCategories = ['upper_body', 'lower_body', 'shoes', 'full_outfit'];
    const cleanCategory = responseText.replace(/["']/g, '').trim();
    if (validCategories.includes(cleanCategory)) {
      category = cleanCategory;
    } else {
      throw new Error(`Invalid category response: ${responseText}`);
    }
  }

  console.log('✅ Category:', category);
  return category;
};

/**
 * Classify clothing from a remote image URL using Gemini API
 * @param {string} imageUrl - URL of the image to classify
 * @returns {Promise<string>} - One of: 'upper_body', 'lower_body', 'shoes', 'full_outfit'
 */
export const getCategoryFromUrl = async (imageUrl) => {
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  console.log('🔍 Classifying image from URL:', imageUrl);

  // Fetch the image from the URL
  const imageResponse = await fetch(imageUrl);

  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString('base64');

  // Determine MIME type from content-type header
  let mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

  // Fallback to jpeg if content-type is not an image
  if (!mimeType.startsWith('image/')) {
    mimeType = 'image/jpeg';
  }

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
            text: "Analyze this clothing/fashion image. Respond with a single JSON object containing one key, 'category'. The value for 'category' must be one of the following exact strings: 'upper_body', 'lower_body', 'shoes', or 'full_outfit'. \n\nClassification rules:\n- 'upper_body': Single item showing only a top, shirt, jacket, sweater, hoodie, or similar upper garment\n- 'lower_body': Single item showing only pants, jeans, shorts, skirt, or similar lower garment\n- 'shoes': Single item showing only shoes, sneakers, boots, or footwear\n- 'full_outfit': A complete outfit showing multiple pieces together (person wearing top AND bottom together, complete looks, styled outfits with multiple garments visible, fashion photos showing full body outfits). If you see a person wearing both top and bottom clothing items together, it's a 'full_outfit'."
          }
        ]
      }
    ]
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

  console.log('📝 Raw Gemini response:', responseText);

  // Try to parse as JSON first
  let category;
  try {
    // Remove markdown code blocks if present
    const cleanedText = responseText.replace(/```json|```/g, '').trim();
    const jsonResponse = JSON.parse(cleanedText);
    category = jsonResponse.category;
  } catch (e) {
    // If not JSON, check if it's a plain string with a valid category
    const validCategories = ['upper_body', 'lower_body', 'shoes', 'full_outfit', 'top', 'bottom'];
    const cleanCategory = responseText.replace(/["']/g, '').trim().toLowerCase();
    
    // Normalize any frontend format back to backend format
    const normalizeMap = {
      'top': 'upper_body',
      'bottom': 'lower_body'
    };
    
    if (validCategories.includes(cleanCategory)) {
      category = normalizeMap[cleanCategory] || cleanCategory;
    } else {
      // Default to 'upper_body' if unable to parse
      console.warn(`⚠️ Unable to parse category from: ${responseText}, defaulting to 'upper_body'`);
      category = 'upper_body';
    }
  }

  console.log('✅ Category from URL:', category);
  return category;
};
