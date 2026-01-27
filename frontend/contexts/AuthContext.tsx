'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';

export type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN';

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check if user is logged in on mount
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            if (!accessToken) {
                setIsLoading(false);
                return;
            }

            const userData = await apiClient.getCurrentUser();
            setUser(userData);
        } catch (error) {
            console.error('Auth check failed:', error);
            apiClient.clearTokens();
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            await apiClient.login(email, password);
            const userData = await apiClient.getCurrentUser();
            setUser(userData);

            // Redirect based on role
            switch (userData.role) {
                case 'STUDENT':
                    router.push('/student/dashboard');
                    break;
                case 'FACULTY':
                    router.push('/faculty/dashboard');
                    break;
                case 'ADMIN':
                    router.push('/admin/dashboard');
                    break;
                default:
                    router.push('/');
            }
        } catch (error: any) {
            console.error('Login failed:', error);
            throw new Error(error.response?.data?.detail || 'Login failed');
        }
    };

    const logout = () => {
        apiClient.logout();
        setUser(null);
        router.push('/login');
    };

    const register = async (userData: any) => {
        try {
            await apiClient.register(userData);
            router.push('/login');
        } catch (error: any) {
            console.error('Registration failed:', error);
            throw new Error(error.response?.data?.detail || 'Registration failed');
        }
    };

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
