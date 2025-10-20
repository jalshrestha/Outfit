"use client"

import type { ClothingItem } from "@/types"
import { motion } from "framer-motion"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ClothingGridProps {
  items: ClothingItem[]
  onSelectItem: (item: ClothingItem) => void
  onDeleteItem?: (item: ClothingItem) => void
  selectedItems: {
    top?: ClothingItem
    bottom?: ClothingItem
    shoes?: ClothingItem
  }
}

export function ClothingGrid({ items, onSelectItem, onDeleteItem, selectedItems }: ClothingGridProps) {
  const isSelected = (item: ClothingItem) => {
    return selectedItems[item.category]?.id === item.id
  }

  if (items.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-border">
        <p className="text-sm text-muted-foreground">No items yet. Upload some clothing!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => onSelectItem(item)}
          className="group relative cursor-pointer overflow-hidden rounded-lg border border-border bg-white shadow-sm transition-all duration-300 hover:shadow-lg"
        >
          <div className="aspect-square overflow-hidden bg-white p-6">
            <img
              src={item.imageUrl || item.image || "/placeholder.svg"}
              alt={item.name}
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
            />
          </div>

          {onDeleteItem && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteItem(item)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {isSelected(item) && (
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

          <div className="border-t border-border bg-white p-2">
            <p className="truncate text-xs font-medium text-foreground">{item.name}</p>
            <p className="truncate text-[10px] capitalize text-muted-foreground">{item.category}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
