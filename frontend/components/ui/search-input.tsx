'use client';

import * as React from "react"
import { cn } from "@/lib/utils"
import { Search, X } from "lucide-react"

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: string
    onChange: (value: string) => void
    onSearch?: (value: string) => void
    className?: string
}

export function SearchInput({
    value,
    onChange,
    onSearch,
    placeholder = "Search...",
    className,
    ...props
}: SearchInputProps) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && onSearch) {
            onSearch(value)
        }
    }

    return (
        <div className={cn("relative", className)}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={cn(
                    "w-full h-10 pl-10 pr-10 rounded-lg border border-gray-300 bg-white text-sm",
                    "placeholder:text-gray-400",
                    "focus:outline-none focus:ring-2 focus:ring-[#862733] focus:border-transparent",
                    "transition-all duration-200"
                )}
                {...props}
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    )
}
