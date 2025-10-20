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
  }
}

export function LeftPanel({ clothingItems, onAddClothing, onSelectItem, onDeleteItem, selectedItems }: LeftPanelProps) {
  const [filter, setFilter] = useState<CategoryFilter>("all")

  const filteredItems = filter === "all" ? clothingItems : clothingItems.filter((item) => item.category === filter)

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex-shrink-0 border-b border-border p-4">
        <h2 className="font-serif text-2xl font-bold text-foreground">Your Wardrobe</h2>
        <p className="mt-1 text-xs text-muted-foreground">Upload and organize your clothing items</p>
      </div>

      <div className="flex-shrink-0 border-b border-border p-4">
        <UploadGarment onAddClothing={onAddClothing} />
      </div>

      <div className="flex-shrink-0 border-b border-border p-4">
        <Filters currentFilter={filter} onFilterChange={setFilter} />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <ClothingGrid items={filteredItems} onSelectItem={onSelectItem} onDeleteItem={onDeleteItem} selectedItems={selectedItems} />
      </div>
    </div>
  )
}
