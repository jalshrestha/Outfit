"use client"

import { useState, useEffect } from "react"
import { LeftPanel } from "@/components/left-panel"
import { RightPanel } from "@/components/right-panel"
import { OutfitHistory } from "@/components/outfit-history"
import { TrendingOutfits } from "@/components/trending-outfits"
import { MobileTabBar } from "@/components/mobile-tab-bar"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { StatsDashboard } from "@/components/stats-dashboard"
import { RecentOutfitsCarousel } from "@/components/recent-outfits-carousel"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { getClothingItems, addClothingItem, deleteClothingItem, getModelImages, addModelImage, getSavedOutfits, migrateLocalStorageToDatabase, SavedOutfitData } from "@/lib/api"
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
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfitData[]>([])
  const [activeTab, setActiveTab] = useState("wardrobe")
  const [mobilePanelView, setMobilePanelView] = useState<'wardrobe' | 'model'>('wardrobe')

  useEffect(() => {
    // Migrate localStorage data to database (one-time)
    const migrateData = async () => {
      try {
        await migrateLocalStorageToDatabase()
      } catch (error) {
        console.error('Migration error:', error)
      }
    }
    migrateData()

    // Load clothing items from database
    const loadClothingItems = async () => {
      try {
        const items = await getClothingItems()
        // Normalize categories when loading
        const normalizedItems = items.map((item: any) => ({
          ...item,
          category: ((String(item.category) === "full_outfit" || item.category === "full-outfit") ? "full-outfit" : item.category) as ClothingItem['category']
        }))
        setClothingItems(normalizedItems)
      } catch (error) {
        console.error('Error loading clothing items:', error)
      }
    }
    loadClothingItems()

    // Load model images from database
    const loadModelImages = async () => {
      try {
        const images = await getModelImages()
        if (images.length > 0) {
          setModelImages(images)
        }
      } catch (error) {
        console.error('Error loading model images:', error)
      }
    }
    loadModelImages()
  }, [])

  const handleAddClothing = async (item: ClothingItem) => {
    // Ensure category is normalized
    const normalizedItem = {
      ...item,
      category: ((String(item.category) === "full_outfit" || item.category === "full-outfit") ? "full-outfit" : item.category) as ClothingItem['category']
    }

    // Update local state immediately
    setClothingItems(prev => [...prev, normalizedItem])

    // Save to database
    try {
      await addClothingItem({
        id: normalizedItem.id,
        name: normalizedItem.name,
        imageUrl: normalizedItem.imageUrl || normalizedItem.image || '',
        category: normalizedItem.category,
        color: normalizedItem.color,
        brand: normalizedItem.brand,
      })
    } catch (error) {
      console.error('Error adding clothing item:', error)
    }
  }

  const handleSelectItem = (item: ClothingItem) => {
    setSelectedItems((prev) => ({
      ...prev,
      [item.category]: prev[item.category]?.id === item.id ? undefined : item,
    }))
  }

  const handleDeleteItem = async (item: ClothingItem) => {
    // Remove from local state immediately
    setClothingItems(prev => prev.filter((i) => i.id !== item.id))

    // Remove from selected items if it was selected
    setSelectedItems((prev) => {
      const newSelected = { ...prev }
      if (newSelected[item.category]?.id === item.id) {
        delete newSelected[item.category]
      }
      return newSelected
    })

    // Delete from database
    try {
      await deleteClothingItem(item.id)
    } catch (error) {
      console.error('Error deleting clothing item:', error)
    }
  }

  const handleModelImageChange = async (newImageUrl: string) => {
    // Add new model to local state immediately
    const updated = [...modelImages, newImageUrl]
    setModelImages(updated)
    setCurrentModelIndex(updated.length - 1)

    // Save to database
    try {
      await addModelImage(newImageUrl)
    } catch (error) {
      console.error('Error adding model image:', error)
    }
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
    // Note: Model deletion from DB would need the model ID, which we'd need to track

    // Adjust current index
    if (updated.length === 0) {
      setCurrentModelIndex(0)
    } else if (currentModelIndex >= updated.length) {
      setCurrentModelIndex(updated.length - 1)
    }
  }

  const handleOutfitSaved = async () => {
    // Trigger history refresh
    setHistoryRefreshKey(prev => prev + 1)
    try {
      const outfits = await getSavedOutfits()
      setSavedLooks(outfits.length)
    } catch {
      // ignore errors
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
    const loadSavedLooksCount = async () => {
      try {
        const outfits = await getSavedOutfits()
        setSavedLooks(outfits.length)
        setSavedOutfits(outfits)
      } catch {
        // ignore errors
      }
    }
    loadSavedLooksCount()
  }, [])

  // Mobile Panel Toggle Component
  const MobilePanelToggle = () => (
    <div className="flex gap-2 p-3 lg:hidden border-b border-[var(--panel-border)]">
      <button
        onClick={() => setMobilePanelView('wardrobe')}
        className={cn(
          "flex-1 h-11 rounded-xl font-medium text-sm transition-all touch-manipulation",
          mobilePanelView === 'wardrobe'
            ? "bg-[var(--accent-foreground)] text-white shadow-md"
            : "bg-[var(--panel-surface)] text-[var(--shell-foreground)]/70 border border-[var(--panel-border)]"
        )}
      >
        👔 Wardrobe
      </button>
      <button
        onClick={() => setMobilePanelView('model')}
        className={cn(
          "flex-1 h-11 rounded-xl font-medium text-sm transition-all touch-manipulation",
          mobilePanelView === 'model'
            ? "bg-[var(--accent-foreground)] text-white shadow-md"
            : "bg-[var(--panel-surface)] text-[var(--shell-foreground)]/70 border border-[var(--panel-border)]"
        )}
      >
        👤 Model
      </button>
    </div>
  )

  return (
    <TooltipProvider>
      <main id="studio" className="relative mx-auto flex h-full w-full max-w-6xl flex-1 min-h-0 flex-col overflow-y-auto lg:overflow-hidden pb-[76px] lg:pb-2">
        {/* Header Section - Hidden on mobile to save space */}
        <div className="hidden lg:flex mb-4 flex-col gap-2 text-[var(--shell-foreground)]/80 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--shell-foreground)]/50">Couture Engine</p>
            <h2 className="text-2xl font-semibold leading-tight text-[var(--shell-foreground)]">Wardrobe Composer & Virtual Try-On</h2>
          </div>
          <div className="flex items-center gap-6 text-[11px] uppercase tracking-[0.3em] text-[var(--shell-foreground)]/60">
            <div className="text-center">
              <p className="text-[11px] text-[var(--shell-foreground)]/50">Model slots</p>
              <p className="text-lg font-medium text-[var(--shell-foreground)]">{modelImages.length || 0}/10</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] text-[var(--shell-foreground)]/50">Looks saved</p>
              <p className="text-lg font-medium text-[var(--shell-foreground)]">{savedLooks}</p>
            </div>
          </div>
        </div>
        <div className="relative flex-1 min-h-0 lg:min-h-0">
          <div className="pointer-events-none absolute inset-0 rounded-[32px] border border-[var(--frame-border)] bg-gradient-to-br from-white/20 via-white/5 to-transparent opacity-40 dark:from-white/10 dark:via-white/5" />
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="relative z-10 flex h-full flex-col rounded-[32px] border border-[var(--frame-border)] bg-[var(--frame-surface)] shadow-[var(--frame-shadow)] backdrop-blur-3xl"
          >
            <TabsContent value="wardrobe" className="m-0 flex-1 min-h-0 overflow-hidden px-2 sm:px-3 pb-2 pt-1">
              {/* Mobile: Toggle between panels */}
              <div className="flex h-full flex-col lg:hidden overflow-y-auto">
                <MobilePanelToggle />
                <div className="flex-1 overflow-y-auto">
                  {mobilePanelView === 'wardrobe' ? (
                    <LeftPanel
                      clothingItems={clothingItems}
                      onAddClothing={handleAddClothing}
                      onSelectItem={handleSelectItem}
                      onDeleteItem={handleDeleteItem}
                      selectedItems={selectedItems}
                    />
                  ) : (
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
                  )}
                </div>
              </div>

              {/* Desktop: Two-panel grid */}
              <div className="hidden lg:grid lg:h-full lg:min-h-0 lg:gap-4 lg:grid-cols-[0.56fr_0.44fr]">
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

            <TabsContent value="trending" id="section-trending" className="m-0 flex-1 min-h-0 overflow-hidden px-4 pb-4 pt-3">
              <TrendingOutfits />
            </TabsContent>

            <TabsContent value="history" id="section-history" className="m-0 flex-1 min-h-0 overflow-hidden px-4 pb-4 pt-3">
              <OutfitHistory key={historyRefreshKey} onRefresh={() => setHistoryRefreshKey(prev => prev + 1)} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Mobile Tab Bar */}
        <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </main>
    </TooltipProvider>
  )
}
