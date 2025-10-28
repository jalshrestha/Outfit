const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface UploadResponse {
  url: string
}

export interface CategorizeResponse {
  category: 'upper_body' | 'lower_body' | 'shoes'
}

export interface LabelResponse {
  label: string
}

export interface TryOnResponse {
  resultUrl: string
}

export interface ClothingItems {
  upper_body?: string
  lower_body?: string
  shoes?: string
  full_outfit?: string
}

/**
 * Upload an image file to the backend
 */
export async function uploadImage(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Failed to upload image')
  }

  return response.json()
}

/**
 * Categorize a clothing item using Gemini AI
 */
export async function categorizeClothing(localPath: string): Promise<CategorizeResponse> {
  const response = await fetch(`${API_BASE_URL}/api/categorize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ localPath }),
  })

  if (!response.ok) {
    throw new Error('Failed to categorize clothing')
  }

  return response.json()
}

/**
 * Generate a descriptive label for clothing using AI
 */
export async function generateLabel(localPath: string): Promise<LabelResponse> {
  const response = await fetch(`${API_BASE_URL}/api/label`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ localPath }),
  })

  if (!response.ok) {
    throw new Error('Failed to generate label')
  }

  return response.json()
}

/**
 * Generate virtual try-on result by compositing images
 */
export async function generateTryOn(
  modelUrl: string,
  clothingItems: ClothingItems
): Promise<TryOnResponse> {
  const response = await fetch(`${API_BASE_URL}/api/try-on`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ modelUrl, clothingItems }),
  })

  if (!response.ok) {
    throw new Error('Failed to generate try-on')
  }

  return response.json()
}

/**
 * Get the full URL for an uploaded image
 */
export function getImageUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  return `${baseUrl}${path}`
}

/**
 * Rate an outfit using AI
 */
export async function rateOutfit(outfitData: {
  modelUrl: string
  clothingItems: ClothingItems
}): Promise<{ rating: number; style: string; occasion: string; tags: string[] }> {
  const response = await fetch(`${API_BASE_URL}/api/rate-outfit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(outfitData),
  })

  if (!response.ok) {
    throw new Error('Failed to rate outfit')
  }

  return response.json()
}

// ============= LocalStorage Helper Functions =============

const SAVED_OUTFITS_KEY = 'savedOutfits'

/**
 * Get all saved outfits from localStorage
 */
export function getSavedOutfits(): Array<{
  id: string
  name: string
  timestamp: number
  generatedImageUrl: string
  modelImageUrl: string
  clothingItems: {
    top?: any
    bottom?: any
    shoes?: any
  }
  metadata: {
    aiRating: number
    style: string
    occasion: string
    tags: string[]
  }
  isFavorite: boolean
}> {
  if (typeof window === 'undefined') return []

  try {
    const saved = localStorage.getItem(SAVED_OUTFITS_KEY)
    return saved ? JSON.parse(saved) : []
  } catch (error) {
    console.error('Error loading saved outfits:', error)
    return []
  }
}

/**
 * Save a new outfit to localStorage
 */
export function saveOutfit(outfit: {
  id: string
  name: string
  timestamp: number
  generatedImageUrl: string
  modelImageUrl: string
  clothingItems: {
    top?: any
    bottom?: any
    shoes?: any
  }
  metadata: {
    aiRating: number
    style: string
    occasion: string
    tags: string[]
  }
  isFavorite: boolean
}): void {
  if (typeof window === 'undefined') return

  try {
    const outfits = getSavedOutfits()
    outfits.unshift(outfit) // Add to beginning of array
    localStorage.setItem(SAVED_OUTFITS_KEY, JSON.stringify(outfits))
  } catch (error) {
    console.error('Error saving outfit:', error)
    throw error
  }
}

/**
 * Delete a saved outfit from localStorage
 */
export function deleteSavedOutfit(outfitId: string): void {
  if (typeof window === 'undefined') return

  try {
    const outfits = getSavedOutfits()
    const filtered = outfits.filter(outfit => outfit.id !== outfitId)
    localStorage.setItem(SAVED_OUTFITS_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Error deleting outfit:', error)
    throw error
  }
}

/**
 * Toggle favorite status of a saved outfit
 */
export function toggleOutfitFavorite(outfitId: string): void {
  if (typeof window === 'undefined') return

  try {
    const outfits = getSavedOutfits()
    const updated = outfits.map(outfit =>
      outfit.id === outfitId
        ? { ...outfit, isFavorite: !outfit.isFavorite }
        : outfit
    )
    localStorage.setItem(SAVED_OUTFITS_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Error toggling favorite:', error)
    throw error
  }
}

/**
 * Update outfit name
 */
export function updateOutfitName(outfitId: string, newName: string): void {
  if (typeof window === 'undefined') return

  try {
    const outfits = getSavedOutfits()
    const updated = outfits.map(outfit =>
      outfit.id === outfitId
        ? { ...outfit, name: newName }
        : outfit
    )
    localStorage.setItem(SAVED_OUTFITS_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Error updating outfit name:', error)
    throw error
  }
}
