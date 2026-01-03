"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ArrowLeft, Plus, X, Shirt } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getSavedOutfits, getPlannedOutfits, savePlannedOutfit, deletePlannedOutfit } from "@/lib/api"
import type { SavedOutfit } from "@/types"

// Simple calendar helpers
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay()
}

interface PlannedOutfit {
    date: string // YYYY-MM-DD
    outfitId: string
}

export default function CalendarPage() {
    const router = useRouter()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([])
    const [plannedOutfits, setPlannedOutfits] = useState<PlannedOutfit[]>([])
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [showOutfitPicker, setShowOutfitPicker] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    // Load saved outfits and planned outfits from database
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true)
                const [outfits, planned] = await Promise.all([
                    getSavedOutfits(),
                    getPlannedOutfits()
                ])
                setSavedOutfits(outfits as SavedOutfit[])
                // Map database format to local format
                setPlannedOutfits(planned.map(p => ({
                    date: p.date.split('T')[0], // Handle ISO date format
                    outfitId: p.outfit_id
                })))
            } catch (error) {
                console.error("Error loading data:", error)
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1))
    }

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1))
    }

    const goToToday = () => {
        setCurrentDate(new Date())
    }

    const formatDateKey = (day: number) => {
        return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    }

    const getPlannedOutfitForDay = (day: number) => {
        const dateKey = formatDateKey(day)
        const planned = plannedOutfits.find(p => p.date === dateKey)
        if (planned) {
            return savedOutfits.find(o => o.id === planned.outfitId)
        }
        return null
    }

    const handleDayClick = (day: number) => {
        const dateKey = formatDateKey(day)
        setSelectedDate(dateKey)
        setShowOutfitPicker(true)
    }

    const assignOutfit = async (outfit: SavedOutfit) => {
        if (!selectedDate) return

        try {
            // Save to database
            await savePlannedOutfit(selectedDate, outfit.id)

            // Update local state
            const updated = plannedOutfits.filter(p => p.date !== selectedDate)
            updated.push({ date: selectedDate, outfitId: outfit.id })
            setPlannedOutfits(updated)
        } catch (error) {
            console.error("Error saving planned outfit:", error)
        }

        setShowOutfitPicker(false)
        setSelectedDate(null)
    }

    const removeOutfit = async (dateKey: string) => {
        try {
            // Delete from database
            await deletePlannedOutfit(dateKey)

            // Update local state
            setPlannedOutfits(prev => prev.filter(p => p.date !== dateKey))
        } catch (error) {
            console.error("Error removing planned outfit:", error)
        }
    }

    const today = new Date()
    const isToday = (day: number) => {
        return day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
    }

    // Generate calendar grid
    const calendarDays: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(null) // Empty cells before first day
    }
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day)
    }

    return (
        <div className="min-h-screen bg-[var(--background)] p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-4xl">
                {/* Header with Back Button */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--shell-foreground)]/50">Plan Your Style</p>
                            <h1 className="font-serif text-2xl font-semibold text-[var(--shell-foreground)]">Outfit Calendar</h1>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
                </div>

                {/* Calendar Navigation */}
                <div className="mb-4 flex items-center justify-between rounded-xl border border-[var(--panel-border)] bg-[var(--panel-surface)] p-3">
                    <Button variant="ghost" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-lg font-medium">{MONTHS[month]} {year}</h2>
                    <Button variant="ghost" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>

                {/* Day Headers */}
                <div className="mb-2 grid grid-cols-7 gap-1">
                    {DAYS.map(day => (
                        <div key={day} className="py-2 text-center text-xs font-medium text-[var(--shell-foreground)]/50">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                        if (day === null) {
                            return <div key={`empty-${index}`} className="aspect-square" />
                        }

                        const outfit = getPlannedOutfitForDay(day)
                        const dateKey = formatDateKey(day)

                        return (
                            <motion.div
                                key={day}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleDayClick(day)}
                                className={`relative aspect-square rounded-lg border transition-all overflow-hidden cursor-pointer ${isToday(day) ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20" : "border-[var(--panel-border)]"
                                    } ${outfit ? "bg-[var(--panel-surface)]" : "bg-[var(--panel-surface)]/50 hover:bg-[var(--panel-surface)]"}`}
                            >
                                {/* Day Number */}
                                <span className={`absolute left-1.5 top-1 text-xs font-medium z-10 ${isToday(day) ? "text-[var(--primary)]" : "text-[var(--shell-foreground)]/70"}`}>
                                    {day}
                                </span>

                                {/* Outfit Preview */}
                                {outfit ? (
                                    <>
                                        <img
                                            src={outfit.generatedImageUrl}
                                            alt={outfit.name}
                                            className="absolute inset-0 h-full w-full object-cover opacity-60"
                                        />
                                        <div
                                            onClick={(e) => { e.stopPropagation(); removeOutfit(dateKey) }}
                                            className="absolute right-1 top-1 h-5 w-5 rounded-full bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer z-10"
                                        >
                                            <X className="h-3 w-3 text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <Plus className="h-5 w-5 text-[var(--shell-foreground)]/30" />
                                    </div>
                                )}
                            </motion.div>
                        )
                    })}
                </div>

                {/* Outfit Picker Modal */}
                <AnimatePresence>
                    {showOutfitPicker && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                            onClick={() => setShowOutfitPicker(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                onClick={e => e.stopPropagation()}
                                className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-surface)] p-4"
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="font-semibold">Select Outfit</h3>
                                    <Button variant="ghost" size="icon" onClick={() => setShowOutfitPicker(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                {savedOutfits.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <Shirt className="mb-3 h-10 w-10 text-[var(--shell-foreground)]/30" />
                                        <p className="text-sm text-[var(--shell-foreground)]/60">No saved outfits yet</p>
                                        <p className="text-xs text-[var(--shell-foreground)]/40">Generate and save outfits first</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {savedOutfits.map(outfit => (
                                            <button
                                                key={outfit.id}
                                                onClick={() => assignOutfit(outfit)}
                                                className="overflow-hidden rounded-xl border border-[var(--panel-border)] transition-all hover:border-[var(--primary)] hover:shadow-md"
                                            >
                                                <img
                                                    src={outfit.generatedImageUrl}
                                                    alt={outfit.name}
                                                    className="aspect-[3/4] w-full object-cover"
                                                />
                                                <p className="truncate p-2 text-xs font-medium">{outfit.name}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
