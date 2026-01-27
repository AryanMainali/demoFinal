'use client';

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

export interface DropdownItem {
    label?: string
    value?: string
    icon?: React.ReactNode
    danger?: boolean
    disabled?: boolean
    divider?: boolean
    onClick?: () => void
    className?: string
}

interface DropdownProps {
    trigger: React.ReactNode
    items: DropdownItem[]
    onSelect?: (value: string) => void
    align?: 'left' | 'right'
    className?: string
}

export function Dropdown({
    trigger,
    items,
    onSelect,
    align = 'left',
    className
}: DropdownProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const dropdownRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className={cn("relative inline-block", className)} ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)}>
                {trigger}
            </div>

            {isOpen && (
                <div
                    className={cn(
                        "absolute z-50 mt-2 min-w-[180px] py-1 bg-white rounded-lg border border-gray-200 shadow-lg",
                        align === 'right' ? 'right-0' : 'left-0'
                    )}
                >
                    {items.map((item, index) => {
                        if (item.divider) {
                            return <div key={index} className="my-1 border-t border-gray-200" />
                        }

                        return (
                            <button
                                key={item.value || index}
                                onClick={() => {
                                    if (!item.disabled) {
                                        if (item.onClick) {
                                            item.onClick()
                                        } else if (onSelect && item.value) {
                                            onSelect(item.value)
                                        }
                                        setIsOpen(false)
                                    }
                                }}
                                disabled={item.disabled}
                                className={cn(
                                    "w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors",
                                    item.disabled
                                        ? "text-gray-400 cursor-not-allowed"
                                        : item.danger
                                            ? "text-red-600 hover:bg-red-50"
                                            : "text-gray-700 hover:bg-gray-50",
                                    item.className
                                )}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// Dropdown with button trigger
interface DropdownButtonProps {
    label: string
    items: DropdownItem[]
    onSelect: (value: string) => void
    variant?: 'default' | 'outline'
    size?: 'sm' | 'md'
    className?: string
}

export function DropdownButton({
    label,
    items,
    onSelect,
    variant = 'default',
    size = 'md',
    className
}: DropdownButtonProps) {
    const buttonStyles = {
        default: "bg-[#862733] text-white hover:bg-[#6d1f2a]",
        outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
    }

    const sizeStyles = {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm"
    }

    return (
        <Dropdown
            trigger={
                <button className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
                    buttonStyles[variant],
                    sizeStyles[size],
                    className
                )}>
                    {label}
                    <ChevronDown className="w-4 h-4" />
                </button>
            }
            items={items}
            onSelect={onSelect}
            align="right"
        />
    )
}
