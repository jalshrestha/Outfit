"use client"

import { UploadGarment } from "@/components/upload-garment"
import { ClothingGrid } from "@/components/clothing-grid"
import { Filters } from "@/components/filters"
import type { ClothingItem, CategoryFilter } from "@/types"
import { useState, useMemo } from "react"

interface LeftPanelProps {
  clothingItems: ClothingItem[]
  onAddClothing: (item: ClothingItem) => void
  onSelectItem: (item: ClothingItem) => void
  onDeleteItem: (item: ClothingItem) => void
  onToggleFavorite?: (item: ClothingItem) => void
  selectedItems: {
    top?: ClothingItem
    bottom?: ClothingItem
    shoes?: ClothingItem
    "full-outfit"?: ClothingItem
  }
}

export function LeftPanel({ clothingItems, onAddClothing, onSelectItem, onDeleteItem, onToggleFavorite, selectedItems }: LeftPanelProps) {
  const [filter, setFilter] = useState<CategoryFilter | "favorites">("all")

  // Normalize all items to ensure consistent category format
  const normalizedItems = useMemo(() => clothingItems.map(item => ({
    ...item,
    category: ((String(item.category) === "full_outfit" || item.category === "full-outfit") ? "full-outfit" : item.category) as ClothingItem['category']
  })), [clothingItems])

  // Filter by category or favorites
  const filteredItems = useMemo(() => {
    if (filter === "all") return normalizedItems
    if (filter === "favorites") return normalizedItems.filter((item) => item.isFavorite)
    return normalizedItems.filter((item) => item.category === filter)
  }, [normalizedItems, filter])

  return (
    <div className="flex lg:h-full min-h-0 flex-col overflow-visible lg:overflow-hidden rounded-[28px] border border-[var(--panel-border)] bg-[var(--panel-surface)] text-[var(--shell-foreground)] shadow-[var(--frame-shadow)]/2 backdrop-blur-2xl">
      {/* Compact Header */}
      <div className="flex-shrink-0 border-b border-[var(--panel-divider)] px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--shell-foreground)]/50">Wardrobe</p>
            <h2 className="font-serif text-lg font-semibold text-[var(--shell-foreground)] truncate">Curate your pieces</h2>
          </div>
          <div className="flex-shrink-0">
            <UploadGarment onAddClothing={onAddClothing} />
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex-shrink-0 border-b border-[var(--panel-divider)] px-2 py-1.5">
        <Filters currentFilter={filter} onFilterChange={setFilter} />
      </div>

      {/* Clothing Grid - takes remaining space */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3">
        <ClothingGrid items={filteredItems} onSelectItem={onSelectItem} onDeleteItem={onDeleteItem} onToggleFavorite={onToggleFavorite} selectedItems={selectedItems} currentFilter={filter} />
      </div>
    </div>
  )
}

