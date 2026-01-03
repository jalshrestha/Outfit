"use client"

import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'
import { SavedOutfitData } from '@/lib/api'

interface RecentOutfitsCarouselProps {
    outfits: SavedOutfitData[]
}

export function RecentOutfitsCarousel({ outfits }: RecentOutfitsCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const recentOutfits = outfits.slice(0, 5)

    if (recentOutfits.length === 0) {
        return null
    }

    const next = () => {
        setCurrentIndex((prev) => (prev + 1) % recentOutfits.length)
    }

    const prev = () => {
        setCurrentIndex((prev) => (prev - 1 + recentOutfits.length) % recentOutfits.length)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="glass-medium rounded-2xl p-6 mb-6"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Recently Generated</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={prev}
                        className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        aria-label="Previous outfit"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-muted-foreground">
                        {currentIndex + 1} / {recentOutfits.length}
                    </span>
                    <button
                        onClick={next}
                        className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        aria-label="Next outfit"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="relative overflow-hidden rounded-xl">
                <motion.div
                    className="flex"
                    animate={{ x: `-${currentIndex * 100}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    {recentOutfits.map((outfit, index) => (
                        <div
                            key={outfit.id}
                            className="min-w-full flex items-center justify-center"
                        >
                            <div className="relative w-full max-w-md aspect-[3/4] rounded-lg overflow-hidden glass-light">
                                <Image
                                    src={outfit.generatedImageUrl}
                                    alt={outfit.name}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                                    <h4 className="text-white font-semibold">{outfit.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-white/80">{outfit.metadata.style}</span>
                                        <span className="text-xs text-white/60">•</span>
                                        <span className="text-xs text-white/80">
                                            {new Date(outfit.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Dots indicator */}
            <div className="flex justify-center gap-2 mt-4">
                {recentOutfits.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`h-2 rounded-full transition-all ${index === currentIndex
                                ? 'w-8 bg-primary'
                                : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                            }`}
                        aria-label={`Go to outfit ${index + 1}`}
                    />
                ))}
            </div>
        </motion.div>
    )
}
