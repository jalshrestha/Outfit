"use client"

import { useState, useEffect } from "react"
import { LeftPanel } from "@/components/left-panel"
import { RightPanel } from "@/components/right-panel"
import { OutfitHistory } from "@/components/outfit-history"
import { TrendingOutfits } from "@/components/trending-outfits"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shirt, History, TrendingUp } from "lucide-react"
import type { ClothingItem } from "@/types"

export function MainLayout() {
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([])
  const [selectedItems, setSelectedItems] = useState<{
    top?: ClothingItem
    bottom?: ClothingItem
    shoes?: ClothingItem
    "full-outfit"?: ClothingItem
  }>({})

  const [modelImages, setModelImages] = useState<string[]>([])
  const [currentModelIndex, setCurrentModelIndex] = useState(0)
  const modelImage = modelImages[currentModelIndex] || ''
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)

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

  const handleDeleteModel = () => {
    if (modelImages.length === 0) return

    // Remove the current model from the array
    const updated = modelImages.filter((_, index) => index !== currentModelIndex)
    setModelImages(updated)
    localStorage.setItem("modelImages", JSON.stringify(updated))

    // Adjust current index
    if (updated.length === 0) {
      setCurrentModelIndex(0)
    } else if (currentModelIndex >= updated.length) {
      setCurrentModelIndex(updated.length - 1)
    }
  }

  const handleOutfitSaved = () => {
    // Trigger history refresh
    setHistoryRefreshKey(prev => prev + 1)
  }

  return (
    <main className="h-[calc(100vh-80px)] overflow-hidden">
      <Tabs defaultValue="wardrobe" className="h-full flex flex-col">
        <div className="flex-shrink-0 border-b border-border px-4">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="wardrobe" className="gap-2">
              <Shirt className="h-4 w-4" />
              Wardrobe & Try-On
            </TabsTrigger>
            <TabsTrigger value="trending" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending Outfits
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Outfit History
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="wardrobe" className="flex-1 overflow-hidden m-0 p-4">
          <div className="grid h-full gap-4" style={{ gridTemplateColumns: "60% 40%" }}>
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
              onDeleteModel={handleDeleteModel}
              modelCount={modelImages.length}
              currentModelIndex={currentModelIndex}
              onOutfitSaved={handleOutfitSaved}
            />
          </div>
        </TabsContent>

        <TabsContent value="trending" className="flex-1 m-0 p-4 overflow-hidden">
          <TrendingOutfits />
        </TabsContent>

        <TabsContent value="history" className="flex-1 m-0 p-4 overflow-hidden flex flex-col">
          <OutfitHistory key={historyRefreshKey} onRefresh={() => setHistoryRefreshKey(prev => prev + 1)} />
        </TabsContent>
      </Tabs>
    </main>
  )
}
