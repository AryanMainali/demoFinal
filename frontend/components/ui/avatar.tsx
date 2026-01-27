import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    src?: string | null
    alt?: string
    fallback?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
}

export function Avatar({
    src,
    alt = '',
    fallback,
    size = 'md',
    className,
    ...props
}: AvatarProps) {
    const [error, setError] = React.useState(false)

    const initials = fallback || alt
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    if (src && !error) {
        return (
            <div
                className={cn(
                    "relative rounded-full overflow-hidden bg-gray-100 flex-shrink-0",
                    sizeClasses[size],
                    className
                )}
                {...props}
            >
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-full object-cover"
                    onError={() => setError(true)}
                />
            </div>
        )
    }

    return (
        <div
            className={cn(
                "flex items-center justify-center rounded-full bg-[#862733] text-white font-medium flex-shrink-0",
                sizeClasses[size],
                className
            )}
            {...props}
        >
            {initials}
        </div>
    )
}
