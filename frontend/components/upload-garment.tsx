"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, Loader2, ImagePlus } from "lucide-react"
import type { ClothingItem } from "@/types"
import { mockCategorizeClothing } from "@/lib/mock-ai"
import { Button } from "@/components/ui/button"

interface UploadGarmentProps {
  onAddClothing: (item: ClothingItem) => void
}

export function UploadGarment({ onAddClothing }: UploadGarmentProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      setIsProcessing(true)
      setProgress({ current: 0, total: acceptedFiles.length })

      for (let i = 0; i < acceptedFiles.length; i++) {
        setProgress({ current: i + 1, total: acceptedFiles.length })
        const item = await mockCategorizeClothing(acceptedFiles[i])
        onAddClothing(item)
      }

      setIsProcessing(false)
      setProgress({ current: 0, total: 0 })
    },
    [onAddClothing],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    multiple: true,
  })

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="hover:scale-[1.02] active:scale-[0.98]"
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            <span className="text-xs">{progress.current}/{progress.total}</span>
          </>
        ) : (
          <>
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Upload</span>
            <ImagePlus className="h-3.5 w-3.5 sm:hidden" />
          </>
        )}
      </Button>
    </div>
  )
}

