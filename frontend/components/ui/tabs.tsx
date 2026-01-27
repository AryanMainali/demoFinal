'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

interface Tab {
    id: string
    label: string
    icon?: React.ReactNode
    count?: number
}

interface TabsProps {
    tabs: Tab[]
    activeTab: string
    onTabChange: (tabId: string) => void
    className?: string
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
    return (
        <div className={cn("border-b border-gray-200", className)}>
            <nav className="flex gap-4 -mb-px overflow-x-auto" aria-label="Tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                            activeTab === tab.id
                                ? "border-[#862733] text-[#862733]"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        )}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className={cn(
                                "px-2 py-0.5 text-xs rounded-full",
                                activeTab === tab.id
                                    ? "bg-[#862733]/10 text-[#862733]"
                                    : "bg-gray-100 text-gray-600"
                            )}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </nav>
        </div>
    )
}

interface TabPanelProps {
    children: React.ReactNode
    className?: string
}

export function TabPanel({ children, className }: TabPanelProps) {
    return (
        <div className={cn("py-4", className)}>
            {children}
        </div>
    )
}
