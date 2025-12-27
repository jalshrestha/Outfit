"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps {
    className?: string
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-muted/60",
                className
            )}
        />
    )
}

export function ClothingCardSkeleton() {
    return (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <Skeleton className="aspect-square w-full" />
            <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
    )
}

export function ClothingGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <ClothingCardSkeleton key={i} />
            ))}
        </div>
    )
}

export function OutfitCardSkeleton() {
    return (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <Skeleton className="aspect-[4/5] w-full" />
            <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
            </div>
        </div>
    )
}

export function OutfitGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: count }).map((_, i) => (
                <OutfitCardSkeleton key={i} />
            ))}
        </div>
    )
}

export function TrendingCardSkeleton() {
    return (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <Skeleton className="aspect-[3/4] w-full" />
            <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <div className="flex justify-between">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                </div>
            </div>
        </div>
    )
}

export function TrendingGridSkeleton({ count = 12 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <TrendingCardSkeleton key={i} />
            ))}
        </div>
    )
}

export function ModelPreviewSkeleton() {
    return (
        <div className="relative h-full w-full flex items-center justify-center">
            <Skeleton className="h-[320px] lg:h-[400px] w-full max-w-[300px] rounded-xl" />
        </div>
    )
}
