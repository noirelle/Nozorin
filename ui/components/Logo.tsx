'use client';

import React from 'react';

export const NozorinLogo = ({
    className = 'w-10 h-10',
    color = '#FF8ba7',
}: {
    className?: string;
    color?: string;
}) => {
    return (
        <svg
            viewBox="0 0 40 40"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Rounded square background */}
            <rect width="40" height="40" rx="12" fill={color} />

            {/* Eyes */}
            <circle cx="12" cy="15" r="3.5" fill="white" />
            <circle cx="28" cy="15" r="3.5" fill="white" />

            {/* Smile */}
            <path
                d="M10 25C10 25 14 32 20 32C26 32 30 25 30 25"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
            />
        </svg>
    );
};

export default NozorinLogo;
