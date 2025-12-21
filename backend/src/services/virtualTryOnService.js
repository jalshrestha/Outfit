import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getMimeType } from '../utils/mimeTypes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates a virtual try-on image using Gemini 3 Pro Image Preview model
 * @param {string} modelUrl - Path to the model/person image
 * @param {Object} clothingItems - Object containing clothing item paths
 * @param {string} clothingItems.full_outfit - Path to full outfit image (optional)
 * @param {string} clothingItems.upper_body - Path to upper body clothing (optional)
 * @param {string} clothingItems.lower_body - Path to lower body clothing (optional)
 * @param {string} clothingItems.shoes - Path to shoes (optional)
 * @returns {string} Path to generated try-on image
 */
export const generateVirtualTryOn = async (modelUrl, clothingItems) => {
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  const uploadsDir = path.join(__dirname, '../../../frontend/public');
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    console.log('🎨 Starting AI Virtual Try-On Generation...');
    console.log('📥 Model URL:', modelUrl);
    console.log('📥 Model URL type:', typeof modelUrl);
    console.log('📥 Clothing items:', JSON.stringify(clothingItems, null, 2));
    console.log('📥 uploadsDir:', uploadsDir);

    // Build the prompt array with images
    const prompt = [];
    const clothingDescriptions = [];

    // Scenario 1: Full outfit - extract clothing from image 1 and apply to model in image 2
    if (clothingItems.full_outfit) {
      console.log('📋 [SCENARIO 1] Full outfit mode');
      const outfitPath = resolveImagePath(clothingItems.full_outfit, uploadsDir);
      console.log('📋 Outfit path resolved:', outfitPath);

      const outfitData = await readAndConvertImage(outfitPath);
      console.log('📋 Outfit image data:', {
        mimeType: outfitData.mimeType,
        base64Length: outfitData.base64.length
      });

      prompt.push({
        inlineData: {
          mimeType: outfitData.mimeType,
          data: outfitData.base64,
        },
      });

      console.log(`✅ Full outfit loaded: ${path.basename(outfitPath)}`);
      console.log('📋 Prompt array length after outfit:', prompt.length);
    }
    // Scenario 2: Individual items - upperwear, lowerwear, shoes applied to model
    else {
      if (clothingItems.upper_body) {
        const upperPath = resolveImagePath(clothingItems.upper_body, uploadsDir);
        const upperData = await readAndConvertImage(upperPath);

        prompt.push({
          inlineData: {
            mimeType: upperData.mimeType,
            data: upperData.base64,
          },
        });

        clothingDescriptions.push('upper body clothing (shirt/jacket/top)');
        console.log(`✅ Upper body loaded: ${path.basename(upperPath)}`);
      }

      if (clothingItems.lower_body) {
        const lowerPath = resolveImagePath(clothingItems.lower_body, uploadsDir);
        const lowerData = await readAndConvertImage(lowerPath);

        prompt.push({
          inlineData: {
            mimeType: lowerData.mimeType,
            data: lowerData.base64,
          },
        });

        clothingDescriptions.push('lower body clothing (pants/skirt/shorts)');
        console.log(`✅ Lower body loaded: ${path.basename(lowerPath)}`);
      }

      if (clothingItems.shoes) {
        const shoesPath = resolveImagePath(clothingItems.shoes, uploadsDir);
        const shoesData = await readAndConvertImage(shoesPath);

        prompt.push({
          inlineData: {
            mimeType: shoesData.mimeType,
            data: shoesData.base64,
          },
        });

        clothingDescriptions.push('shoes');
        console.log(`✅ Shoes loaded: ${path.basename(shoesPath)}`);
      }
    }

    // Validate we have clothing items
    if (prompt.length === 0) {
      throw new Error('No valid clothing items found. Please upload clothing items to your wardrobe first.');
    }

    // Add model image (always last)
    console.log('📋 Adding model image...');
    const modelPath = resolveImagePath(modelUrl, uploadsDir);
    console.log('📋 Model path resolved:', modelPath);

    const modelData = await readAndConvertImage(modelPath);
    console.log('📋 Model image data:', {
      mimeType: modelData.mimeType,
      base64Length: modelData.base64.length
    });

    prompt.push({
      inlineData: {
        mimeType: modelData.mimeType,
        data: modelData.base64,
      },
    });

    console.log(`✅ Model loaded: ${path.basename(modelPath)}`);
    console.log('📋 Prompt array length after model:', prompt.length);

    // Create appropriate text prompt based on scenario
    const numberOfClothingItems = prompt.filter(p => p.inlineData).length;
    console.log('📋 Number of clothing items (before model):', numberOfClothingItems - 1);

    const textPrompt = clothingItems.full_outfit
      ? createFullOutfitPrompt()
      : createIndividualItemsPrompt(clothingDescriptions, numberOfClothingItems);

    console.log('📋 Text prompt being used:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(textPrompt);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    prompt.push({ text: textPrompt });

    console.log('📤 Sending request to Gemini...');
    console.log(`📋 Total prompt parts: ${prompt.length}`);
    console.log(`📋 Number of images: ${prompt.filter(p => p.inlineData).length}`);
    console.log('📋 Prompt structure:', prompt.map((p, i) => {
      if (p.inlineData) return `Part ${i + 1}: Image (${p.inlineData.mimeType})`;
      if (p.text) return `Part ${i + 1}: Text prompt (${p.text.length} chars)`;
      return `Part ${i + 1}: Unknown`;
    }));

    // Generate content using the SDK (Gemini 3 Pro Image Preview for high-quality generation)
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: prompt,
    });

    console.log('📥 Received response from Gemini');
    console.log('🔍 Full response structure:', JSON.stringify(response, null, 2));

    // Process response and save generated image
    // The SDK response structure: response.candidates[0].content.parts
    if (response.candidates && response.candidates[0]) {
      console.log('📋 Candidate 0 exists');
      console.log('📋 Candidate 0 finish reason:', response.candidates[0].finishReason);
      console.log('📋 Candidate 0 safety ratings:', JSON.stringify(response.candidates[0].safetyRatings, null, 2));

      if (response.candidates[0].content) {
        console.log('📋 Content exists');
        const parts = response.candidates[0].content.parts;
        console.log('📋 Number of parts:', parts.length);

        parts.forEach((part, index) => {
          console.log(`📋 Part ${index + 1}:`, {
            hasInlineData: !!part.inlineData,
            hasText: !!part.text,
            keys: Object.keys(part)
          });

          if (part.text) {
            console.log(`📋 Part ${index + 1} text:`, part.text);
          }
        });

        for (const part of parts) {
          if (part.inlineData) {
            console.log('✅ Found inlineData in response!');
            const imageData = part.inlineData.data;
            const buffer = Buffer.from(imageData, "base64");

            // Generate filename
            const timestamp = Date.now().toString().slice(-10);
            const resultFilename = `tryon-${timestamp}.png`;
            const resultPath = path.join(uploadsDir, 'uploads', resultFilename);

            fs.writeFileSync(resultPath, buffer);
            console.log('✅ Virtual try-on image saved:', resultFilename);

            return `/uploads/${resultFilename}`;
          }
        }

        console.log('❌ No inlineData found in any parts');
      } else {
        console.log('❌ No content in candidate 0');
      }
    } else {
      console.log('❌ No candidates in response');
    }

    console.log('❌ Final response:', JSON.stringify(response, null, 2));
    throw new Error('No image was generated by the AI model');

  } catch (error) {
    console.error('❌ Error in virtual try-on generation:', error);
    throw error;
  }
};

