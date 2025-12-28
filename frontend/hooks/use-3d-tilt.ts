"use client"

import { useEffect, useRef, useState } from 'react'

interface Use3DTiltOptions {
    intensity?: number
    max?: number
    perspective?: number
    scale?: number
    speed?: number
}

export function use3DTilt({
    intensity = 10,
    max = 15,
    perspective = 1000,
    scale = 1.02,
    speed = 400,
}: Use3DTiltOptions = {}) {
    const ref = useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false)

    useEffect(() => {
        const element = ref.current
        if (!element) return

        const handleMouseMove = (e: MouseEvent) => {
            const rect = element.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            const centerX = rect.width / 2
            const centerY = rect.height / 2

            const rotateX = ((y - centerY) / centerY) * max
            const rotateY = ((centerX - x) / centerX) * max

            element.style.transform = `
        perspective(${perspective}px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        scale(${scale})
      `
        }

        const handleMouseEnter = () => {
            setIsHovered(true)
            element.style.transition = 'none'
        }

        const handleMouseLeave = () => {
            setIsHovered(false)
            element.style.transition = `transform ${speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`
            element.style.transform = `
        perspective(${perspective}px)
        rotateX(0deg)
        rotateY(0deg)
        scale(1)
      `
        }

        element.addEventListener('mousemove', handleMouseMove)
        element.addEventListener('mouseenter', handleMouseEnter)
        element.addEventListener('mouseleave', handleMouseLeave)

        return () => {
            element.removeEventListener('mousemove', handleMouseMove)
            element.removeEventListener('mouseenter', handleMouseEnter)
            element.removeEventListener('mouseleave', handleMouseLeave)
        }
    }, [intensity, max, perspective, scale, speed])

    return { ref, isHovered }
}
