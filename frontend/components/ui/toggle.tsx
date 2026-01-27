'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ToggleProps {
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
    label?: string;
}

export function Toggle({
    checked = false,
    onChange,
    disabled = false,
    className,
    label,
}: ToggleProps): React.JSX.Element {
    const handleClick = (): void => {
        if (!disabled && onChange) {
            onChange(!checked);
        }
    };

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={handleClick}
            className={cn(
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#862733] focus:ring-offset-2',
                checked ? 'bg-[#862733]' : 'bg-gray-200',
                disabled && 'opacity-50 cursor-not-allowed',
                className
            )}
        >
            <span
                className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    checked ? 'translate-x-5' : 'translate-x-0'
                )}
            />
        </button>
    );
}

export default Toggle;
