"use client"

import { useState, useRef } from "react"
import { UploadModel } from "@/components/upload-model"
import { GenerateButton } from "@/components/generate-button"
import { generateTryOn, getImageUrl } from "@/lib/api"
import { ArrowLeft, ArrowRight, Download } from "lucide-react"
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
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const imageRef = useRef<HTMLDivElement>(null)

  // Touch/swipe handlers
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && onNextModel) {
      onNextModel()
    }
    if (isRightSwipe && onPrevModel) {
      onPrevModel()
    }
  }

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

  const handleDownload = () => {
    if (!generatedImage) return

    // Create a temporary anchor element to trigger download
    const link = document.createElement('a')
    link.href = generatedImage
    link.download = `virtual-tryon-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex-shrink-0 border-b border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">Virtual Try-On</h2>
            <p className="mt-1 text-xs text-muted-foreground">See how your outfit looks together</p>
          </div>
          <div className="flex-shrink-0">
            <UploadModel onModelImageChange={onModelImageChange} />
          </div>
        </div>
        {modelCount > 1 && (
          <div className="mt-3 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevModel}
              disabled={!onPrevModel}
              className="h-10 w-10 rounded-full p-0 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: modelCount }).map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-all duration-200 ${
                      index === currentModelIndex 
                        ? 'bg-primary scale-125' 
                        : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground ml-2">
                {currentModelIndex + 1} / {modelCount}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onNextModel}
              disabled={!onNextModel}
              className="h-10 w-10 rounded-full p-0 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <div 
          ref={imageRef}
          className="relative h-full overflow-hidden rounded-lg border border-border bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <img
              src={generatedImage || modelImage || "/placeholder.svg"}
              alt="Model"
              className="max-h-full max-w-full object-contain transition-all duration-300 ease-in-out"
              style={{
                maxHeight: '100%',
                maxWidth: '100%',
                objectFit: 'contain'
              }}
            />
          </div>

          {/* Download button - only show when there's a generated image */}
          {generatedImage && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-2 h-10 w-10 shadow-lg z-10"
              onClick={handleDownload}
              title="Download generated image"
            >
              <Download className="h-5 w-5" />
            </Button>
          )}
          
          {/* Swipe indicators */}
          {modelCount > 1 && (
            <>
              <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity duration-200">
                <div className="bg-black/20 backdrop-blur-sm rounded-full p-2">
                  <ArrowLeft className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity duration-200">
                <div className="bg-black/20 backdrop-blur-sm rounded-full p-2">
                  <ArrowRight className="h-4 w-4 text-white" />
                </div>
              </div>
            </>
          )}
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
