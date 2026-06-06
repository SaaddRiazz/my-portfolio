// components/FloatingIcon.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';

interface FloatingIconProps {
  Icon: LucideIcon;
  pixelX: number;
  pixelY: number;
}

// Solid rainbow color palette for active hover fills
const solidRainbowColors = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
];

export default function FloatingIcon({ Icon, pixelX, pixelY }: FloatingIconProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeColor, setActiveColor] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const randomColor = solidRainbowColors[Math.floor(Math.random() * solidRainbowColors.length)];
    setActiveColor(randomColor);
    setIsHovered(true);

    // Reverts back to baseline muted profile after exactly 2 seconds (2000ms)
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 2000);
  };

  if (!isMounted) return null;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      className={`
        absolute select-none transform transition-transform duration-300 pointer-events-auto
        ${isHovered ? 'scale-125 z-20' : 'hover:scale-115'}
      `}
      style={{
        left: `${pixelX}px`,
        top: `${pixelY}px`,
        color: isHovered ? activeColor : 'rgb(222, 225, 228)',
        fill: isHovered ? activeColor : 'transparent', // Solid, un-gradient shape interior fill toggle
        transform: 'translate(-50%, -50%) rotate(45deg)', // Perfect 45-degree rotation lock
      }}
    >
      <Icon size={20} className="w-5 h-5 transition-colors duration-200" strokeWidth={2.5} />
    </div>
  );
}