"use client"

import { useState } from "react"
import { UploadModel } from "@/components/upload-model"
import { GenerateButton } from "@/components/generate-button"
import { generateTryOn, getImageUrl } from "@/lib/api"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ClothingItem } from "@/types"

interface RightPanelProps {
  selectedItems: {
    top?: ClothingItem
    bottom?: ClothingItem
    shoes?: ClothingItem
  }
  modelImage: string
  onModelImageChange: (image: string) => void
  onNextModel?: () => void
  onPrevModel?: () => void
  modelCount?: number
  currentModelIndex?: number
}

export function RightPanel({
  selectedItems,
  modelImage,
  onModelImageChange,
  onNextModel,
  onPrevModel,
  modelCount = 1,
  currentModelIndex = 0
}: RightPanelProps) {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)

  const handleGenerate = async () => {
    try {
      // Extract the path from the model image URL
      const modelUrl = modelImage.includes('/uploads/')
        ? modelImage.split('/uploads/')[1]
        : modelImage

      // Build clothing items object with paths
      const clothingItems: any = {}

      if (selectedItems.top?.imageUrl) {
        const topPath = selectedItems.top.imageUrl.includes('/uploads/')
          ? '/uploads/' + selectedItems.top.imageUrl.split('/uploads/')[1]
          : selectedItems.top.imageUrl
        clothingItems.upper_body = topPath
      }

      if (selectedItems.bottom?.imageUrl) {
        const bottomPath = selectedItems.bottom.imageUrl.includes('/uploads/')
          ? '/uploads/' + selectedItems.bottom.imageUrl.split('/uploads/')[1]
          : selectedItems.bottom.imageUrl
        clothingItems.lower_body = bottomPath
      }

      if (selectedItems.shoes?.imageUrl) {
        const shoesPath = selectedItems.shoes.imageUrl.includes('/uploads/')
          ? '/uploads/' + selectedItems.shoes.imageUrl.split('/uploads/')[1]
          : selectedItems.shoes.imageUrl
        clothingItems.shoes = shoesPath
      }

      // Call the backend API to generate the try-on image
      const response = await generateTryOn(`/uploads/${modelUrl}`, clothingItems)
      const generatedImageUrl = getImageUrl(response.resultUrl)

      setGeneratedImage(generatedImageUrl)
    } catch (error) {
      console.error('Error generating outfit:', error)
      alert('Failed to generate outfit. Please try again.')
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex-shrink-0 border-b border-border p-4">
        <h2 className="font-serif text-2xl font-bold text-foreground">Virtual Try-On</h2>
        <p className="mt-1 text-xs text-muted-foreground">See how your outfit looks together</p>
      </div>

      <div className="flex-shrink-0 border-b border-border p-4">
        <div className="space-y-3">
          <UploadModel onModelImageChange={onModelImageChange} />

          {modelCount > 1 && (
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevModel}
                disabled={!onPrevModel}
                className="flex-1"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {currentModelIndex + 1} / {modelCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onNextModel}
                disabled={!onNextModel}
                className="flex-1"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <div className="relative h-full overflow-hidden rounded-lg border border-border bg-white shadow-lg">
          <img
            src={generatedImage || modelImage || "/placeholder.svg"}
            alt="Model"
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-border p-4">
        <GenerateButton
          onGenerate={handleGenerate}
          disabled={!modelImage || (!selectedItems.top && !selectedItems.bottom && !selectedItems.shoes)}
        />
      </div>
    </div>
  )
}
