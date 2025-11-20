"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Header } from "@/components/header"
import { MainLayout } from "@/components/main-layout"
import { IntroExperience } from "@/components/intro-experience"

const STORAGE_KEY = "outfit-has-entered"

export default function Home() {
  const [showStudio, setShowStudio] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY)
      if (savedState === "true") {
        setShowStudio(true)
      }
    } catch {
      // no-op if running outside browser storage
    } finally {
      setIsReady(true)
    }
  }, [])

  const handleEnter = () => {
    setShowStudio(true)
    try {
      localStorage.setItem(STORAGE_KEY, "true")
    } catch {
      // storage is optional
    }
  }

  if (!isReady) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--shell-bg)] text-[var(--shell-foreground)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-[-25%] h-[70vh] bg-[radial-gradient(circle_at_top,_rgba(60,130,246,0.25),_transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(139,92,246,0.2),_transparent_65%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06),transparent)]" />
      </div>
      <div className="relative z-10 flex min-h-screen justify-center px-4 py-6 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {!showStudio ? (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.6 }}
              className="flex w-full max-w-6xl flex-1"
            >
              <IntroExperience onEnter={handleEnter} />
            </motion.div>
          ) : (
            <motion.div
              key="studio"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.5 }}
              className="flex w-full max-w-6xl flex-col"
            >
              <div className="absolute inset-0 -z-10">
                <div className="absolute left-1/2 top-20 h-96 w-96 -translate-x-1/2 rounded-full bg-[#4C7AFE]/20 blur-[220px]" />
                <div className="absolute right-0 bottom-12 h-80 w-80 rounded-full bg-[#FFCCE1]/10 blur-[200px]" />
              </div>
              <Header />
              <MainLayout />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
