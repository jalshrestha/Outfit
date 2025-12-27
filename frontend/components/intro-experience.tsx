"use client"

import { motion } from "framer-motion"
import { ArrowRight, Sparkles, ShieldCheck, Zap, Cpu, Palette, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

interface IntroExperienceProps {
  onEnter: () => void
}

const stats = [
  { label: "Looks Generated", value: "4.8M+" },
  { label: "Global Stylists", value: "120+" },
  { label: "Fit Accuracy", value: "97%" },
]

const features = [
  {
    title: "Neural Tailoring",
    description: "Gemini-powered tailoring understands drape, texture, and silhouette for photo-realistic try-ons.",
    icon: ShieldCheck,
  },
  {
    title: "Precision Styling",
    description: "Curate tops, bottoms, and full looks with live AI scoring that adapts to your taste graph.",
    icon: Palette,
  },
  {
    title: "Adaptive Lighting",
    description: "Studio-grade rendering calibrates lighting and shadows around your uploaded model instantly.",
    icon: Zap,
  },
  {
    title: "Co-Pilot Mode",
    description: "Move from inspiration to saved wardrobe in a single tap with semantic search and auto-tagging.",
    icon: Cpu,
  },
]

export function IntroExperience({ onEnter }: IntroExperienceProps) {
  const { theme, setTheme } = useTheme()

  return (
    <section className="relative isolate flex h-[calc(100vh-4rem)] sm:h-[calc(100vh-6rem)] max-h-[900px] w-full flex-col justify-between overflow-hidden rounded-[32px] sm:rounded-[40px] border border-[var(--frame-border)] bg-[var(--frame-surface)] px-4 py-6 sm:px-6 sm:py-8 text-[var(--shell-foreground)] shadow-[var(--frame-shadow)] backdrop-blur-3xl lg:px-16">
      {/* Glow layers */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-28 right-0 h-80 w-80 rounded-full bg-[#3C82F6]/30 blur-[140px]" />
        <div className="absolute -bottom-28 left-0 h-80 w-80 rounded-full bg-[#8B5CF6]/25 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_50%)]" />
      </div>

      <motion.div
        className="relative z-10 flex flex-shrink-0 flex-col items-center text-center"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-6 flex w-full items-center justify-between">
          <p className="text-xs uppercase tracking-[0.25em] sm:tracking-[0.4em] text-[var(--shell-foreground)]/60 dark:text-white/60">
            Outfit Studio
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 sm:h-11 sm:w-11 border border-[var(--panel-border)] bg-[var(--panel-surface)] text-[var(--shell-foreground)] hover:bg-[var(--panel-hover)]/30 touch-manipulation"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
        <p className="mb-2 text-xs uppercase tracking-[0.25em] sm:tracking-[0.4em] text-[var(--shell-foreground)]/50 dark:text-white/60">
          Powered by Style AI
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--shell-foreground)] dark:text-white sm:text-5xl md:text-6xl">
          Wear the future before it ships.
        </h1>
        <p className="mt-6 max-w-3xl text-base text-[var(--shell-foreground)]/80 dark:text-white/80">
          Outfit was built to feel like stepping into a serene flagship rather than opening another interface. Calibrate
          your avatar, stream curated drops, and commit to new looks with adaptive light, physics-aware fabric, and AI
          confidence scoring.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <Button
            size="lg"
            className="w-full min-w-[220px] sm:w-auto"
            onClick={onEnter}
          >
            Enter the experience
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </motion.div>

      <motion.div
        className="relative z-10 mt-6 flex-1"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/90 p-5 text-[var(--shell-foreground)] shadow-2xl backdrop-blur-2xl dark:bg-black/30 dark:text-white sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="space-y-1 text-center">
              <p className="text-3xl font-semibold tracking-tight">{stat.value}</p>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--shell-foreground)]/60 dark:text-white/50">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="relative z-10 mt-6 flex-shrink-0 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {features.map((feature) => (
          <div
            key={feature.title}
            className="group rounded-3xl border border-white/10 bg-white/90 p-4 text-[var(--shell-foreground)] shadow-xl transition hover:-translate-y-1 hover:bg-white dark:bg-black/30 dark:text-white"
          >
            <feature.icon className="h-5 w-5 text-[var(--shell-foreground)]/60 dark:text-white/70" />
            <p className="mt-3 text-base font-medium">{feature.title}</p>
            <p className="mt-1 text-xs text-[var(--shell-foreground)]/70 dark:text-white/70">{feature.description}</p>
          </div>
        ))}
      </motion.div>
    </section>
  )
}
