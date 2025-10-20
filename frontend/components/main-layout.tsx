"use client"

import { useState, useEffect } from "react"
import { LeftPanel } from "@/components/left-panel"
import { RightPanel } from "@/components/right-panel"
import type { ClothingItem } from "@/types"

export function MainLayout() {
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([])
  const [selectedItems, setSelectedItems] = useState<{
    top?: ClothingItem
    bottom?: ClothingItem
    shoes?: ClothingItem
  }>({})

  const [modelImages, setModelImages] = useState<string[]>([])
  const [currentModelIndex, setCurrentModelIndex] = useState(0)
  const modelImage = modelImages[currentModelIndex] || ''

  useEffect(() => {
    // Load clothing items from localStorage
    const saved = localStorage.getItem("clothingItems")
    if (saved) {
      const savedItems = JSON.parse(saved)
      setClothingItems(savedItems)
    }

    // Load model images from localStorage
    const savedModels = localStorage.getItem("modelImages")
    if (savedModels) {
      const parsedModels = JSON.parse(savedModels)
      if (parsedModels.length > 0) {
        setModelImages(parsedModels)
      }
    }
  }, [])

  const handleAddClothing = (item: ClothingItem) => {
    const updated = [...clothingItems, item]
    setClothingItems(updated)
    localStorage.setItem("clothingItems", JSON.stringify(updated))
  }

  const handleSelectItem = (item: ClothingItem) => {
    setSelectedItems((prev) => ({
      ...prev,
      [item.category]: prev[item.category]?.id === item.id ? undefined : item,
    }))
  }

  const handleDeleteItem = (item: ClothingItem) => {
    // Remove from clothing items
    const updated = clothingItems.filter((i) => i.id !== item.id)
    setClothingItems(updated)
    localStorage.setItem("clothingItems", JSON.stringify(updated))

    // Remove from selected items if it was selected
    setSelectedItems((prev) => {
      const newSelected = { ...prev }
      if (newSelected[item.category]?.id === item.id) {
        delete newSelected[item.category]
      }
      return newSelected
    })
  }

  const handleModelImageChange = (newImageUrl: string) => {
    // Add new model to the array and save to localStorage
    const updated = [...modelImages, newImageUrl]
    setModelImages(updated)
    setCurrentModelIndex(updated.length - 1)
    localStorage.setItem("modelImages", JSON.stringify(updated))
  }

  const handleNextModel = () => {
    setCurrentModelIndex((prev) => (prev + 1) % modelImages.length)
  }

  const handlePrevModel = () => {
    setCurrentModelIndex((prev) => (prev - 1 + modelImages.length) % modelImages.length)
  }

  return (
    <main className="h-[calc(100vh-80px)] overflow-hidden">
      <div className="grid h-full gap-4 p-4" style={{ gridTemplateColumns: "60% 40%" }}>
        <LeftPanel
          clothingItems={clothingItems}
          onAddClothing={handleAddClothing}
          onSelectItem={handleSelectItem}
          onDeleteItem={handleDeleteItem}
          selectedItems={selectedItems}
        />
        <RightPanel
          selectedItems={selectedItems}
          modelImage={modelImage}
          onModelImageChange={handleModelImageChange}
          onNextModel={handleNextModel}
          onPrevModel={handlePrevModel}
          modelCount={modelImages.length}
          currentModelIndex={currentModelIndex}
        />
      </div>
    </main>
  )
}
