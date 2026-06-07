// components/FloatingIcon.tsx
'use client';

import React, { useState, useRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface FloatingIconProps {
  Icon: LucideIcon;
}

export default function FloatingIcon({ Icon }: FloatingIconProps) {
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovered(true);
    timeoutRef.current = setTimeout(() => setIsHovered(false), 2000);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Keep glow for a moment then fade out
    timeoutRef.current = setTimeout(() => setIsHovered(false), 400);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      // CSS in hero.css takes full control of color/filter — no inline overrides
      className={`icon-container${isHovered ? ' icon-hovered' : ''}`}
    >
      <Icon
        size={16}
        strokeWidth={2.5}
        // No inline color — let .icon-container and .icon-container:hover CSS rules win
      />
    </div>
  );
}