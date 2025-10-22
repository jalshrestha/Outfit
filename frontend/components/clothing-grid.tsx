"use client"

import type { ClothingItem } from "@/types"
import { motion } from "framer-motion"
import { Check, X, ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"

interface ClothingGridProps {
  items: ClothingItem[]
  onSelectItem: (item: ClothingItem) => void
  onDeleteItem?: (item: ClothingItem) => void
  selectedItems: {
    top?: ClothingItem
    bottom?: ClothingItem
    shoes?: ClothingItem
  }
  currentFilter?: string
}

export function ClothingGrid({ items, onSelectItem, onDeleteItem, selectedItems, currentFilter = "all" }: ClothingGridProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset currentIndex when items array changes or becomes smaller than currentIndex
  useEffect(() => {
    if (items.length === 0) {
      setCurrentIndex(0)
    } else if (currentIndex >= items.length) {
      setCurrentIndex(items.length - 1)
    }
  }, [items.length, currentIndex])

  const isSelected = (item: ClothingItem) => {
    return selectedItems[item.category]?.id === item.id
  }

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

    if (isLeftSwipe && currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const goToNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-border">
        <p className="text-sm text-muted-foreground">No items yet. Upload some clothing!</p>
      </div>
    )
  }

  // For "All Items" - show single image at a time
  if (currentFilter === "all") {
    // Safety check - ensure currentIndex is valid
    const safeIndex = Math.max(0, Math.min(currentIndex, items.length - 1))
    const currentItem = items[safeIndex]

    if (!currentItem) {
      return (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-border">
          <p className="text-sm text-muted-foreground">No items yet. Upload some clothing!</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {/* Navigation Controls */}
        {items.length > 1 && (
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrev}
              disabled={safeIndex === 0}
              className="h-8 w-8 rounded-full p-0 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: items.length }).map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-all duration-200 ${
                      index === safeIndex
                        ? 'bg-primary scale-125'
                        : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground ml-2">
                {safeIndex + 1} / {items.length}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              disabled={safeIndex === items.length - 1}
              className="h-8 w-8 rounded-full p-0 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Single Image Display */}
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-gray-50 to-gray-100"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="h-96 flex items-center justify-center p-8">
            <motion.div
              key={safeIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <img
                src={currentItem.imageUrl || currentItem.image || "/placeholder.svg"}
                alt={currentItem.name}
                className="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-105"
                style={{ 
                  maxHeight: '100%', 
                  maxWidth: '100%',
                  objectFit: 'contain'
                }}
              />

              {onDeleteItem && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8 shadow-lg z-10"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteItem(currentItem)
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              )}

              {isSelected(currentItem) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black shadow-lg">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Swipe indicators */}
          {items.length > 1 && (
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

          {/* Click to select */}
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => onSelectItem(currentItem)}
          />
        </div>

        {/* Item info */}
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">{currentItem.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{currentItem.category}</p>
        </div>
      </div>
    )
  }

  // For specific categories - show horizontal list
  // Safety check - ensure currentIndex is valid
  const safeIndex = Math.max(0, Math.min(currentIndex, items.length - 1))
  const currentItem = items[safeIndex]

  if (!currentItem) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-border">
        <p className="text-sm text-muted-foreground">No items yet. Upload some clothing!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Navigation Controls */}
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrev}
            disabled={safeIndex === 0}
            className="h-8 w-8 rounded-full p-0 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {Array.from({ length: items.length }).map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-all duration-200 ${
                    index === safeIndex
                      ? 'bg-primary scale-125'
                      : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground ml-2">
              {safeIndex + 1} / {items.length}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNext}
            disabled={safeIndex === items.length - 1}
            className="h-8 w-8 rounded-full p-0 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Horizontal List Display */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-gray-50 to-gray-100"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="h-96 flex items-center justify-center p-8">
          <motion.div
            key={safeIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="relative w-full h-full flex items-center justify-center"
          >
            <img
              src={currentItem.imageUrl || currentItem.image || "/placeholder.svg"}
              alt={currentItem.name}
              className="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-105"
              style={{ 
                maxHeight: '100%', 
                maxWidth: '100%',
                objectFit: 'contain'
              }}
            />

            {onDeleteItem && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8 shadow-lg z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteItem(currentItem)
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            )}

            {isSelected(currentItem) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black shadow-lg">
                  <Check className="h-4 w-4 text-white" />
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Swipe indicators */}
        {items.length > 1 && (
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

        {/* Click to select */}
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={() => onSelectItem(currentItem)}
        />
      </div>

      {/* Item info */}
      <div className="text-center">
        <p className="text-xs font-medium text-foreground">{currentItem.name}</p>
        <p className="text-[10px] text-muted-foreground capitalize">{currentItem.category}</p>
      </div>
    </div>
  )
}