/**
 * Generates a descriptive label for clothing items using AI
 * @param {string} imageUrl - Path to the clothing image
 * @returns {string} Generated label
 */
export const generateClothingLabel = async (imageUrl) => {
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  const uploadsDir = path.join(__dirname, '../../../frontend/public');
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const imagePath = path.join(uploadsDir, imageUrl);
    const imageData = await readAndConvertImage(imagePath);

    const prompt = [
      {
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.base64,
        },
      },
      {
        text: 'Analyze this clothing item and provide a detailed, descriptive label. Include the type of garment, color, style, and any distinctive features. Format your response as a single descriptive phrase suitable for a wardrobe label (e.g., "Blue Denim Jacket with Silver Buttons", "Black Leather Ankle Boots", "White Cotton T-Shirt"). Be specific and concise.'
      }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    // Extract text from SDK response structure
    if (response.candidates && response.candidates[0] && response.candidates[0].content) {
      const label = response.candidates[0].content.parts[0].text.trim();
      console.log('🏷️  Generated label:', label);
      return label;
    }

    console.log('⚠️  No label generated, using fallback');
    return 'Clothing Item'; // Fallback

  } catch (error) {
    console.error('Error generating label:', error);
    return 'Clothing Item'; // Fallback label
  }
};

// ============================================
// Helper Functions
// ============================================

