"use client"

import { motion } from 'framer-motion'
import { TrendingUp, Shirt, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

interface StatsCardProps {
    title: string
    value: number
    icon: React.ReactNode
    gradient: string
    delay?: number
}

function StatsCard({ title, value, icon, gradient, delay = 0 }: StatsCardProps) {
    const [count, setCount] = useState(0)

    useEffect(() => {
        const duration = 1000
        const steps = 60
        const increment = value / steps
        let current = 0

        const timer = setInterval(() => {
            current += increment
            if (current >= value) {
                setCount(value)
                clearInterval(timer)
            } else {
                setCount(Math.floor(current))
            }
        }, duration / steps)

        return () => clearInterval(timer)
    }, [value])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="stats-card glass-medium rounded-2xl p-6 hover-glow-blue relative overflow-hidden group"
        >
            {/* Gradient accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${gradient}`} />

            {/* Icon background glow */}
            <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <div className="text-6xl">{icon}</div>
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2.5 rounded-xl ${gradient} bg-opacity-10`}>
                        {icon}
                    </div>
                    <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
                </div>

                <div className="flex items-baseline gap-2">
                    <motion.span
                        key={count}
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-4xl font-bold text-gradient"
                    >
                        {count}
                    </motion.span>
                </div>
            </div>
        </motion.div>
    )
}

interface StatsDashboardProps {
    totalItems: number
    totalModels: number
    savedOutfits: number
}

export function StatsDashboard({ totalItems, totalModels, savedOutfits }: StatsDashboardProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatsCard
                title="Wardrobe Items"
                value={totalItems}
                icon={<Shirt className="w-5 h-5" />}
                gradient="bg-gradient-primary"
                delay={0}
            />
            <StatsCard
                title="Model Photos"
                value={totalModels}
                icon={<Sparkles className="w-5 h-5" />}
                gradient="bg-gradient-accent"
                delay={0.1}
            />
            <StatsCard
                title="Saved Looks"
                value={savedOutfits}
                icon={<TrendingUp className="w-5 h-5" />}
                gradient="bg-gradient-success"
                delay={0.2}
            />
        </div>
    )
}
