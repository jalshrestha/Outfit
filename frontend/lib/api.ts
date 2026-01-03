const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface UploadResponse {
  url: string
}

export interface CategorizeResponse {
  category: 'upper_body' | 'lower_body' | 'shoes' | 'full-outfit' | 'full_outfit'
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

// ============= Database API Functions =============

/**
 * Get authentication headers for API requests
 */
function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

// ---- Clothing Items ----

/**
 * Get all clothing items from database
 */
export async function getClothingItems(): Promise<Array<{
  id: string
  name: string
  imageUrl: string
  category: 'top' | 'bottom' | 'shoes' | 'full-outfit'
  color?: string
  brand?: string
}>> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {}

    const response = await fetch(`${API_BASE_URL}/api/clothing`, { headers })
    if (!response.ok) throw new Error('Failed to fetch clothing items')
    const items = await response.json()
    // Transform snake_case to camelCase
    return items.map((item: any) => ({
      id: item.id,
      name: item.name,
      imageUrl: item.image_url,
      category: item.category,
      color: item.color,
      brand: item.brand,
    }))
  } catch (error) {
    console.error('Error fetching clothing items:', error)
    return []
  }
}

/**
 * Add a clothing item to database
 */
export async function addClothingItem(item: {
  id: string
  name: string
  imageUrl: string
  category: string
  color?: string
  brand?: string
}): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/clothing`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(item),
  })
  if (!response.ok) throw new Error('Failed to add clothing item')
}

/**
 * Delete a clothing item from database
 */
export async function deleteClothingItem(id: string): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {}
  const response = await fetch(`${API_BASE_URL}/api/clothing/${id}`, {
    method: 'DELETE',
    headers,
  })
  if (!response.ok) throw new Error('Failed to delete clothing item')
}

// ---- Model Images ----

export interface ModelImage {
  id: number
  imageUrl: string
}

/**
 * Get all model images from database (returns objects with IDs)
 */
export async function getModelImages(): Promise<ModelImage[]> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {}
    const response = await fetch(`${API_BASE_URL}/api/models`, { headers })
    if (!response.ok) throw new Error('Failed to fetch model images')
    const models = await response.json()
    return models.map((m: any) => ({
      id: m.id,
      imageUrl: m.image_url
    }))
  } catch (error) {
    console.error('Error fetching model images:', error)
    return []
  }
}

/**
 * Add a model image to database
 */
export async function addModelImage(imageUrl: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/models`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ imageUrl }),
  })
  if (!response.ok) throw new Error('Failed to add model image')
}

/**
 * Delete a model image from database
 */
export async function deleteModelImage(id: number): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {}
  const response = await fetch(`${API_BASE_URL}/api/models/${id}`, {
    method: 'DELETE',
    headers,
  })
  if (!response.ok) throw new Error('Failed to delete model image')
}

// ---- Saved Outfits ----

export interface SavedOutfitData {
  id: string
  name: string
  timestamp: number
  generatedImageUrl: string
  modelImageUrl: string
  clothingItems: {
    top?: any
    bottom?: any
    shoes?: any
    fullOutfit?: any
  }
  metadata: {
    aiRating: number
    style: string
    occasion: string
    tags: string[]
  }
  isFavorite: boolean
}

/**
 * Get all saved outfits from database
 */
export async function getSavedOutfits(): Promise<SavedOutfitData[]> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {}
    const response = await fetch(`${API_BASE_URL}/api/outfits`, { headers })
    if (!response.ok) throw new Error('Failed to fetch saved outfits')
    return response.json()
  } catch (error) {
    console.error('Error loading saved outfits:', error)
    return []
  }
}

/**
 * Save a new outfit to database
 */
