'use client'

import { Home, TrendingUp, History } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileTabBarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function MobileTabBar({ activeTab, onTabChange }: MobileTabBarProps) {
  const tabs = [
    { id: 'wardrobe', label: 'Studio', icon: Home },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'history', label: 'History', icon: History },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Top border glow effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--panel-border)] to-transparent" />

      <div className="backdrop-blur-xl bg-[var(--panel-surface)]/95 border-t border-[var(--panel-border)]">
        <div className="safe-area-inset-bottom grid grid-cols-3 gap-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 py-2 px-4 transition-all",
                  "min-h-[60px] touch-manipulation",
                  isActive
                    ? "text-[var(--accent-foreground)]"
                    : "text-[var(--shell-foreground)]/60 hover:text-[var(--shell-foreground)]"
                )}
              >
                <Icon className={cn(
                  "transition-all",
                  isActive ? "h-6 w-6" : "h-5 w-5"
                )} />
                <span className={cn(
                  "text-[10px] font-medium tracking-wider",
                  isActive && "font-semibold"
                )}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-[var(--accent-foreground)] rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
