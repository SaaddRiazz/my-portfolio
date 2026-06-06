// components/HeroSection.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Typewriter from './Typewriter';
import FloatingIcon from './FloatingIcon';
import '../styles/hero.css'; 
import { 
  Gamepad2, Laptop, Smartphone, Keyboard, Tv, Database, 
  Code2, Headphones, Cpu, Rocket, Lightbulb, Command, 
  Binary, FolderGit2, Blocks, Radio, HardDrive, Joystick,
  Terminal, Shield, Layers, Layout, Monitor, Globe, 
  Server, Share2, Disc, KeyRound, Wrench
} from 'lucide-react';

const iconPool = [
  Gamepad2, Laptop, Smartphone, Keyboard, Tv, Database, 
  Code2, Headphones, Cpu, Rocket, Lightbulb, Command,
  Binary, FolderGit2, Blocks, Radio, HardDrive, Joystick,
  Terminal, Shield, Layers, Layout, Monitor, Globe,
  Server, Share2, Disc, KeyRound, Wrench
];

interface GridItem {
  id: string;
  iconIndex: number;
  gridX: number; 
  gridY: number; 
}

export default function HeroSection() {
  const roles = [
    'Software Engineer.',
    'Game Developer.',
    'Web Developer.',
    'Android App Developer.',
    'AI Engineer.',
  ];

  // High-Density Configuration Metrics
  const stepX = 48; // Extremely tight horizontal packing (in pixels)
  const stepY = 48; // Extremely tight vertical packing (in pixels)
  const gridWidth = 70; // Expanded column pool to overflow large monitors safely
  const gridHeight = 45; // Expanded row pool to satisfy screen heights

  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // 1. Generate a uniform structural layout matrix
  const gridItems = useMemo(() => {
    const items: GridItem[] = [];
    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        items.push({
          id: `${x}-${y}`,
          iconIndex: Math.floor(Math.random() * iconPool.length),
          gridX: x,
          gridY: y,
        });
      }
    }
    return items;
  }, []);

  // 2. Hardware-accelerated dynamic drift velocity thread
  useEffect(() => {
    let animationFrameId: number;
    const speed = 0.35; // Pixels per frame drift factor

    const updateFrame = () => {
      setOffset((prev) => ({
        x: prev.x + speed,
        y: prev.y + speed
      }));
      animationFrameId = requestAnimationFrame(updateFrame);
    };

    animationFrameId = requestAnimationFrame(updateFrame);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const totalWidthPx = gridWidth * stepX;
  const totalHeightPx = gridHeight * stepY;

  return (
    <section id="home" className="hero">
      
      {/* HIGH-DENSITY SEAMLESS INTERLOCKING GRID LAYER */}
      <div className="stream-matrix-field">
        {gridItems.map((item) => {
          // Stagger alternate vertical lines by half a step to compress empty pockets
          const stagger = (item.gridY % 2) * (stepX / 2);
          const initialX = item.gridX * stepX + stagger;
          const initialY = item.gridY * stepY;

          // Process positions through a strict modulo rule to guarantee wrapping behavior
          let currentX = (initialX + offset.x) % totalWidthPx;
          let currentY = (initialY + offset.y) % totalHeightPx;

          if (currentX < 0) currentX += totalWidthPx;
          if (currentY < 0) currentY += totalHeightPx;

          const TargetIcon = iconPool[item.iconIndex];

          return (
            <FloatingIcon 
              key={item.id} 
              Icon={TargetIcon} 
              pixelX={currentX} 
              pixelY={currentY} 
            />
          );
        })}
      </div>

      {/* FOREGROUND HERO CONTENT */}
      <div className="hero-content">
        <h1 className="animate-slide-left">
          Hello, I&apos;m <span className="name">Saad</span>.
        </h1>

        <p className="subtitle animate-slide-right">
          <Typewriter words={roles} startDelay={1300} />
        </p>

        <a href="#about" className="view-work-btn animate-fade-up">
          View my work <span className="arrow">↓</span>
        </a>
      </div>
      
    </section>
  );
}