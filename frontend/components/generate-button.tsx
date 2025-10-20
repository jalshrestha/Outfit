"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

interface GenerateButtonProps {
  onGenerate: () => Promise<void>
  disabled: boolean
}

export function GenerateButton({ onGenerate, disabled }: GenerateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleClick = async () => {
    setIsGenerating(true)
    try {
      await onGenerate()
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <motion.div whileHover={{ scale: disabled ? 1 : 1.02 }} whileTap={{ scale: disabled ? 1 : 0.98 }}>
      <Button
        onClick={handleClick}
        disabled={disabled || isGenerating}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Generating Outfit...
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