/**
 * Resolves image path, handling base64 data URLs and regular paths
 * @param {string} imageInput - Image path or base64 data URL
 * @param {string} uploadsDir - Base uploads directory
 * @returns {string} Resolved file path
 */
function resolveImagePath(imageInput, uploadsDir) {
  console.log('🔍 [resolveImagePath] Input:', imageInput);
  console.log('🔍 [resolveImagePath] uploadsDir:', uploadsDir);

  // Check if it's a base64 data URL (from scraped images)
  if (imageInput.startsWith('data:image/')) {
    console.log('🔄 Converting base64 data URL to file...');

    const base64Data = imageInput.split(',')[1];
    const mimeMatch = imageInput.match(/data:(image\/[^;]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const ext = mimeType.split('/')[1] || 'jpg';

    const timestamp = Date.now();
    const filename = `scraped-${timestamp}.${ext}`;
    const filePath = path.join(uploadsDir, 'uploads', filename);

    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    console.log(`📥 Saved scraped image to: ${filename}`);
    console.log(`📁 Full path: ${filePath}`);
    return filePath;
  }

  // Check if it's an external URL (not supported)
  if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
    throw new Error('External URLs are not supported. Images must be uploaded to the backend.');
  }

  // Regular file path
  const filePath = path.join(uploadsDir, imageInput);
  console.log(`📁 [resolveImagePath] Resolved path: ${filePath}`);
  console.log(`📁 [resolveImagePath] File exists: ${fs.existsSync(filePath)}`);

  if (!fs.existsSync(filePath)) {
    // Debug: List directory contents to see what's actually there
    const dirPath = path.dirname(filePath);
    console.log(`📂 [resolveImagePath] Directory: ${dirPath}`);
    console.log(`📂 [resolveImagePath] Directory exists: ${fs.existsSync(dirPath)}`);

    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      console.log(`📂 [resolveImagePath] Files in directory (first 10):`, files.slice(0, 10));
      console.log(`📂 [resolveImagePath] Looking for file: ${path.basename(filePath)}`);
      console.log(`📂 [resolveImagePath] File in list: ${files.includes(path.basename(filePath))}`);
    }

    throw new Error(`Image not found: ${filePath}`);
  }

  console.log(`✅ [resolveImagePath] File found successfully`);
  return filePath;
}

/**
 * Reads image file and converts to base64, handling AVIF conversion
 * @param {string} filePath - Path to image file
 * @returns {Object} Object containing base64 data and mimeType
 */
async function readAndConvertImage(filePath) {
  let imageData = fs.readFileSync(filePath);
  let mimeType = getMimeType(filePath);

  // Convert AVIF to JPEG (Gemini doesn't support AVIF)
  if (mimeType === 'image/avif') {
    console.log('🔄 Converting AVIF to JPEG...');
    const sharp = (await import('sharp')).default;
    imageData = await sharp(imageData).jpeg({ quality: 90 }).toBuffer();
    mimeType = 'image/jpeg';
    console.log('✅ Converted AVIF to JPEG');
  }

  return {
    base64: imageData.toString('base64'),
    mimeType: mimeType,
  };
}

/**
 * Creates prompt for full outfit scenario
 * @returns {string} Formatted prompt
 */
