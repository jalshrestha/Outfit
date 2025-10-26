import { useState } from "react"

interface UseTouchSwipeOptions {
  onLeftSwipe?: () => void
  onRightSwipe?: () => void
  minSwipeDistance?: number
}

/**
 * Custom hook to handle touch swipe gestures
 * @param onLeftSwipe - Callback for left swipe (swipe from right to left)
 * @param onRightSwipe - Callback for right swipe (swipe from left to right)
 * @param minSwipeDistance - Minimum distance in pixels to register as swipe (default: 50)
 */
export function useTouchSwipe({
  onLeftSwipe,
  onRightSwipe,
  minSwipeDistance = 50,
}: UseTouchSwipeOptions) {
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && onLeftSwipe) {
      onLeftSwipe()
    }
    if (isRightSwipe && onRightSwipe) {
      onRightSwipe()
    }
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  }
}
