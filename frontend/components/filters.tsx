"use client"

import type { CategoryFilter } from "@/types"
import { motion } from "framer-motion"

interface FiltersProps {
  currentFilter: CategoryFilter | "favorites"
  onFilterChange: (filter: CategoryFilter | "favorites") => void
}

const filters: { value: CategoryFilter | "favorites"; label: string }[] = [
  { value: "all", label: "All Items" },
  { value: "favorites", label: "♥ Favorites" },
  { value: "top", label: "Tops" },
  { value: "bottom", label: "Bottoms" },
  { value: "shoes", label: "Shoes" },
  { value: "full-outfit", label: "Full Outfits" },
]

export function Filters({ currentFilter, onFilterChange }: FiltersProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {filters.map((filter, index) => (
        <motion.button
          key={filter.value}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03, duration: 0.2 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onFilterChange(filter.value)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${currentFilter === filter.value
            ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] shadow-md"
            : "border border-[var(--panel-border)] bg-[var(--panel-surface)] text-[var(--shell-foreground)]/70 hover:bg-[var(--panel-hover)]/60"
            }`}
        >
          {filter.label}
        </motion.button>
      ))}
    </div>
  )
}

