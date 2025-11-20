"use client"

import { Moon, Sun, Sparkles } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

const navItems = [
  { label: "Studio", value: "wardrobe" },
  { label: "Trending", value: "trending" },
  { label: "History", value: "history" },
]

export function Header() {
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-6 z-40 mx-auto mb-8 w-full max-w-6xl rounded-full border border-[var(--frame-border)] bg-[var(--frame-surface)] px-4 py-3 text-[var(--shell-foreground)] shadow-[var(--frame-shadow)] backdrop-blur-3xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-white via-white/80 to-white/50 text-black shadow-lg dark:text-black">
            <Sparkles className="h-5 w-5" />
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-semibold text-white shadow-inner">
              AI
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[var(--shell-foreground)]/60">Outfit Studio</p>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--shell-foreground)]">Luxury Virtual Try-On</h1>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-[var(--shell-foreground)]/70 md:flex">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className="transition hover:text-[var(--shell-foreground)]"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("outfit:navigate", { detail: item.value }))
                }
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="hidden border-[var(--panel-border)] bg-[var(--panel-surface)] px-4 py-2 text-xs uppercase tracking-[0.3em] text-[var(--shell-foreground)]/80 md:flex"
          >
            Beta Access
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-11 w-11 border border-[var(--panel-border)] bg-[var(--panel-surface)] text-[var(--shell-foreground)] hover:bg-[var(--panel-hover)]/30"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>
    </header>
  )
}
