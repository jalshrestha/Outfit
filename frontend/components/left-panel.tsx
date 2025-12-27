"use client"

import { UploadGarment } from "@/components/upload-garment"
import { ClothingGrid } from "@/components/clothing-grid"
import { Filters } from "@/components/filters"
import type { ClothingItem, CategoryFilter } from "@/types"
import { useState } from "react"

interface LeftPanelProps {
  clothingItems: ClothingItem[]
  onAddClothing: (item: ClothingItem) => void
  onSelectItem: (item: ClothingItem) => void
  onDeleteItem: (item: ClothingItem) => void
  selectedItems: {
    top?: ClothingItem
    bottom?: ClothingItem
    shoes?: ClothingItem
    "full-outfit"?: ClothingItem
  }
}

export function LeftPanel({ clothingItems, onAddClothing, onSelectItem, onDeleteItem, selectedItems }: LeftPanelProps) {
  const [filter, setFilter] = useState<CategoryFilter>("all")

  // Normalize all items to ensure consistent category format
  const normalizedItems = clothingItems.map(item => ({
    ...item,
    category: ((String(item.category) === "full_outfit" || item.category === "full-outfit") ? "full-outfit" : item.category) as ClothingItem['category']
  }))

  const filteredItems = filter === "all"
    ? normalizedItems
    : normalizedItems.filter((item) => {
      return item.category === filter
    })

  return (
    <div className="flex lg:h-full min-h-0 flex-col overflow-visible lg:overflow-hidden rounded-[28px] border border-[var(--panel-border)] bg-[var(--panel-surface)] text-[var(--shell-foreground)] shadow-[var(--frame-shadow)]/2 backdrop-blur-2xl">
      <div className="flex-shrink-0 border-b border-[var(--panel-divider)] p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-[var(--shell-foreground)]/50">Wardrobe</p>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[var(--shell-foreground)]">Curate your pieces</h2>
            <p className="mt-1 text-xs sm:text-sm text-[var(--shell-foreground)]/60 line-clamp-2 sm:line-clamp-none">Upload garments and let AI categorize fabric, cut, and vibe.</p>
          </div>
          <div className="flex-shrink-0">
            <UploadGarment onAddClothing={onAddClothing} />
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 border-b border-[var(--panel-divider)] p-2 sm:p-3">
        <Filters currentFilter={filter} onFilterChange={setFilter} />
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        <ClothingGrid items={filteredItems} onSelectItem={onSelectItem} onDeleteItem={onDeleteItem} selectedItems={selectedItems} currentFilter={filter} />
      </div>
    </div>
  )
}
