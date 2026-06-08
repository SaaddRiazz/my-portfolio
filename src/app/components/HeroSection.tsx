'use client';

import React, { useEffect, useState } from 'react';
import Typewriter from './Typewriter';
import '../styles/hero.css'; 

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const roles = [
    'Game Developer.',
    'Full Stack Web Developer.',
    'Android App Developer.',
  ];

  if (!mounted) {
    return <section id="home" className="hero" />;
  }

  return (
    <section id="home" className="hero">
      <div className="hero-content">
        <h1 className="animate-slide-left">
          Hello, I&apos;m <span className="name">Saad</span>.
        </h1>

        <p className="subtitle animate-slide-right">
          <Typewriter words={roles} startDelay={1300}/>
        </p>

        <a href="#about" className="backdrop-blur-md view-work-btn animate-fade-up">
          View my work <span className="arrow">↓</span>
        </a>
      </div>
    </section>
  );
}