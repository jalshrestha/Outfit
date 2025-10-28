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
    <div className="flex gap-2">
      {filters.map((filter) => (
        <motion.button
          key={filter.value}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onFilterChange(filter.value)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
            currentFilter === filter.value
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-accent text-accent-foreground hover:bg-accent/80"
          }`}
        >
          {filter.label}
        </motion.button>
      ))}
    </div>
  )
}
