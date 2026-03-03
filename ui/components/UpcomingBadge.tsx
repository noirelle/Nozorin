import React from 'react';

interface UpcomingBadgeProps {
    className?: string;
    variant?: 'default' | 'small';
}

export const UpcomingBadge: React.FC<UpcomingBadgeProps> = ({ className = "", variant = 'default' }) => {
    const sizeClasses = variant === 'small'
        ? "text-[8px] px-1.5 py-0"
        : "text-[10px] px-2 py-0.5";

    return (
        <span className={`inline-flex items-center font-bold text-pink-600 bg-pink-50 rounded-full uppercase tracking-tighter shadow-sm border border-pink-100 ${sizeClasses} ${className}`}>
            Upcoming
        </span>
    );
};
