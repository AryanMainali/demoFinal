import * as React from "react"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle, Info, XCircle, X } from "lucide-react"

interface AlertProps {
    type: 'success' | 'error' | 'warning' | 'info'
    title?: string
    children: React.ReactNode
    onClose?: () => void
    className?: string
}

const alertStyles = {
    success: {
        container: 'bg-green-50 border-green-200 text-green-800',
        icon: 'text-green-500',
        Icon: CheckCircle
    },
    error: {
        container: 'bg-red-50 border-red-200 text-red-800',
        icon: 'text-red-500',
        Icon: XCircle
    },
    warning: {
        container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        icon: 'text-yellow-500',
        Icon: AlertCircle
    },
    info: {
        container: 'bg-blue-50 border-blue-200 text-blue-800',
        icon: 'text-blue-500',
        Icon: Info
    }
}

export function Alert({ type, title, children, onClose, className }: AlertProps) {
    const styles = alertStyles[type]
    const IconComponent = styles.Icon

    return (
        <div className={cn(
            "flex gap-3 p-4 rounded-lg border",
            styles.container,
            className
        )}>
            <IconComponent className={cn("w-5 h-5 flex-shrink-0 mt-0.5", styles.icon)} />
            <div className="flex-1 min-w-0">
                {title && (
                    <h4 className="font-medium mb-1">{title}</h4>
                )}
                <div className="text-sm">{children}</div>
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="p-1 rounded hover:bg-black/5 transition-colors flex-shrink-0"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    )
}
