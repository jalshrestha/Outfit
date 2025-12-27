"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

interface GenerateButtonProps {
  onGenerate: () => Promise<void>
  disabled: boolean
  onLoadingChange?: (isLoading: boolean) => void
}

export function GenerateButton({ onGenerate, disabled, onLoadingChange }: GenerateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleClick = async () => {
    setIsGenerating(true)
    onLoadingChange?.(true)
    try {
      await onGenerate()
    } finally {
      setIsGenerating(false)
      onLoadingChange?.(false)
    }
  }

  return (
    <motion.div whileHover={{ scale: disabled ? 1 : 1.02 }} whileTap={{ scale: disabled ? 1 : 0.98 }}>
      <Button
        onClick={handleClick}
        disabled={disabled || isGenerating}
        className="w-full relative overflow-hidden"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span className="animate-pulse">Generating Outfit...</span>
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            Generate Outfit
          </>
        )}
      </Button>
    </motion.div>
  )
}
