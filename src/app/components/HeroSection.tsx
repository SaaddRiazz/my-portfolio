'use client';

import React, { useEffect, useState, useRef } from 'react';
import Typewriter from './Typewriter';
import '../styles/hero.css';

interface Bug {
  id: number;
  text: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;           
  vy: number;
  speed: number;
  width: number;
  height: number;
  isDying: boolean;
  deathTime: number;
  hasLaserAssigned: boolean;
  changeDirTimer: number; 
}

interface Laser {
  x: number;
  y: number;
  vx: number;          
  vy: number;          
  speed: number;       
  maxTurnForce: number; 
  color: string;
  targetBugId: number;
  trail: { x: number; y: number }[]; 
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

// EXPANDED: Broader catalog of retro arcade programming bug types
const BUG_TYPES = [
  '404', 'SEGFAULT', 'NULL_PTR', '∞_LOOP', 'CRASH', 
  'OOM_KILL', 'SYNTAX_ERR', 'STACK_OVFL', 'DEADLOCK', 'DIV_BY_0'
];

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null); // Node reference targeting the fullstop punctuation mark
  
  const bugsRef = useRef<Bug[]>([]);
  const lasersRef = useRef<Laser[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastSpawnRef = useRef<number>(0);
  const isGlitchingRef = useRef<boolean>(false);
  const glitchTimerRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let animId: number;

    const gameLoop = (timestamp: number) => {
      animId = requestAnimationFrame(gameLoop);
      
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // MODIFIED: Dynamically read and trace coordinates relative directly to the text fullstop node (.)
      let originX = W / 2;
      let originY = H / 2 - 50;

      if (dotRef.current && heroRef.current) {
        const dotRect = dotRef.current.getBoundingClientRect();
        const heroRect = heroRef.current.getBoundingClientRect();
        originX = (dotRect.left - heroRect.left) + dotRect.width / 2;
        originY = (dotRect.top - heroRect.top) + dotRect.height / 2;
      } else if (nameRef.current && heroRef.current) {
        const nameRect = nameRef.current.getBoundingClientRect();
        const heroRect = heroRef.current.getBoundingClientRect();
        originX = (nameRect.left - heroRect.left) + nameRect.width / 2;
        originY = (nameRect.top - heroRect.top) + nameRect.height / 2;
      }

      const MARGIN = 60; 

      // 1. RANDOM DRIFT BUG SPAWNING ENGINE
      if (timestamp - lastSpawnRef.current > 1600 && bugsRef.current.filter(b => !b.isDying).length < 5) {
        const text = BUG_TYPES[Math.floor(Math.random() * BUG_TYPES.length)];
        ctx.font = 'normal 1.1rem "RainyHearts", monospace';
        const metrics = ctx.measureText(text);
        
        const edge = Math.floor(Math.random() * 4);
        let x = 0, y = 0;
        if (edge === 0) { x = Math.random() * W; y = -20; }
        if (edge === 1) { x = W + 20; y = Math.random() * H; }
        if (edge === 2) { x = Math.random() * W; y = H + 20; }
        if (edge === 3) { x = -40; y = Math.random() * H; }

        const initialTargetX = MARGIN + Math.random() * (W - MARGIN * 2);
        const initialTargetY = MARGIN + Math.random() * (H - MARGIN * 2);

        bugsRef.current.push({
          id: Math.random(),
          text,
          x,
          y,
          targetX: initialTargetX,
          targetY: initialTargetY,
          vx: 0,
          vy: 0,
          speed: 2.5 + Math.random() * 1.2, 
          width: metrics.width + 12,
          height: 22,
          isDying: false,
          deathTime: 0,
          hasLaserAssigned: false,
          changeDirTimer: 0
        });
        lastSpawnRef.current = timestamp;
      }

      // 2. PROJECTILE LAUNCH LOCKMATRIX 
      const targetableBugs = bugsRef.current.filter(b => !b.isDying && !b.hasLaserAssigned);
      
      if (targetableBugs.length > 0) {
        const targetBug = targetableBugs[0];
        targetBug.hasLaserAssigned = true; 

        const angleToBug = Math.atan2(targetBug.y - originY, targetBug.x - originX);
        const obliqueAngle = angleToBug + (Math.random() > 0.5 ? 0.9 : -0.9); 

        const laserSpeed = 2.4; 

        lasersRef.current.push({
          x: originX,
          y: originY,
          vx: Math.cos(obliqueAngle) * laserSpeed,
          vy: Math.sin(obliqueAngle) * laserSpeed,
          speed: laserSpeed,
          maxTurnForce: 0.11, 
          color: Math.random() > 0.5 ? '#00d4ff' : '#ff2d78',
          targetBugId: targetBug.id,
          trail: [{ x: originX, y: originY }]
        });

        isGlitchingRef.current = true;
        glitchTimerRef.current = timestamp + 120;
      }

      if (isGlitchingRef.current && timestamp > glitchTimerRef.current) {
        isGlitchingRef.current = false;
        if (nameRef.current) nameRef.current.style.transform = 'none';
        if (dotRef.current) dotRef.current.style.transform = 'none';
      }

      if (isGlitchingRef.current && nameRef.current && dotRef.current) {
        const sharedGlitchStr = `translate(${(Math.random() - 0.5) * 6}px, ${(Math.random() - 0.5) * 3}px) skewX(${(Math.random() - 0.5) * 8}deg)`;
        nameRef.current.style.transform = sharedGlitchStr;
        dotRef.current.style.transform = sharedGlitchStr;
      }

      // 3. EVASIVE CHAOTIC RANDOM DRIFT CALCULATOR FOR BUGS
      bugsRef.current = bugsRef.current.filter(bug => {
        if (bug.isDying) {
          if (timestamp - bug.deathTime > 250) return false;
          ctx.fillStyle = Math.random() > 0.5 ? '#ff2d78' : '#ffe600';
          ctx.font = 'normal 1.1rem "RainyHearts", monospace';
          ctx.fillText('⚡_ERR', bug.x + (Math.random() - 0.5) * 6, bug.y);
          return true;
        }

        bug.changeDirTimer--;
        if (bug.changeDirTimer <= 0 || Math.hypot(bug.targetX - bug.x, bug.targetY - bug.y) < 15) {
          bug.targetX = MARGIN + Math.random() * (W - MARGIN * 2);
          bug.targetY = MARGIN + Math.random() * (H - MARGIN * 2);
          bug.changeDirTimer = 40 + Math.floor(Math.random() * 50); 
        }

        const dx = bug.targetX - bug.x;
        const dy = bug.targetY - bug.y;
        const dist = Math.hypot(dx, dy) || 1;

        bug.vx += (dx / dist) * 0.25;
        bug.vy += (dy / dist) * 0.25;

        const currSpeed = Math.hypot(bug.vx, bug.vy) || 1;
        if (currSpeed > bug.speed) {
          bug.vx = (bug.vx / currSpeed) * bug.speed;
          bug.vy = (bug.vy / currSpeed) * bug.speed;
        }

        bug.x += bug.vx;
        bug.y += bug.vy;

        ctx.fillStyle = 'rgba(17, 13, 36, 0.9)';
        ctx.strokeStyle = '#ff2d78';
        ctx.lineWidth = 1.5;
        ctx.fillRect(bug.x - bug.width / 2, bug.y - 14, bug.width, bug.height);
        ctx.strokeRect(bug.x - bug.width / 2, bug.y - 14, bug.width, bug.height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'normal 1.1rem "RainyHearts", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(bug.text, bug.x, bug.y + 2);

        return true;
      });

      // 4. STEERING HOMING PHYSICS CORE FOR MISSILES (DRAMATIC ORBITING EFFECTS)
      lasersRef.current = lasersRef.current.filter(laser => {
        const associatedBug = bugsRef.current.find(b => b.id === laser.targetBugId && !b.isDying);

        if (!associatedBug) return false;

        const desiredAngle = Math.atan2(associatedBug.y - laser.y, associatedBug.x - laser.x);
        const currentAngle = Math.atan2(laser.vy, laser.vx);

        let angleDelta = desiredAngle - currentAngle;
        while (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
        while (angleDelta > Math.PI) angleDelta -= Math.PI * 2;

        let newAngle = currentAngle;
        if (Math.abs(angleDelta) < laser.maxTurnForce) {
          newAngle = desiredAngle;
        } else {
          newAngle += Math.sign(angleDelta) * laser.maxTurnForce;
        }

        laser.vx = Math.cos(newAngle) * laser.speed;
        laser.vy = Math.sin(newAngle) * laser.speed;

        laser.x += laser.vx;
        laser.y += laser.vy;

        laser.trail.push({ x: laser.x, y: laser.y });
        if (laser.trail.length > 30) {
          laser.trail.shift(); 
        }

        const hitDistance = Math.hypot(laser.x - associatedBug.x, laser.y - associatedBug.y);
        
        if (hitDistance < (associatedBug.width / 2 + 6)) {
          associatedBug.isDying = true;
          associatedBug.deathTime = timestamp;

          for (let p = 0; p < 10; p++) {
            const pAngle = Math.random() * Math.PI * 2;
            const pSpeed = 1 + Math.random() * 2.5;
            particlesRef.current.push({
              x: associatedBug.x,
              y: associatedBug.y,
              vx: Math.cos(pAngle) * pSpeed,
              vy: Math.sin(pAngle) * pSpeed,
              color: laser.color,
              alpha: 1.0,
              size: 2 + Math.random() * 1.5
            });
          }
          return false;
        }

        if (laser.trail.length > 1) {
          ctx.beginPath();
          ctx.strokeStyle = laser.color;
          ctx.lineWidth = 3.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.moveTo(laser.trail[0].x, laser.trail[0].y);
          for (let i = 1; i < laser.trail.length; i++) {
            ctx.lineTo(laser.trail[i].x, laser.trail[i].y);
          }
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(laser.x, laser.y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      // 5. EXPLOSIVE GLITCH FRAGMENT RENDERER
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;

        if (p.alpha <= 0) return false;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.globalAlpha = 1.0;

        return true;
      });
    };

    animId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [mounted]);

  const roles = [
    'Game Developer.',
    'Full Stack Web Developer.',
    'Android App Developer.',
  ];

  if (!mounted) {
    return <section id="home" className="hero" />;
  }

  return (
    <section id="home" className="hero" ref={heroRef}>
      <canvas ref={canvasRef} className="arcade-simulation-canvas" />

      <div className="hero-content">
        <h1 className="animate-slide-left">
          Hello, I&apos;m <span className="name" ref={nameRef}>Saad</span>
          {/* MODIFIED: Separate tracking wrapper element wrapping the fullstop weapon origin */}
          <span className="name" ref={dotRef} style={{ display: 'inline-block' }}>.</span>
        </h1>

        <p className="subtitle animate-slide-right">
          <Typewriter words={roles} startDelay={1300} />
        </p>

        <a href="#about" className="backdrop-blur-md view-work-btn animate-fade-up">
          View my work <span className="arrow">↓</span>
        </a>
      </div>
    </section>
  );
}