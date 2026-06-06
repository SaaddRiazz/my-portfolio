// components/FloatingIcon.tsx
'use client';

import React, { useState, useRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface FloatingIconProps {
  Icon: LucideIcon;
}

const solidRainbowColors = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e', 
  '#06b6d4', '#3b82f6', '#a855f7', '#ec4899'
];

export default function FloatingIcon({ Icon }: FloatingIconProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [activeColor, setActiveColor] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const randomColor = solidRainbowColors[Math.floor(Math.random() * solidRainbowColors.length)];
    setActiveColor(randomColor);
    setIsHovered(true);

    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 2000);
  };

  return (
    <div onMouseEnter={handleMouseEnter} className="icon-container">
      <div 
        className={`transform transition-all duration-300 ${isHovered ? 'scale-125 z-20' : ''}`}
        style={{
          color: isHovered ? activeColor : 'rgb(228, 231, 235)',
          fill: isHovered ? activeColor : 'transparent',
          display: 'inline-flex'
        }}
      >
        <Icon size={16} className="w-4 h-4 transition-colors duration-200" strokeWidth={2.5} />
      </div>
    </div>
  );
}