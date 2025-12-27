"use client"

import { cn } from "@/lib/utils"

interface SpinnerProps {
    size?: "sm" | "md" | "lg"
    className?: string
}

export function Spinner({ size = "md", className }: SpinnerProps) {
    const sizeClasses = {
        sm: "h-4 w-4 border-2",
        md: "h-8 w-8 border-3",
        lg: "h-12 w-12 border-4",
    }

    return (
        <div
            className={cn(
                "animate-spin rounded-full border-solid border-primary border-t-transparent",
                sizeClasses[size],
                className
            )}
        />
    )
}

interface LoadingOverlayProps {
    message?: string
    submessage?: string
}

export function LoadingOverlay({ message = "Loading...", submessage }: LoadingOverlayProps) {
    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <Spinner size="lg" />
            <p className="mt-4 text-lg font-medium text-foreground">{message}</p>
            {submessage && (
                <p className="mt-1 text-sm text-muted-foreground">{submessage}</p>
            )}
        </div>
    )
}

interface GeneratingOverlayProps {
    progress?: number
}

export function GeneratingOverlay({ progress }: GeneratingOverlayProps) {
    const messages = [
        "Analyzing your style choices...",
        "Preparing the virtual fitting room...",
        "AI is working its magic...",
        "Almost there, creating your look...",
        "Putting the finishing touches...",
    ]

    const messageIndex = progress !== undefined
        ? Math.min(Math.floor(progress / 20), messages.length - 1)
        : 0

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md">
            <div className="relative">
                {/* Animated rings */}
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10" style={{ animationDuration: '1.5s' }} />

                {/* Center spinner */}
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
                    <Spinner size="lg" className="border-primary" />
                </div>
            </div>

            <div className="mt-6 text-center">
                <p className="text-lg font-semibold text-foreground">
                    ✨ Generating Your Look
                </p>
                <p className="mt-2 text-sm text-muted-foreground animate-pulse">
                    {messages[messageIndex]}
                </p>
            </div>

            {progress !== undefined && (
                <div className="mt-4 w-48">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="mt-1 text-center text-xs text-muted-foreground">
                        {progress}% complete
                    </p>
                </div>
            )}
        </div>
    )
}
