import { cn } from "@/lib/utils"

interface ProgressProps {
    value: number
    max?: number
    size?: 'sm' | 'md' | 'lg'
    variant?: 'default' | 'success' | 'warning' | 'danger'
    showLabel?: boolean
    className?: string
}

const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
}

const variantStyles = {
    default: 'bg-[#862733]',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
}

export function Progress({
    value,
    max = 100,
    size = 'md',
    variant = 'default',
    showLabel = false,
    className
}: ProgressProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    return (
        <div className={cn("w-full", className)}>
            {showLabel && (
                <div className="flex justify-between mb-1 text-sm">
                    <span className="text-gray-600">{value} / {max}</span>
                    <span className="text-gray-500">{percentage.toFixed(0)}%</span>
                </div>
            )}
            <div className={cn(
                "w-full rounded-full bg-gray-200 overflow-hidden",
                sizeStyles[size]
            )}>
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-300 ease-out",
                        variantStyles[variant]
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    )
}
