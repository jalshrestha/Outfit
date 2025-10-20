"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, Loader2 } from "lucide-react"
import type { ClothingItem } from "@/types"
import { mockCategorizeClothing } from "@/lib/mock-ai"
import { Button } from "@/components/ui/button"

interface UploadGarmentProps {
  onAddClothing: (item: ClothingItem) => void
}

export function UploadGarment({ onAddClothing }: UploadGarmentProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsProcessing(true)

      for (const file of acceptedFiles) {
        const item = await mockCategorizeClothing(file)
        onAddClothing(item)
      }

      setIsProcessing(false)
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
        variant="outline"
        className="w-full border-2 border-dashed py-6 hover:border-primary hover:bg-primary/5 bg-transparent"
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing clothing...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {isDragActive ? "Drop here" : "Upload Clothing"}
          </>
        )}
      </Button>
    </div>
  )
}
