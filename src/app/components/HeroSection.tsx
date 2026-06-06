// components/HeroSection.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
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

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const roles = [
    'Software Engineer.',
    'Game Developer.',
    'Web Developer.',
    'Android App Developer.',
    'AI Engineer.',
  ];

  const totalRows = 24; 
  const uniqueIconsPerRow = 28; 

  // Generates unique random icon tracks for each separate layout line item
  const randomizedMatrix = useMemo(() => {
    const matrix: number[][] = [];
    for (let r = 0; r < totalRows; r++) {
      const rowSequence: number[] = [];
      for (let i = 0; i < uniqueIconsPerRow; i++) {
        rowSequence.push(Math.floor(Math.random() * iconPool.length));
      }
      matrix.push(rowSequence);
    }
    return matrix;
  }, []);

  if (!mounted) {
    return <section id="home" className="hero" />;
  }

  return (
    <section id="home" className="hero">
      
      {/* UNIFIED SINGLE-DIRECTION HIGH-DENSITY GRID LAYER */}
      <div className="stream-matrix-field">
        {randomizedMatrix.map((rowSequence, rowIndex) => {
          return (
            <div key={rowIndex} className="grid-row move-left">
              {/* Duplicates sequence to ensure pixel-perfect loop connections */}
              {[...rowSequence, ...rowSequence].map((iconIdx, itemIdx) => {
                const TargetIcon = iconPool[iconIdx];
                return <FloatingIcon key={itemIdx} Icon={TargetIcon} />;
              })}
            </div>
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