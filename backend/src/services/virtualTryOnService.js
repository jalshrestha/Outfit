import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getMimeType } from '../utils/mimeTypes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  const uploadsDir = path.join(__dirname, '../../../frontend/public');
  const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';

  try {
    console.log('🎨 Starting AI Virtual Try-On Generation...');
    console.log('Model:', modelUrl);
    console.log('Clothing items:', clothingItems);

    // Helper to check if URL is external
    const isExternalUrl = (url) => url.startsWith('http://') || url.startsWith('https://');
    
    // Helper to check if it's a base64 data URL
    const isBase64DataUrl = (url) => url.startsWith('data:image/');

    // Validate model URL is not external
    if (isExternalUrl(modelUrl)) {
      throw new Error('Model image must be uploaded to the backend. External URLs are not supported.');
    }

    // Read model image
    const modelPath = path.join(uploadsDir, modelUrl);
    if (!fs.existsSync(modelPath)) {
      throw new Error(`Model image not found: ${modelPath}`);
    }

    // Build the request parts array
    const parts = [];
    let clothingDescriptions = [];

    // Check if we have a full outfit
    if (clothingItems.full_outfit && !isExternalUrl(clothingItems.full_outfit)) {
      if (isBase64DataUrl(clothingItems.full_outfit)) {
        // Handle base64 data URL directly
        const base64Data = clothingItems.full_outfit.split(',')[1];
        const mimeMatch = clothingItems.full_outfit.match(/data:(image\/[^;]+);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        
        parts.push({
          inline_data: {
            mime_type: mimeType,
            data: base64Data,
          },
        });
        clothingDescriptions.push('the complete outfit from the first image');
      } else {
        // Handle file path
        const fullOutfitPath = path.join(uploadsDir, clothingItems.full_outfit);
        if (fs.existsSync(fullOutfitPath)) {
          const imageData = fs.readFileSync(fullOutfitPath);
          const base64Image = imageData.toString('base64');
          parts.push({
            inline_data: {
              mime_type: getMimeType(fullOutfitPath),
              data: base64Image,
            },
          });
          clothingDescriptions.push('the complete outfit from the first image');
        }
      }
    } else {
      // Add individual clothing items (skip external URLs)
      if (clothingItems.upper_body && !isExternalUrl(clothingItems.upper_body)) {
        const upperPath = path.join(uploadsDir, clothingItems.upper_body);
        if (fs.existsSync(upperPath)) {
          const imageData = fs.readFileSync(upperPath);
          const base64Image = imageData.toString('base64');
          parts.push({
            inline_data: {
              mime_type: getMimeType(upperPath),
              data: base64Image,
            },
          });
          clothingDescriptions.push('the upper body clothing (shirt/jacket/top) from the first image');
        }
      }

      if (clothingItems.lower_body && !isExternalUrl(clothingItems.lower_body)) {
        const lowerPath = path.join(uploadsDir, clothingItems.lower_body);
        if (fs.existsSync(lowerPath)) {
          const imageData = fs.readFileSync(lowerPath);
          const base64Image = imageData.toString('base64');
          const ordinal = parts.filter(p => p.inline_data).length === 0 ? 'first' : parts.filter(p => p.inline_data).length === 1 ? 'second' : 'third';
          parts.push({
            inline_data: {
              mime_type: getMimeType(lowerPath),
              data: base64Image,
            },
          });
          clothingDescriptions.push(`the lower body clothing (pants/skirt/shorts) from the ${ordinal} image`);
        }
      }

      if (clothingItems.shoes && !isExternalUrl(clothingItems.shoes)) {
        const shoesPath = path.join(uploadsDir, clothingItems.shoes);
        if (fs.existsSync(shoesPath)) {
          const imageData = fs.readFileSync(shoesPath);
          const base64Image = imageData.toString('base64');
          const ordinal = parts.filter(p => p.inline_data).length === 0 ? 'first' : parts.filter(p => p.inline_data).length === 1 ? 'second' : 'third';
          parts.push({
            inline_data: {
              mime_type: getMimeType(shoesPath),
              data: base64Image,
            },
          });
          clothingDescriptions.push(`the shoes from the ${ordinal} image`);
        }
      }
    }

    // Check if we have any clothing items to try on
    if (parts.length === 0) {
      console.error('❌ No valid clothing items found');
      console.error('Clothing items received:', clothingItems);
      throw new Error('No valid clothing items found. Please upload clothing items to your wardrobe first. Note: External URLs from scraped images must be downloaded locally first.');
    }
    
    console.log(`✅ Successfully loaded ${parts.length} images for virtual try-on`);

    // Add the model image last
    const modelImageData = fs.readFileSync(modelPath);
    const base64ModelImage = modelImageData.toString('base64');
    const imageCount = parts.filter(p => p.inline_data).length;
    const modelImageNumber = imageCount + 1; // Model image will be added next
    const modelImageOrdinal = imageCount === 0 ? 'first' : imageCount === 1 ? 'second' : imageCount === 2 ? 'third' : 'last';

    parts.push({
      inline_data: {
        mime_type: getMimeType(modelPath),
        data: base64ModelImage,
      },
    });

    // Create the text prompt based on whether it's a full outfit or individual items
    let textPrompt;
    if (clothingItems.full_outfit) {
      textPrompt = `TASK: Virtual Clothing Transfer - Extract clothing from person A and apply to person B

IMAGE 1: A person wearing clothing. IGNORE the person completely. Only look at:
- The shirt/top (color, pattern, style, texture)
- The pants/bottoms (color, pattern, style, texture)  
- The shoes (color, style, design)
- DO NOT look at: face, body, skin, pose, background

IMAGE ${modelImageNumber}: The target model person. This person will wear the clothing.

INSTRUCTIONS:
1. Analyze Image 1 and extract ONLY the clothing design (what the clothes look like)
2. Take Image ${modelImageNumber} as your base - keep this person exactly as they are (face, body, pose, background)
3. Draw/render the clothing from Image 1 onto the person in Image ${modelImageNumber}
4. Make the clothing fit the model's body naturally
5. Match lighting and shadows to Image ${modelImageNumber}

CRITICAL: 
- The final image must show ONLY the person from Image ${modelImageNumber}
- The clothing must come from Image 1 but be rendered onto Image ${modelImageNumber}'s person
- NO merging of two people
- NO overlaying faces or bodies
- ONE person wearing clothes from Image 1

Generate a photo of the model from Image ${modelImageNumber} wearing the clothing from Image 1.`;
    } else {
      textPrompt = `=== VIRTUAL CLOTHING TRY-ON TASK ===

CLOTHING ITEMS: ${clothingDescriptions.join(', ')}.
MODEL: The ${modelImageOrdinal} image contains the person who will wear these clothes.

INSTRUCTIONS:
1. Analyze each clothing item's design, color, pattern, and style
2. Take the model person from the ${modelImageOrdinal} image (keep their face, body, pose, background exactly the same)
3. Virtually dress them with the clothing items from the previous images
4. Make the clothing fit naturally with realistic fabric texture, wrinkles, shadows, and proper sizing
5. Match lighting to the model's environment
6. Ensure all clothing items coordinate as a cohesive outfit

OUTPUT: A realistic fashion photo showing the model person wearing the selected clothing items. The model's appearance, pose, and background remain unchanged from the original ${modelImageOrdinal} image.`;
    }

    // Add text prompt as the last part
    parts.push({ text: textPrompt });

    console.log('📤 Sending request to Gemini...');
    console.log('Number of images:', parts.filter(p => p.inline_data).length);
    console.log('Image order:', parts.filter(p => p.inline_data).map((p, i) => {
      if (i === 0 && clothingItems.full_outfit) return `Image ${i+1}: Full outfit (clothing source)`;
      if (i === parts.filter(p => p.inline_data).length - 1) return `Image ${i+1}: Model person`;
      return `Image ${i+1}: Clothing item`;
    }));
    console.log('Text prompt:', textPrompt);

    // Build request body
    const requestBody = {
      contents: [
        {
          parts: parts,
        },
      ],
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
      console.error('Gemini API error response:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📥 Received response from Gemini');

    // Check if we got an image back
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
      throw new Error('Invalid response structure from Gemini API');
    }

    const responseParts = data.candidates[0].content.parts;
    for (const part of responseParts) {
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
