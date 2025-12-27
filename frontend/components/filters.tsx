"use client"

import type { CategoryFilter } from "@/types"
import { motion } from "framer-motion"

interface FiltersProps {
  currentFilter: CategoryFilter
  onFilterChange: (filter: CategoryFilter) => void
}

const filters: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All Items" },
  { value: "top", label: "Tops" },
  { value: "bottom", label: "Bottoms" },
  { value: "shoes", label: "Shoes" },
  { value: "full-outfit", label: "Full Outfits" },
]

export function Filters({ currentFilter, onFilterChange }: FiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter, index) => (
        <motion.button
          key={filter.value}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onFilterChange(filter.value)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${currentFilter === filter.value
              ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] shadow-lg ring-2 ring-[var(--btn-primary-bg)]/20"
              : "border border-[var(--panel-border)] bg-[var(--panel-surface)] text-[var(--shell-foreground)]/70 hover:bg-[var(--panel-hover)]/60 hover:text-[var(--shell-foreground)] hover:border-[var(--shell-foreground)]/20 hover:shadow-md"
            }`}
        >
          {filter.label}
        </motion.button>
      ))}
    </div>
  )
}
