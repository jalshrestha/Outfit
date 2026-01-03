'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    User,
    Mail,
    Calendar,
    LogOut,
    Sparkles,
    Sun,
    Moon,
    ArrowLeft,
    Shield,
    Shirt,
    Image as ImageIcon,
    Heart
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSavedOutfits, getClothingItems, getModelImages } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ProfilePage() {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [stats, setStats] = useState({
        outfits: 0,
        clothing: 0,
        models: 0,
        favorites: 0
    });

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [outfits, clothing, models] = await Promise.all([
                    getSavedOutfits(),
                    getClothingItems(),
                    getModelImages()
                ]);
                setStats({
                    outfits: outfits.length,
                    clothing: clothing.length,
                    models: models.length,
                    favorites: outfits.filter(o => o.isFavorite).length
                });
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        };
        if (user) {
            loadStats();
        }
    }, [user]);

    const handleLogout = () => {
        logout();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--shell-bg)] flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!user) return null;

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Recently joined';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="relative box-border min-h-screen overflow-auto bg-[var(--shell-bg)] text-[var(--shell-foreground)]">
            {/* Background gradients */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-x-0 top-[-25%] h-[70vh] bg-[radial-gradient(circle_at_top,_rgba(60,130,246,0.25),_transparent_65%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(139,92,246,0.2),_transparent_65%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06),transparent)]" />
            </div>

            <div className="relative z-10 flex flex-col items-center px-4 py-8 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative w-full max-w-4xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 border border-[var(--panel-border)] bg-[var(--panel-surface)] hover:bg-[var(--panel-hover)]/30"
                            onClick={() => router.push('/')}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-white via-white/80 to-white/50 text-black shadow-lg">
                                <Sparkles className="h-5 w-5" />
                                <div className="absolute -bottom-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-black text-[8px] font-semibold text-white">
                                    AI
                                </div>
                            </div>
                            <span className="font-semibold">StyleAI</span>
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
                    </div>

                    {/* Profile Card */}
                    <Card className="mb-6 border-[var(--frame-border)] bg-[var(--frame-surface)] backdrop-blur-3xl shadow-[var(--frame-shadow)]">
                        <CardContent className="p-8">
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                {/* Avatar */}
                                <div className="relative">
                                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-1">
                                        <div className="h-full w-full rounded-full bg-[var(--frame-surface)] flex items-center justify-center">
                                            <span className="text-3xl font-bold text-[var(--shell-foreground)]">
                                                {user.username.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* User Info */}
                                <div className="flex-1 text-center sm:text-left">
                                    <h1 className="text-2xl font-bold mb-2">{user.username}</h1>
                                    <div className="flex flex-col sm:flex-row gap-4 text-sm text-[var(--shell-foreground)]/70">
                                        {user.email && (
                                            <div className="flex items-center gap-2 justify-center sm:justify-start">
                                                <Mail className="h-4 w-4" />
                                                {user.email}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                                            <Calendar className="h-4 w-4" />
                                            Member since {formatDate((user as any).created_at)}
                                        </div>
                                    </div>
                                </div>

                                {/* Logout Button */}
                                <Button
                                    variant="outline"
                                    onClick={handleLogout}
                                    className="gap-2"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sign Out
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <Card className="border-[var(--frame-border)] bg-[var(--frame-surface)] backdrop-blur-3xl">
                            <CardContent className="p-6 text-center">
                                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                                    <Shirt className="h-6 w-6 text-blue-500" />
                                </div>
                                <p className="text-2xl font-bold">{stats.clothing}</p>
                                <p className="text-sm text-[var(--shell-foreground)]/60">Wardrobe Items</p>
                            </CardContent>
                        </Card>
                        <Card className="border-[var(--frame-border)] bg-[var(--frame-surface)] backdrop-blur-3xl">
                            <CardContent className="p-6 text-center">
                                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
                                    <Sparkles className="h-6 w-6 text-purple-500" />
                                </div>
                                <p className="text-2xl font-bold">{stats.outfits}</p>
                                <p className="text-sm text-[var(--shell-foreground)]/60">Generated Outfits</p>
                            </CardContent>
                        </Card>
                        <Card className="border-[var(--frame-border)] bg-[var(--frame-surface)] backdrop-blur-3xl">
                            <CardContent className="p-6 text-center">
                                <div className="h-12 w-12 rounded-full bg-pink-500/10 flex items-center justify-center mx-auto mb-3">
                                    <ImageIcon className="h-6 w-6 text-pink-500" />
                                </div>
                                <p className="text-2xl font-bold">{stats.models}</p>
                                <p className="text-sm text-[var(--shell-foreground)]/60">Model Photos</p>
                            </CardContent>
                        </Card>
                        <Card className="border-[var(--frame-border)] bg-[var(--frame-surface)] backdrop-blur-3xl">
                            <CardContent className="p-6 text-center">
                                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                                    <Heart className="h-6 w-6 text-red-500" />
                                </div>
                                <p className="text-2xl font-bold">{stats.favorites}</p>
                                <p className="text-sm text-[var(--shell-foreground)]/60">Favorite Looks</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Settings Section */}
                    <Card className="border-[var(--frame-border)] bg-[var(--frame-surface)] backdrop-blur-3xl shadow-[var(--frame-shadow)]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Account Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--panel-surface)] border border-[var(--panel-border)]">
                                <div>
                                    <p className="font-medium">Theme</p>
                                    <p className="text-sm text-[var(--shell-foreground)]/60">Choose your preferred appearance</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant={theme === 'light' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setTheme('light')}
                                        className="gap-2"
                                    >
                                        <Sun className="h-4 w-4" />
                                        Light
                                    </Button>
                                    <Button
                                        variant={theme === 'dark' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setTheme('dark')}
                                        className="gap-2"
                                    >
                                        <Moon className="h-4 w-4" />
                                        Dark
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--panel-surface)] border border-[var(--panel-border)]">
                                <div>
                                    <p className="font-medium">User ID</p>
                                    <p className="text-sm text-[var(--shell-foreground)]/60">Your unique identifier</p>
                                </div>
                                <code className="px-3 py-1 rounded-lg bg-[var(--shell-bg)] text-sm">
                                    #{user.id}
                                </code>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
