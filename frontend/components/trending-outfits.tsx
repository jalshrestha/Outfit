"use client"

import { useState, useEffect } from "react"
import { TrendingOutfit, ClothingItem } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  Plus,
  Loader2,
  RefreshCw,
  ExternalLink,
  Filter,
  Sparkles
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export function TrendingOutfits() {
  const [outfits, setOutfits] = useState<TrendingOutfit[]>([])
  const [loading, setLoading] = useState(false)
  const [classifyingId, setClassifyingId] = useState<string | null>(null)
  const [category, setCategory] = useState<"all" | "top" | "bottom" | "shoes" | "outfit">("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchTrendingOutfits()
  }, [category])

  const fetchTrendingOutfits = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        source: "pinterest",
        ...(category !== "all" && { category }),
        maxResults: "15"
      })

      const response = await fetch(`${API_BASE_URL}/api/trending?${params}`)
      const data = await response.json()

      if (data.success) {
        setOutfits(data.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch trending outfits",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching trending outfits:", error)
      toast({
        title: "Error",
        description: "Unable to connect to the server",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/trending/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "pinterest", maxResults: 15 })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: `Refreshed ${data.itemsRefreshed} items`,
        })
        fetchTrendingOutfits()
      }
    } catch (error) {
      console.error("Error refreshing:", error)
      toast({
        title: "Error",
        description: "Failed to refresh trending data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddToWardrobe = async (outfit: TrendingOutfit) => {
    const outfitId = `${outfit.source}-${outfit.imageUrl}`
    setClassifyingId(outfitId)

    try {
      // Step 1: Classify the image using Gemini AI
      toast({
        title: "Classifying with AI...",
        description: "Using Gemini to determine the clothing category",
      })

      const classifyResponse = await fetch(`${API_BASE_URL}/api/trending/classify-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: outfit.imageUrl })
      })

      if (!classifyResponse.ok) {
        throw new Error("Failed to classify image")
      }

      const classifyData = await classifyResponse.json()
      const aiCategory = classifyData.category as "top" | "bottom" | "shoes" | "full-outfit"

      console.log(`🤖 Gemini classified as: ${aiCategory}`)

      // Step 2: Download the image and convert to data URL
      const response = await fetch(outfit.imageUrl)
      const blob = await response.blob()

      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result as string

        // Create a clothing item with AI-determined category
        const newItem: ClothingItem = {
          id: `trending-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          image: dataUrl,
          imageUrl: dataUrl,
          category: aiCategory, // Use AI classification instead of hardcoded
          name: outfit.title,
          brand: outfit.source
        }

        // Get existing items from localStorage
        const existingItems = localStorage.getItem("clothingItems")
        const items: ClothingItem[] = existingItems ? JSON.parse(existingItems) : []

        // Add new item
        items.push(newItem)
        localStorage.setItem("clothingItems", JSON.stringify(items))

        toast({
          title: "Added to Wardrobe!",
          description: `${outfit.title} added as "${aiCategory}" using AI classification`,
        })

        setClassifyingId(null)
      }

      reader.readAsDataURL(blob)
    } catch (error) {
      console.error("Error adding to wardrobe:", error)
      setClassifyingId(null)

      // Fallback: Add with just the URL and default category
      const newItem: ClothingItem = {
        id: `trending-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        imageUrl: outfit.imageUrl,
        category: outfit.category === "outfit" ? "top" : outfit.category,
        name: outfit.title,
        brand: outfit.source
      }

      const existingItems = localStorage.getItem("clothingItems")
      const items: ClothingItem[] = existingItems ? JSON.parse(existingItems) : []
      items.push(newItem)
      localStorage.setItem("clothingItems", JSON.stringify(items))

      toast({
        title: "Added to Wardrobe!",
        description: `${outfit.title} has been added (classification failed, using fallback)`,
        variant: "default"
      })
    }
  }

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "top": return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
      case "bottom": return "bg-green-500/10 text-green-600 dark:text-green-400"
      case "shoes": return "bg-purple-500/10 text-purple-600 dark:text-purple-400"
      case "outfit": return "bg-orange-500/10 text-orange-600 dark:text-orange-400"
      default: return "bg-gray-500/10 text-gray-600 dark:text-gray-400"
    }
  }

  const getSourceColor = (src: string) => {
    switch (src) {
      case "Pinterest": return "bg-red-500/10 text-red-600 dark:text-red-400"
      case "Hollister": return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
      case "H&M": return "bg-pink-500/10 text-pink-600 dark:text-pink-400"
      default: return "bg-gray-500/10 text-gray-600 dark:text-gray-400"
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Trending Outfits</h2>
              <p className="text-sm text-muted-foreground">
                Discover the latest men's streetwear from Pinterest
              </p>
            </div>
          </div>

          <Button
            onClick={handleRefresh}
            disabled={loading}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Category:</span>
            <Tabs value={category} onValueChange={(v) => setCategory(v as any)}>
              <TabsList className="h-9">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="top" className="text-xs">Tops</TabsTrigger>
                <TabsTrigger value="bottom" className="text-xs">Bottoms</TabsTrigger>
                <TabsTrigger value="shoes" className="text-xs">Shoes</TabsTrigger>
                <TabsTrigger value="outfit" className="text-xs">Outfits</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Loading trending outfits...</p>
            </div>
          </div>
        ) : outfits.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No outfits found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try changing the filters or refresh the data
              </p>
              <Button onClick={fetchTrendingOutfits} variant="outline" size="sm">
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 pb-4">
              {outfits.map((outfit, index) => (
                <Card
                  key={`${outfit.source}-${index}`}
                  className="group cursor-pointer border-0 shadow-sm hover:shadow-xl transition-shadow duration-200 overflow-hidden rounded-2xl bg-card"
                  onClick={() => window.open(outfit.link, "_blank")}
                >
                  <CardContent className="p-0">
                    {/* Image */}
                    <div className="relative aspect-[3/4] overflow-hidden bg-muted/30 rounded-t-2xl">
                      <img
                        src={outfit.imageUrl}
                        alt={outfit.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          if (!target.src.includes("/placeholder.jpg")) {
                            target.src = "/placeholder.jpg"
                          }
                        }}
                      />
                      
                      {/* Subtle hover overlay with action button */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="absolute bottom-3 right-3">
                          {classifyingId === `${outfit.source}-${outfit.imageUrl}` ? (
                            <Button
                              size="sm"
                              disabled
                              className="gap-1.5 shadow-lg bg-white/95 hover:bg-white text-black"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span className="text-xs">Adding...</span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddToWardrobe(outfit)
                              }}
                              className="gap-1.5 shadow-lg bg-white/95 hover:bg-white text-black"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span className="text-xs">Add</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Clean info section */}
                    <div className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2 leading-snug text-foreground/90">
                        {outfit.title}
                      </h3>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