export async function saveOutfit(outfit: SavedOutfitData): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/outfits`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(outfit),
  })
  if (!response.ok) throw new Error('Failed to save outfit')
}

/**
 * Delete a saved outfit from database
 */
export async function deleteSavedOutfit(outfitId: string): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {}
  const response = await fetch(`${API_BASE_URL}/api/outfits/${outfitId}`, {
    method: 'DELETE',
    headers,
  })
  if (!response.ok) throw new Error('Failed to delete outfit')
}

/**
 * Toggle favorite status of a saved outfit
 */
export async function toggleOutfitFavorite(outfitId: string, currentStatus: boolean): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/outfits/${outfitId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ isFavorite: !currentStatus }),
  })
  if (!response.ok) throw new Error('Failed to toggle favorite')
}

/**
 * Update outfit name
 */
export async function updateOutfitName(outfitId: string, newName: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/outfits/${outfitId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name: newName }),
  })
  if (!response.ok) throw new Error('Failed to update outfit name')
}

// ---- User Preferences ----

/**
 * Get a preference value from database
 */
export async function getPreference(key: string): Promise<string | null> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {}
    const response = await fetch(`${API_BASE_URL}/api/preferences/${key}`, { headers })
    if (!response.ok) return null
    const data = await response.json()
    return data.value
  } catch (error) {
    console.error('Error fetching preference:', error)
    return null
  }
}

/**
 * Set a preference value in database
 */
export async function setPreference(key: string, value: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/preferences/${key}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ value }),
  })
  if (!response.ok) throw new Error('Failed to set preference')
}

// ---- Data Migration ----

/**
 * Migrate localStorage data to database (one-time operation)
 */
export async function migrateLocalStorageToDatabase(): Promise<{ success: boolean; imported: any }> {
  if (typeof window === 'undefined') return { success: false, imported: {} }

  try {
    // Gather all localStorage data
    const clothingItems = JSON.parse(localStorage.getItem('clothingItems') || '[]')
    const modelImages = JSON.parse(localStorage.getItem('modelImages') || '[]')
    const savedOutfits = JSON.parse(localStorage.getItem('savedOutfits') || '[]')
    const preferences: Record<string, string> = {}

    if (localStorage.getItem('hasSeenIntro')) {
      preferences['hasSeenIntro'] = localStorage.getItem('hasSeenIntro') || ''
    }

    // Send to backend
    const response = await fetch(`${API_BASE_URL}/api/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clothingItems, modelImages, savedOutfits, preferences }),
    })

    if (!response.ok) throw new Error('Migration failed')

    const result = await response.json()

    // Clear localStorage after successful migration
    if (result.success) {
      localStorage.removeItem('clothingItems')
      localStorage.removeItem('modelImages')
      localStorage.removeItem('savedOutfits')
      console.log('✅ Data migrated to database:', result.imported)
    }

    return result
  } catch (error) {
    console.error('Error migrating data:', error)
    return { success: false, imported: {} }
  }
}

/**
 * Check database health
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`)
    return response.ok
  } catch {
    return false
  }
}

// ============= PLANNED OUTFITS (CALENDAR) =============

export interface PlannedOutfitData {
  id?: number
  date: string
  outfit_id: string
}

/**
 * Get all planned outfits for the calendar
 */
export async function getPlannedOutfits(): Promise<PlannedOutfitData[]> {
  const response = await fetch(`${API_BASE_URL}/api/planned-outfits`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch planned outfits')
  }

  return response.json()
}

/**
 * Save a planned outfit for a date
 */
export async function savePlannedOutfit(date: string, outfitId: string): Promise<PlannedOutfitData> {
  const response = await fetch(`${API_BASE_URL}/api/planned-outfits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ date, outfitId }),
  })

  if (!response.ok) {
    throw new Error('Failed to save planned outfit')
  }

  return response.json()
}

/**
 * Delete a planned outfit for a date
 */
export async function deletePlannedOutfit(date: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/planned-outfits/${date}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to delete planned outfit')
  }
}

/**
 * Toggle favorite on a clothing item
 */
export async function toggleClothingFavorite(itemId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/clothing/${itemId}/favorite`, {
    method: 'PATCH',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to toggle favorite')
  }

  return response.json()
}
