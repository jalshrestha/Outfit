import type { ClothingItem } from "@/types"
import { uploadImage, categorizeClothing, generateLabel, getImageUrl } from "./api"

export const mockCategorizeClothing = async (file: File): Promise<ClothingItem> => {
  try {
    console.log('📤 Uploading clothing image...')
    // Upload the image to the backend
    const uploadResponse = await uploadImage(file)
    console.log('✅ Upload successful:', uploadResponse.url)

    console.log('🔍 Categorizing clothing...')
    // Categorize the clothing using Gemini AI
    const categorizeResponse = await categorizeClothing(uploadResponse.url)
    console.log('✅ Category:', categorizeResponse.category)

    // Map backend category to frontend category
    const categoryMap = {
      'upper_body': 'top' as const,
      'lower_body': 'bottom' as const,
      'shoes': 'shoes' as const
    }

    const category = categoryMap[categorizeResponse.category]

    console.log('🏷️  Generating descriptive label...')
    // Generate AI label for the clothing
    let itemName = 'Clothing Item'
    try {
      const labelResponse = await generateLabel(uploadResponse.url)
      itemName = labelResponse.label
      console.log('✅ Label:', itemName)
    } catch (error) {
      console.error('Label generation failed, using default')
    }

    return {
      id: Date.now().toString() + Math.random(),
      imageUrl: getImageUrl(uploadResponse.url),
      category,
      name: itemName,
      selected: false,
    }
  } catch (error) {
    console.error('❌ Error processing clothing:', error)
    throw new Error('Failed to process clothing item')
  }
}
