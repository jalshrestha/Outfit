"use client"

import { useState, useEffect } from "react"
import { LeftPanel } from "@/components/left-panel"
import { RightPanel } from "@/components/right-panel"
import { OutfitHistory } from "@/components/outfit-history"
import { TrendingOutfits } from "@/components/trending-outfits"
import { Tabs, TabsContent } from "@/components/ui/tabs"
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
  const [savedLooks, setSavedLooks] = useState(0)
  const [activeTab, setActiveTab] = useState("wardrobe")

  useEffect(() => {
    // Load clothing items from localStorage
    const saved = localStorage.getItem("clothingItems")
    if (saved) {
      const savedItems = JSON.parse(saved)
      // Normalize categories when loading
      const normalizedItems = savedItems.map((item: ClothingItem) => ({
        ...item,
        category: ((String(item.category) === "full_outfit" || item.category === "full-outfit") ? "full-outfit" : item.category) as ClothingItem['category']
      }))
      setClothingItems(normalizedItems)
      // Update localStorage with normalized categories
      localStorage.setItem("clothingItems", JSON.stringify(normalizedItems))
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
    // Ensure category is normalized
    const normalizedItem = {
      ...item,
      category: ((String(item.category) === "full_outfit" || item.category === "full-outfit") ? "full-outfit" : item.category) as ClothingItem['category']
    }
    
    const updated = [...clothingItems, normalizedItem]
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
    try {
      const saved = localStorage.getItem("savedOutfits")
      if (saved) {
        const parsed = JSON.parse(saved)
        setSavedLooks(parsed.length)
      }
    } catch {
      // ignore storage errors
    }
  }

  useEffect(() => {
    const handleNavigation = (event: Event) => {
      const customEvent = event as CustomEvent<string>
      if (customEvent.detail) {
        setActiveTab(customEvent.detail)
      }
    }

    window.addEventListener("outfit:navigate", handleNavigation as EventListener)
    return () => window.removeEventListener("outfit:navigate", handleNavigation as EventListener)
  }, [])

  useEffect(() => {
    const targetId = activeTab === "wardrobe" ? "studio" : `section-${activeTab}`
    const target = document.getElementById(targetId)
    target?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [activeTab])

  useEffect(() => {
    try {
      const saved = localStorage.getItem("savedOutfits")
      if (saved) {
        const parsed = JSON.parse(saved)
        setSavedLooks(parsed.length)
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  return (
    <main id="studio" className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col pb-8">
      <div className="mb-6 flex flex-col gap-3 text-[var(--shell-foreground)]/80 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--shell-foreground)]/50">Couture Engine</p>
          <h2 className="text-3xl font-semibold text-[var(--shell-foreground)]">Wardrobe Composer & Virtual Try-On</h2>
        </div>
        <div className="flex items-center gap-6 text-xs uppercase tracking-[0.3em] text-[var(--shell-foreground)]/60">
          <div>
            <p className="text-[11px] text-[var(--shell-foreground)]/50">Model slots</p>
            <p className="text-base text-[var(--shell-foreground)]">{modelImages.length || 0}/10</p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--shell-foreground)]/50">Looks saved</p>
            <p className="text-base text-[var(--shell-foreground)]">{savedLooks}</p>
          </div>
        </div>
      </div>
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-0 rounded-[32px] border border-[var(--frame-border)] bg-gradient-to-br from-white/20 via-white/5 to-transparent opacity-40 dark:from-white/10 dark:via-white/5" />
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="relative z-10 flex h-[calc(100vh-220px)] flex-col rounded-[32px] border border-[var(--frame-border)] bg-[var(--frame-surface)] shadow-[var(--frame-shadow)] backdrop-blur-3xl"
        >
          <TabsContent value="wardrobe" className="m-0 flex-1 overflow-hidden px-6 pb-6 pt-6">
            <div className="grid h-full gap-6 lg:grid-cols-[0.6fr_0.4fr]">
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

          <TabsContent value="trending" id="section-trending" className="m-0 flex-1 overflow-hidden px-6 pb-6 pt-6">
            <TrendingOutfits />
          </TabsContent>

          <TabsContent value="history" id="section-history" className="m-0 flex-1 overflow-hidden px-6 pb-6 pt-6">
            <OutfitHistory key={historyRefreshKey} onRefresh={() => setHistoryRefreshKey(prev => prev + 1)} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
