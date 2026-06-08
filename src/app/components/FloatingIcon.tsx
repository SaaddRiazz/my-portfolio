'use client';

import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface FloatingIconProps {
  Icon: LucideIcon;
}

const FloatingIcon = React.memo(({ Icon }: FloatingIconProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    if (isHovered) {
      setIsHovered(false);
      requestAnimationFrame(() => {
        setIsHovered(true);
      });
    } else {
      setIsHovered(true);
    }
  };

  const handleAnimationEnd = () => {
    setIsHovered(false);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onAnimationEnd={handleAnimationEnd}
      className={`icon-container ${isHovered ? 'icon-hovered' : ''}`}
    >
      <Icon size={16} strokeWidth={2.5} />
    </div>
  );
});

FloatingIcon.displayName = 'FloatingIcon';
export default FloatingIcon;