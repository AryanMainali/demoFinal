'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';

export type UserRole = 'STUDENT' | 'FACULTY' | 'ASSISTANT' | 'ADMIN';

export interface User {
    id: number;
    email: string;
    full_name: string;
    role: UserRole;
    student_id?: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    last_login?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (userData: any) => Promise<void>;
}

const ROLE_HOME: Record<UserRole, string> = {
    STUDENT: '/student/dashboard',
    FACULTY: '/faculty/dashboard',
    ASSISTANT: '/assistant/dashboard',
    ADMIN: '/admin/users',
};

function setRoleCookie(role: string) {
    if (typeof window === 'undefined') return;
    const maxAge = 60 * 60 * 24 * 7;
    document.cookie = `kriterion_role=${role}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `kriterion_auth=1; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearRoleCookie() {
    if (typeof window === 'undefined') return;
    document.cookie = 'kriterion_role=; path=/; max-age=0';
    document.cookie = 'kriterion_auth=; path=/; max-age=0';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (!user || typeof window === 'undefined') return;

        const keepSessionAlive = async () => {
            if (document.visibilityState !== 'visible') return;
            try {
                await apiClient.refreshAccessToken();
            } catch (error) {
                console.error('Session refresh failed:', error);
                apiClient.clearTokens();
                clearRoleCookie();
                setUser(null);
                router.push('/login');
            }
        };

        // Refresh periodically during active use to avoid timeout while coding.
        const intervalId = window.setInterval(() => {
            void keepSessionAlive();
        }, 4 * 60 * 1000);

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                void keepSessionAlive();
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [user, router]);

    const checkAuth = async () => {
        try {
            const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            if (!accessToken) {
                setIsLoading(false);
                return;
            }

            const userData = await apiClient.getCurrentUser();
            setUser(userData);
            setRoleCookie(userData.role);
        } catch (error) {
            console.error('Auth check failed:', error);
            apiClient.clearTokens();
            clearRoleCookie();
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = useCallback(async (email: string, password: string) => {
        try {
            const data = await apiClient.login(email, password);
            const userData = data.user ?? await apiClient.getCurrentUser();
            setUser(userData);
            setRoleCookie(userData.role);

            const home = ROLE_HOME[userData.role as UserRole] || '/';
            router.push(home);
        } catch (error: any) {
            console.error('Login failed:', error);
            throw new Error(error.response?.data?.detail || 'Login failed');
        }
    }, [router]);

    const logout = useCallback(() => {
        void apiClient.logout();
        clearRoleCookie();
        setUser(null);
        router.push('/login');
    }, [router]);

    const register = useCallback(async (userData: any) => {
        try {
            await apiClient.register(userData);
            router.push('/login');
        } catch (error: any) {
            console.error('Registration failed:', error);
            throw new Error(error.response?.data?.detail || 'Registration failed');
        }
    }, [router]);

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
