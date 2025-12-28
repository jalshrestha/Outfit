"use client"

import { Moon, Sun, Sparkles, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"

const navItems = [
  { label: "Studio", value: "wardrobe" },
  { label: "Trending", value: "trending" },
  { label: "History", value: "history" },
]

export function Header() {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("wardrobe")

  // Listen for tab changes
  useEffect(() => {
    const handleNavigation = (event: Event) => {
      const customEvent = event as CustomEvent<string>
      if (customEvent.detail) {
        setActiveTab(customEvent.detail)
      }
    }

    window.addEventListener("outfit:navigate", handleNavigation as EventListener)
    return () => window.removeEventListener("outfit:navigate", handleNavigation as EventListener)
  }, [])

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-40 mx-auto mb-6 w-full max-w-6xl rounded-full border border-[var(--frame-border)] bg-[var(--frame-surface)] px-5 py-3 text-[var(--shell-foreground)] shadow-[var(--frame-shadow)] backdrop-blur-3xl"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-white via-white/80 to-white/50 text-black shadow-lg dark:text-black cursor-pointer"
          >
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-semibold text-white shadow-inner">
              AI
            </div>
          </motion.div>
          <div className="hidden sm:block">
            <p className="text-xs uppercase tracking-[0.25em] sm:tracking-[0.4em] text-[var(--shell-foreground)]/60">Outfit Studio</p>
            <h1 className="text-base sm:text-xl font-semibold tracking-tight text-[var(--shell-foreground)]">Luxury Virtual Try-On</h1>
          </div>
        </div>

        <nav className="hidden items-center gap-8 text-sm text-[var(--shell-foreground)]/70 md:flex">
          {navItems.map((item, index) => {
            const isActive = activeTab === item.value
            return (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
                type="button"
                className={`relative py-1 transition-colors group ${isActive
                  ? 'text-[var(--shell-foreground)] font-medium'
                  : 'hover:text-[var(--shell-foreground)]'
                  }`}
                onClick={() => {
                  if (typeof window !== "undefined") {
                    setActiveTab(item.value)
                    window.dispatchEvent(new CustomEvent("outfit:navigate", { detail: item.value }))
                  }
                }}
              >
                {item.label}
                <span
                  className={`absolute bottom-0 left-0 h-0.5 bg-black dark:bg-white transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                />
              </motion.button>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--panel-border)] bg-[var(--panel-surface)]">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs text-[var(--shell-foreground)]/80">{user.username}</span>
            </div>
          )}

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-10 w-10 sm:h-11 sm:w-11 border border-[var(--panel-border)] bg-[var(--panel-surface)] text-[var(--shell-foreground)] hover:bg-[var(--panel-hover)]/30"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-10 w-10 sm:h-11 sm:w-11 border border-[var(--panel-border)] bg-[var(--panel-surface)] text-[var(--shell-foreground)] hover:bg-red-500/20 hover:text-red-500"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.header>
  )
}
