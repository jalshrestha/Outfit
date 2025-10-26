export interface ClothingItem {
  id: string
  image?: string
  imageUrl?: string
  category: "top" | "bottom" | "shoes"
  name: string
  selected?: boolean
  color?: string
  brand?: string
}

export interface Outfit {
  id: string
  top?: ClothingItem
  bottom?: ClothingItem
  shoes?: ClothingItem
  modelImage: string
  timestamp: Date
  score: number
  style: string
}

export interface SavedOutfit {
  id: string
  name: string
  timestamp: number
  generatedImageUrl: string
  modelImageUrl: string
  clothingItems: {
    top?: ClothingItem
    bottom?: ClothingItem
    shoes?: ClothingItem
  }
  metadata: {
    aiRating: number
    style: string
    occasion: string
    tags: string[]
  }
  isFavorite: boolean
}

export type CategoryFilter = "all" | "top" | "bottom" | "shoes"
