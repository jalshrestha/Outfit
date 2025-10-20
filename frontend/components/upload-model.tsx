"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { uploadImage, getImageUrl } from "@/lib/api"

interface UploadModelProps {
  onModelImageChange: (image: string) => void
}

export function UploadModel({ onModelImageChange }: UploadModelProps) {
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        setIsUploading(true)
        try {
          // Upload to backend
          const response = await uploadImage(file)
          // Get the full URL from backend
          const imageUrl = getImageUrl(response.url)
          onModelImageChange(imageUrl)
        } catch (error) {
          console.error('Error uploading model image:', error)
          // Fallback to base64 if upload fails
          const reader = new FileReader()
          reader.onload = () => {
            onModelImageChange(reader.result as string)
          }
          reader.readAsDataURL(file)
        } finally {
          setIsUploading(false)
        }
      }
    },
    [onModelImageChange],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    multiple: false,
  })

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <Button type="button" variant="default" className="w-full py-6" disabled={isUploading}>
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {isDragActive ? "Drop here" : "Upload Model Photo"}
          </>
        )}
      </Button>
    </div>
  )
}