function createFullOutfitPrompt() {
  return `VIRTUAL TRY-ON TASK - CLOTHING EXTRACTION AND TRANSFER

INPUT IMAGES:
🖼️ IMAGE 1: Reference clothing photo (extract the outfit from this image)
🖼️ IMAGE 2: Target person photo (the person who will wear the extracted outfit)

YOUR MISSION:
Take ONLY the clothing/outfit from IMAGE 1 and digitally dress the person from IMAGE 2 with it.

DETAILED PROCESS:

STEP 1 - ANALYZE IMAGE 1 (Clothing Source):
• Identify what clothing items are visible (shirt, pants, dress, jacket, etc.)
• Note the colors, patterns, textures, and style
• Understand how the garments look and fit
• This image is ONLY for reference - you will NOT use the person or background from IMAGE 1

STEP 2 - ANALYZE IMAGE 2 (Person/Model):
• This is your BASE image - the person whose appearance you will PRESERVE
• Note their body type, pose, and positioning
• Note the background and lighting environment
• This person will remain EXACTLY the same except for their clothes

STEP 3 - CLOTHING EXTRACTION:
• Mentally extract/isolate ONLY the clothing items from IMAGE 1
• Discard everything else from IMAGE 1 (person's face, body, background)
• You are extracting: shirts, pants, dresses, jackets, skirts - whatever clothes are worn

STEP 4 - CLOTHING APPLICATION:
• Take the person from IMAGE 2 (exact same person)
• Digitally dress them with the clothing you extracted from IMAGE 1
• Adapt the clothing to fit THIS person's body size and shape
• Adjust the clothing to match THIS person's pose
• Add natural wrinkles, shadows, and fabric behavior
• Match lighting to IMAGE 2's environment

STRICT RULES - WHAT TO PRESERVE FROM IMAGE 2:
✓ The EXACT same person (face, body, identity)
✓ The EXACT same pose and body position
✓ The EXACT same background/environment
✓ The EXACT same hair, skin tone, accessories
✓ The EXACT same lighting conditions

STRICT RULES - WHAT TO CHANGE:
✗ ONLY replace the clothing with the outfit from IMAGE 1
✗ Make the extracted clothing fit naturally on the IMAGE 2 person
✗ Ensure realistic fabric draping and shadows

CRITICAL - COMMON MISTAKES TO AVOID:
❌ DO NOT output IMAGE 1 directly
❌ DO NOT replace the person from IMAGE 2 with the person from IMAGE 1
❌ DO NOT change the person's face or identity
❌ DO NOT change the background of IMAGE 2
❌ DO NOT overlay or blend the two images together
❌ DO NOT keep any part of the person from IMAGE 1

CORRECT OUTPUT:
The person from IMAGE 2 in their original environment, but now wearing the clothing style from IMAGE 1. The clothing should look like it belongs on this person, with natural fit and lighting.

Generate the virtual try-on photo now.`;
}

/**
 * Creates prompt for individual clothing items scenario
 * @param {Array<string>} clothingDescriptions - Descriptions of clothing items
 * @param {number} numberOfClothingItems - Number of clothing item images
 * @returns {string} Formatted prompt
 */
function createIndividualItemsPrompt(clothingDescriptions, numberOfClothingItems) {
  const lastImageNumber = numberOfClothingItems + 1;

  const imageList = numberOfClothingItems === 1
    ? `• IMAGE 1 = Clothing item (${clothingDescriptions[0]})`
    : clothingDescriptions.map((desc, i) => `• IMAGE ${i + 1} = Clothing item (${desc})`).join('\n');

  return `You are an expert AI fashion photo editor specializing in virtual try-on technology.

I have provided exactly ${lastImageNumber} images:
${imageList}
• IMAGE ${lastImageNumber} = The person/model (who will wear the clothes)

STEP-BY-STEP INSTRUCTIONS:
1. Analyze the first ${numberOfClothingItems} image${numberOfClothingItems > 1 ? 's' : ''}: Identify each clothing item
2. Analyze IMAGE ${lastImageNumber}: Identify the person (their body, pose, environment)
3. Generate a NEW image using IMAGE ${lastImageNumber} as the base
4. ONLY change the clothing on the person to match the items from the previous images

WHAT TO KEEP FROM IMAGE ${lastImageNumber} (DO NOT CHANGE):
✓ The person's face (exact same face)
✓ The person's body and pose
✓ The background and environment
✓ Hair style and color
✓ Skin tone
✓ Everything except the clothing

WHAT TO CHANGE:
✗ ONLY the clothing items - replace with items from the previous images
✗ Adapt each item to fit this person's body naturally
✗ Add realistic shadows, wrinkles, and fabric texture
✗ Match the lighting of IMAGE ${lastImageNumber}'s environment
✗ Make all items coordinate as a cohesive outfit

CRITICAL WARNINGS:
⚠️ DO NOT simply show the clothing images
⚠️ DO NOT replace the person's face
⚠️ DO NOT change the background
⚠️ The OUTPUT must be the PERSON from IMAGE ${lastImageNumber} wearing the CLOTHES from the other images

Generate the virtual try-on result now.`;
}
