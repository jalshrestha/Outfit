'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Sun, Moon, LogIn } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const { theme, setTheme } = useTheme();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(username, password);
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative box-border h-screen overflow-hidden bg-[var(--shell-bg)] text-[var(--shell-foreground)]">
            {/* Background gradients */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-x-0 top-[-25%] h-[70vh] bg-[radial-gradient(circle_at_top,_rgba(60,130,246,0.25),_transparent_65%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(139,92,246,0.2),_transparent_65%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06),transparent)]" />
            </div>

            <div className="relative z-10 flex h-full items-center justify-center px-3 py-3 sm:px-5 lg:px-6">
                <motion.section
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative isolate flex w-full max-w-5xl flex-col overflow-hidden rounded-[32px] sm:rounded-[40px] border border-[var(--frame-border)] bg-[var(--frame-surface)] p-6 sm:p-8 lg:p-12 text-[var(--shell-foreground)] shadow-[var(--frame-shadow)] backdrop-blur-3xl"
                >
                    {/* Glow layers */}
                    <div className="pointer-events-none absolute inset-0 opacity-70">
                        <div className="absolute -top-28 right-0 h-80 w-80 rounded-full bg-[#3C82F6]/30 blur-[140px]" />
                        <div className="absolute -bottom-28 left-0 h-80 w-80 rounded-full bg-[#8B5CF6]/25 blur-[140px]" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_50%)]" />
                    </div>

                    {/* Header */}
                    <motion.div
                        className="relative z-10 mb-8 flex items-center justify-between"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-white via-white/80 to-white/50 text-black shadow-lg">
                                <Sparkles className="h-6 w-6" />
                                <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-semibold text-white shadow-inner">
                                    AI
                                </div>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-[var(--shell-foreground)]/60">Outfit Studio</p>
                                <h2 className="text-lg font-semibold">StyleAI</h2>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 border border-[var(--panel-border)] bg-[var(--panel-surface)] hover:bg-[var(--panel-hover)]/30"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        >
                            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        </Button>
                    </motion.div>

                    <div className="relative z-10 grid gap-8 lg:grid-cols-2 lg:gap-12">
                        {/* Left side - Welcome */}
                        <motion.div
                            className="flex flex-col justify-center"
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                        >
                            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl mb-4">
                                Welcome back
                            </h1>
                            <p className="text-lg text-[var(--shell-foreground)]/80 mb-6">
                                Sign in to continue your style journey with AI-powered virtual try-on.
                            </p>
                            <div className="rounded-2xl border border-white/10 bg-white/90 dark:bg-black/30 p-6 backdrop-blur-2xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <LogIn className="h-5 w-5 text-[var(--shell-foreground)]/60" />
                                    <p className="font-medium">Quick Access</p>
                                </div>
                                <p className="text-sm text-[var(--shell-foreground)]/70">
                                    Use your credentials to access your wardrobe, saved outfits, and AI-generated looks.
                                </p>
                            </div>
                        </motion.div>

                        {/* Right side - Form */}
                        <motion.div
                            className="flex flex-col justify-center"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            <div className="rounded-3xl border border-white/10 bg-white/90 dark:bg-black/30 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-500"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label htmlFor="username" className="block text-sm font-medium mb-2">
                                            Username
                                        </label>
                                        <input
                                            id="username"
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full rounded-xl border border-[var(--frame-border)] bg-[var(--frame-surface)] px-4 py-3 text-[var(--shell-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all backdrop-blur-xl"
                                            placeholder="Enter your username"
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium mb-2">
                                            Password
                                        </label>
                                        <input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full rounded-xl border border-[var(--frame-border)] bg-[var(--frame-surface)] px-4 py-3 text-[var(--shell-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all backdrop-blur-xl"
                                            placeholder="Enter your password"
                                            required
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        size="lg"
                                        className="w-full"
                                    >
                                        {isLoading ? 'Signing in...' : 'Sign In'}
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </form>

                                <div className="mt-6 text-center text-sm text-[var(--shell-foreground)]/60">
                                    Don't have an account?{' '}
                                    <Link
                                        href="/register"
                                        className="text-[var(--accent)] hover:underline font-medium transition-colors"
                                    >
                                        Create one
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.section>
            </div>
        </div>
    );
}
