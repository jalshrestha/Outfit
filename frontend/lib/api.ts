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
