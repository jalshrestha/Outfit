'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Sun, Moon, UserPlus } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const { theme, setTheme } = useTheme();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            await register(username, password, email || undefined);
        } catch (err: any) {
            setError(err.message || 'Registration failed');
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
                                Join StyleAI
                            </h1>
                            <p className="text-lg text-[var(--shell-foreground)]/80 mb-6">
                                Create your account and start exploring AI-powered virtual try-on technology.
                            </p>
                            <div className="rounded-2xl border border-white/10 bg-white/90 dark:bg-black/30 p-6 backdrop-blur-2xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <UserPlus className="h-5 w-5 text-[var(--shell-foreground)]/60" />
                                    <p className="font-medium">What You Get</p>
                                </div>
                                <ul className="space-y-2 text-sm text-[var(--shell-foreground)]/70">
                                    <li className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                                        Personal wardrobe management
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                                        AI-powered outfit generation
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                                        Virtual try-on technology
                                    </li>
                                </ul>
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

                                <form onSubmit={handleSubmit} className="space-y-4">
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
                                            placeholder="Choose a username"
                                            required
                                            autoFocus
                                            minLength={3}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium mb-2">
                                            Email <span className="text-[var(--shell-foreground)]/40">(optional)</span>
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full rounded-xl border border-[var(--frame-border)] bg-[var(--frame-surface)] px-4 py-3 text-[var(--shell-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all backdrop-blur-xl"
                                            placeholder="your@email.com"
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
                                            placeholder="Create a password"
                                            required
                                            minLength={6}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                                            Confirm Password
                                        </label>
                                        <input
                                            id="confirmPassword"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full rounded-xl border border-[var(--frame-border)] bg-[var(--frame-surface)] px-4 py-3 text-[var(--shell-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all backdrop-blur-xl"
                                            placeholder="Confirm your password"
                                            required
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        size="lg"
                                        className="w-full"
                                    >
                                        {isLoading ? 'Creating account...' : 'Create Account'}
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </form>

                                <div className="mt-6 text-center text-sm text-[var(--shell-foreground)]/60">
                                    Already have an account?{' '}
                                    <Link
                                        href="/login"
                                        className="text-[var(--accent)] hover:underline font-medium transition-colors"
                                    >
                                        Sign in
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
