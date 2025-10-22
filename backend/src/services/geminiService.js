import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Helper to get MIME type
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
            text: "Analyze this clothing image. Respond with a single JSON object containing one key, 'category'. The value for 'category' must be one of the following exact strings: 'upper_body', 'lower_body', or 'shoes'."
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
    const validCategories = ['upper_body', 'lower_body', 'shoes'];
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
