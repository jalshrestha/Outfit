"use client"

import { useState, useEffect } from "react"
import { getSavedOutfits, deleteSavedOutfit, toggleOutfitFavorite, updateOutfitName } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import {
  Heart,
  Download,
  Trash2,
  Search,
  Grid3x3,
  List,
  Star,
  Calendar,
  Tag,
  X,
  Edit2,
  Check
} from "lucide-react"
import type { SavedOutfit } from "@/types"

interface OutfitHistoryProps {
  onRefresh?: () => void
}

export function OutfitHistory({ onRefresh }: OutfitHistoryProps) {
  const [outfits, setOutfits] = useState<SavedOutfit[]>([])
  const [filteredOutfits, setFilteredOutfits] = useState<SavedOutfit[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<"date" | "rating">("date")
  const [filterFavorites, setFilterFavorites] = useState(false)
  const [selectedOutfit, setSelectedOutfit] = useState<SavedOutfit | null>(null)
  const [editingNameId, setEditingNameId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const { toast } = useToast()

  // Load outfits from localStorage
  const loadOutfits = () => {
    const saved = getSavedOutfits()
    setOutfits(saved)
  }

  useEffect(() => {
    loadOutfits()
  }, [onRefresh])

  // Filter and sort outfits
  useEffect(() => {
    let filtered = [...outfits]

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(outfit =>
        outfit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        outfit.metadata.style.toLowerCase().includes(searchQuery.toLowerCase()) ||
        outfit.metadata.occasion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        outfit.metadata.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Filter by favorites
    if (filterFavorites) {
      filtered = filtered.filter(outfit => outfit.isFavorite)
    }

    // Sort outfits
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return b.timestamp - a.timestamp
      } else {
        return b.metadata.aiRating - a.metadata.aiRating
      }
    })

    setFilteredOutfits(filtered)
  }, [outfits, searchQuery, sortBy, filterFavorites])

  const handleDelete = (outfitId: string) => {
    try {
      deleteSavedOutfit(outfitId)
      loadOutfits()
      toast({
        title: "Outfit Deleted",
        description: "The outfit has been removed from your history.",
      })
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete outfit. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleToggleFavorite = (outfitId: string) => {
    try {
      toggleOutfitFavorite(outfitId)
      loadOutfits()
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update favorite status.",
        variant: "destructive",
      })
    }
  }

  const handleDownload = async (outfit: SavedOutfit) => {
    try {
      const response = await fetch(outfit.generatedImageUrl)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `${outfit.name.replace(/\s+/g, '-')}-${outfit.timestamp}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)

      toast({
        title: "Download Started",
        description: `Downloading "${outfit.name}"`,
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download outfit image.",
        variant: "destructive",
      })
    }
  }

  const startEditingName = (outfit: SavedOutfit) => {
    setEditingNameId(outfit.id)
    setEditingName(outfit.name)
  }

  const saveEditedName = (outfitId: string) => {
    if (editingName.trim()) {
      try {
        updateOutfitName(outfitId, editingName.trim())
        loadOutfits()
        setEditingNameId(null)
        toast({
          title: "Name Updated",
          description: "Outfit name has been updated.",
        })
      } catch (error) {
        toast({
          title: "Update Failed",
          description: "Failed to update outfit name.",
          variant: "destructive",
        })
      }
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "text-green-500"
    if (rating >= 6) return "text-yellow-500"
    return "text-orange-500"
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">Outfit History</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {filteredOutfits.length} outfit{filteredOutfits.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              title="Grid view"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              title="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search outfits, styles, occasions, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(value: "date" | "rating") => setSortBy(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="rating">Sort by Rating</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={filterFavorites ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterFavorites(!filterFavorites)}
            >
              <Heart className={`h-4 w-4 mr-2 ${filterFavorites ? 'fill-current' : ''}`} />
              Favorites
            </Button>
          </div>
        </div>
      </div>

      {/* Outfit Grid/List */}
      <div className="flex-1 overflow-hidden p-4">
        <ScrollArea className="h-full">
        {filteredOutfits.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">
                {searchQuery || filterFavorites
                  ? "No outfits match your filters"
                  : "No saved outfits yet. Generate and save your first outfit!"}
              </p>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredOutfits.map((outfit) => (
              <Card
                key={outfit.id}
                className="group overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => setSelectedOutfit(outfit)}
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-muted/30 to-muted/50">
                  <img
                    src={outfit.generatedImageUrl}
                    alt={outfit.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleFavorite(outfit.id)
                      }}
                    >
                      <Heart className={`h-4 w-4 ${outfit.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-1 ${getRatingColor(outfit.metadata.aiRating)}`}>
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-bold">{outfit.metadata.aiRating}/10</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {outfit.metadata.style}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate">{outfit.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(outfit.timestamp)}</p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredOutfits.map((outfit) => (
              <Card
                key={outfit.id}
                className="group cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => setSelectedOutfit(outfit)}
              >
                <div className="flex gap-4 p-4">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-muted/30 to-muted/50">
                    <img
                      src={outfit.generatedImageUrl}
                      alt={outfit.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{outfit.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(outfit.timestamp)}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleFavorite(outfit.id)
                          }}
                        >
                          <Heart className={`h-4 w-4 ${outfit.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {outfit.metadata.style}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {outfit.metadata.occasion}
                      </Badge>
                      <div className={`flex items-center gap-1 text-xs ${getRatingColor(outfit.metadata.aiRating)}`}>
                        <Star className="h-3 w-3 fill-current" />
                        <span className="font-bold">{outfit.metadata.aiRating}/10</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        </ScrollArea>
      </div>

      {/* Detail Dialog */}
      {selectedOutfit && (
        <Dialog open={!!selectedOutfit} onOpenChange={() => setSelectedOutfit(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingNameId === selectedOutfit.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => saveEditedName(selectedOutfit.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingNameId(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1">{selectedOutfit.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEditingName(selectedOutfit)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                Created on {formatDate(selectedOutfit.timestamp)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Image */}
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gradient-to-br from-muted/30 to-muted/50">
                <img
                  src={selectedOutfit.generatedImageUrl}
                  alt={selectedOutfit.name}
                  className="h-full w-full object-contain"
                />
              </div>

              {/* Rating */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">AI Rating:</span>
                  <div className={`flex items-center gap-1 ${getRatingColor(selectedOutfit.metadata.aiRating)}`}>
                    <Star className="h-5 w-5 fill-current" />
                    <span className="text-lg font-bold">{selectedOutfit.metadata.aiRating}/10</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Metadata */}
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Tag className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Style</p>
                    <p className="text-sm text-muted-foreground">{selectedOutfit.metadata.style}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Occasion</p>
                    <p className="text-sm text-muted-foreground">{selectedOutfit.metadata.occasion}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Tag className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedOutfit.metadata.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Clothing Items */}
              <div>
                <p className="text-sm font-medium mb-2">Outfit Items</p>
                <div className="space-y-2">
                  {selectedOutfit.clothingItems.top && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">Top</Badge>
                      <span className="text-muted-foreground">{selectedOutfit.clothingItems.top.name}</span>
                    </div>
                  )}
                  {selectedOutfit.clothingItems.bottom && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">Bottom</Badge>
                      <span className="text-muted-foreground">{selectedOutfit.clothingItems.bottom.name}</span>
                    </div>
                  )}
                  {selectedOutfit.clothingItems.shoes && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">Shoes</Badge>
                      <span className="text-muted-foreground">{selectedOutfit.clothingItems.shoes.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    handleToggleFavorite(selectedOutfit.id)
                    setSelectedOutfit({ ...selectedOutfit, isFavorite: !selectedOutfit.isFavorite })
                  }}
                >
                  <Heart className={`h-4 w-4 mr-2 ${selectedOutfit.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  {selectedOutfit.isFavorite ? 'Unfavorite' : 'Favorite'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleDownload(selectedOutfit)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDelete(selectedOutfit.id)
                    setSelectedOutfit(null)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
