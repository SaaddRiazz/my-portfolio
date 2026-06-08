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
  targetBugId: number | null; 
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

const BUG_TYPES = [
  '404', 'SEGFAULT', 'NULL_PTR', '∞_LOOP', 'CRASH', 
  'OOM_KILL', 'SYNTAX_ERR', 'STACK_OVFL', 'DEADLOCK', 'DIV_BY_0'
];

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null); 
  
  const bugsRef = useRef<Bug[]>([]);
  const lasersRef = useRef<Laser[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastSpawnRef = useRef<number>(0);
  const isGlitchingRef = useRef<boolean>(false);
  const glitchTimerRef = useRef<number>(0);

  const userScoreRef = useRef<number>(0);
  const systemScoreRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGameplayClick = (e: React.PointerEvent<HTMLDivElement>) => {
    if (systemScoreRef.current >= 50 || (userScoreRef.current >= systemScoreRef.current + 10)) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const isMobile = window.innerWidth < 768;

    bugsRef.current.forEach(bug => {
      if (bug.isDying) return;

      const CLICK_PADDING = isMobile ? 18 : 24; 
      const halfW = bug.width / 2 + CLICK_PADDING;
      const upperY = bug.y - 14 - CLICK_PADDING;
      const lowerY = bug.y + 8 + CLICK_PADDING;

      const isInsideBoundedBox = clickX >= bug.x - halfW && clickX <= bug.x + halfW && clickY >= upperY && clickY <= lowerY;
      const absoluteDistance = Math.hypot(clickX - bug.x, clickY - bug.y);
      
      const proximityRadius = isMobile ? 25 : 40;
      const isWithinProximityRadius = absoluteDistance < proximityRadius; 

      if (isInsideBoundedBox || isWithinProximityRadius) {
        bug.isDying = true;
        bug.deathTime = performance.now();
        userScoreRef.current += 1;

        lasersRef.current.forEach(laser => {
          if (laser.targetBugId === bug.id) {
            laser.targetBugId = null; 
          }
        });

        for (let p = 0; p < 15; p++) {
          const pAngle = Math.random() * Math.PI * 2;
          const pSpeed = isMobile ? 1.0 + Math.random() * 1.5 : 1.5 + Math.random() * 3.5;
          particlesRef.current.push({
            x: bug.x,
            y: bug.y,
            vx: Math.cos(pAngle) * pSpeed,
            vy: Math.sin(pAngle) * pSpeed,
            color: '#ffe600', 
            alpha: 1.0,
            size: 2.5 + Math.random() * 2
          });
        }
      }
    });
  };

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      bugsRef.current = [];
      lasersRef.current = [];
    };
    resize();
    window.addEventListener('resize', resize);

    let animId: number;

    const gameLoop = (timestamp: number) => {
      animId = requestAnimationFrame(gameLoop);
      
      const W = canvas.width;
      const H = canvas.height;
      const isMobile = W < 768;

      ctx.clearRect(0, 0, W, H);

      const isSystemWin = systemScoreRef.current >= 50;
      const isUserSpamStop = userScoreRef.current >= systemScoreRef.current + 10;
      const isGameOver = isSystemWin || isUserSpamStop;

      let originX = W / 2;
      let originY = H / 2 - 50;

      if (dotRef.current && heroRef.current) {
        const dotRect = dotRef.current.getBoundingClientRect();
        const heroRect = heroRef.current.getBoundingClientRect();
        originX = (dotRect.left - heroRect.left) + dotRect.width / 2;
        originY = (dotRect.top - heroRect.top) + dotRect.height / 2;
      }

      const MARGIN = isMobile ? 30 : 60; 

      if (isGameOver) {
        bugsRef.current = [];
        lasersRef.current = [];
      } else {
        // 1. BUG SPAWNING ENGINE (Original speeds on Desktop, Balanced on Phones)
        const maxBugs = isMobile ? 3 : 5;
        if (timestamp - lastSpawnRef.current > 1600 && bugsRef.current.filter(b => !b.isDying).length < maxBugs) {
          const text = BUG_TYPES[Math.floor(Math.random() * BUG_TYPES.length)];
          ctx.font = isMobile ? 'normal 0.9rem "RainyHearts", monospace' : 'normal 1.1rem "RainyHearts", monospace';
          const metrics = ctx.measureText(text);
          
          const edge = Math.floor(Math.random() * 4);
          let x = 0, y = 0;
          if (edge === 0) { x = Math.random() * W; y = -20; }
          if (edge === 1) { x = W + 20; y = Math.random() * H; }
          if (edge === 2) { x = Math.random() * W; y = H + 20; }
          if (edge === 3) { x = -40; y = Math.random() * H; }

          bugsRef.current.push({
            id: Math.random(),
            text,
            x,
            y,
            targetX: MARGIN + Math.random() * (W - MARGIN * 2),
            targetY: MARGIN + Math.random() * (H - MARGIN * 2),
            vx: 0,
            vy: 0,
            // Original fast speeds on desktop, moderate rhythm adjustments on phone screen
            speed: isMobile ? 1.0 + Math.random() * 0.5 : 2.2 + Math.random() * 1.2, 
            width: metrics.width + 12,
            height: isMobile ? 18 : 22,
            isDying: false,
            deathTime: 0,
            hasLaserAssigned: false,
            changeDirTimer: 0
          });
          lastSpawnRef.current = timestamp;
        }

        // 2. PROJECTILE LAUNCH SEQUENCER (Original behaviors on Desktop, Sweeping delay loops on Phones)
        const targetableBugs = bugsRef.current.filter(b => !b.isDying && !b.hasLaserAssigned);
        
        if (targetableBugs.length > 0) {
          const targetBug = targetableBugs[0];
          targetBug.hasLaserAssigned = true; 

          const angleToBug = Math.atan2(targetBug.y - originY, targetBug.x - originX);
          
          // Phone opens up the orbit angle for custom delays; Desktop snaps immediately
          const obliqueAngle = angleToBug + (isMobile ? (Math.random() > 0.5 ? 1.3 : -1.3) : (Math.random() > 0.5 ? 0.9 : -0.9)); 
          
          // Balanced speed configuration separation
          const laserSpeed = isMobile ? 1.4 : 2.4; 

          lasersRef.current.push({
            x: originX,
            y: originY,
            vx: Math.cos(obliqueAngle) * laserSpeed,
            vy: Math.sin(obliqueAngle) * laserSpeed,
            speed: laserSpeed,
            maxTurnForce: isMobile ? 0.05 : 0.11, 
            color: Math.random() > 0.5 ? '#00d4ff' : '#ff2d78',
            targetBugId: targetBug.id,
            trail: [{ x: originX, y: originY }]
          });

          isGlitchingRef.current = true;
          glitchTimerRef.current = timestamp + 120;
        }
      }

      if (isGlitchingRef.current && timestamp > glitchTimerRef.current) {
        isGlitchingRef.current = false;
        if (nameRef.current) nameRef.current.style.transform = 'none';
        if (dotRef.current) dotRef.current.style.transform = 'none';
      }

      if (isGlitchingRef.current && nameRef.current && dotRef.current && !isGameOver) {
        const sharedGlitchStr = `translate(${(Math.random() - 0.5) * 6}px, ${(Math.random() - 0.5) * 3}px) skewX(${(Math.random() - 0.5) * 8}deg)`;
        nameRef.current.style.transform = sharedGlitchStr;
        dotRef.current.style.transform = sharedGlitchStr;
      }

      // 3. DRIFT ENGINE FOR BUGS
      bugsRef.current = bugsRef.current.filter(bug => {
        if (bug.isDying) {
          if (timestamp - bug.deathTime > 250) return false;
          ctx.fillStyle = Math.random() > 0.5 ? '#ff2d78' : '#ffe600';
          ctx.font = isMobile ? 'normal 0.9rem "RainyHearts", monospace' : 'normal 1.1rem "RainyHearts", monospace';
          ctx.fillText('⚡_ERR', bug.x + (Math.random() - 0.5) * 6, bug.y);
          return true;
        }

        bug.changeDirTimer--;
        if (bug.changeDirTimer <= 0 || Math.hypot(bug.targetX - bug.x, bug.targetY - bug.y) < 15) {
          bug.targetX = MARGIN + Math.random() * (W - MARGIN * 2);
          bug.targetY = MARGIN + Math.random() * (H - MARGIN * 2);
          bug.changeDirTimer = isMobile ? 60 + Math.floor(Math.random() * 50) : 40 + Math.floor(Math.random() * 50); 
        }

        const dx = bug.targetX - bug.x;
        const dy = bug.targetY - bug.y;
        const dist = Math.hypot(dx, dy) || 1;

        // Steering adjustments
        bug.vx += (dx / dist) * (isMobile ? 0.08 : 0.25);
        bug.vy += (dy / dist) * (isMobile ? 0.08 : 0.25);

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
        
        const rectY = isMobile ? bug.y - 12 : bug.y - 14;
        ctx.fillRect(bug.x - bug.width / 2, rectY, bug.width, bug.height);
        ctx.strokeRect(bug.x - bug.width / 2, rectY, bug.width, bug.height);

        ctx.fillStyle = '#ffffff';
        ctx.font = isMobile ? 'normal 0.9rem "RainyHearts", monospace' : 'normal 1.1rem "RainyHearts", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(bug.text, bug.x, bug.y + (isMobile ? 1 : 2));

        return true;
      });

      // 4. HOMING LASER ENGINE
      lasersRef.current = lasersRef.current.filter(laser => {
        const associatedBug = laser.targetBugId !== null 
          ? bugsRef.current.find(b => b.id === laser.targetBugId && !b.isDying)
          : null;

        if (laser.targetBugId !== null && !associatedBug) {
          laser.targetBugId = null; 
        }

        if (laser.targetBugId === null) {
          laser.x += laser.vx;
          laser.y += laser.vy;

          const OFFSCREEN_PADDING = 100;
          if (
            laser.x < -OFFSCREEN_PADDING || 
            laser.x > W + OFFSCREEN_PADDING || 
            laser.y < -OFFSCREEN_PADDING || 
            laser.y > H + OFFSCREEN_PADDING
          ) {
            return false; 
          }
        } else if (associatedBug) {
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

          const hitDistance = Math.hypot(laser.x - associatedBug.x, laser.y - associatedBug.y);
          
          // Shrunk detection bounds on phone (12px) vs regular original width bounds on desktop
          const detectionThreshold = isMobile ? 12 : (associatedBug.width / 2 + 6);

          if (hitDistance < detectionThreshold) {
            associatedBug.isDying = true;
            associatedBug.deathTime = timestamp;
            systemScoreRef.current += 1;

            for (let p = 0; p < 10; p++) {
              const pAngle = Math.random() * Math.PI * 2;
              const pSpeed = isMobile ? 0.6 + Math.random() : 1 + Math.random() * 2.5;
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
        }

        laser.trail.push({ x: laser.x, y: laser.y });
        if (laser.trail.length > (isMobile ? 15 : 30)) {
          laser.trail.shift(); 
        }

        if (laser.trail.length > 1) {
          ctx.beginPath();
          ctx.strokeStyle = laser.color;
          ctx.lineWidth = isMobile ? 2.5 : 3.5;
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
        ctx.arc(laser.x, laser.y, isMobile ? 1.8 : 2.5, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      // 5. DRAW EXPLOSION DUST
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx; p.y += p.vy; p.alpha -= 0.03;
        if (p.alpha <= 0) return false;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.globalAlpha = 1.0;
        return true;
      });

      // 6. SCORE MATRIX & NOTIFICATION BANNER BLOCK
      ctx.save();
      
      const scoreFont = isMobile ? 'normal 1.05rem "MarioKartDS", sans-serif' : 'normal 1.35rem "MarioKartDS", sans-serif';
      const bannerFont = isMobile ? 'normal 1.05rem "RainyHearts", monospace' : 'normal 1.5rem "RainyHearts", monospace';
      
      const scoreX = W - (isMobile ? 15 : 25);
      const topScoreY = isMobile ? 30 : 40;
      const bottomScoreY = isMobile ? 52 : 70; 

      // STACKED SCORES TO THE RIGHT SIDE
      ctx.font = scoreFont;
      ctx.textAlign = 'right';

      // Top Score: Saad
      let currentX1 = scoreX;
      const systemScoreStr = `: ${systemScoreRef.current}`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(systemScoreStr, currentX1, topScoreY);
      currentX1 -= ctx.measureText(systemScoreStr).width + 6;

      ctx.fillStyle = '#b84fff'; 
      ctx.fillText('/>', currentX1, topScoreY);
      currentX1 -= ctx.measureText('/>').width + 1;
      
      ctx.fillStyle = '#ffe600'; 
      ctx.fillText('Saad', currentX1, topScoreY);
      currentX1 -= ctx.measureText('Saad').width + 1;
      
      ctx.fillStyle = '#b84fff'; 
      ctx.fillText('<', currentX1, topScoreY);

      // Bottom Score: You
      let currentX2 = scoreX;
      const userScoreStr = `: ${userScoreRef.current}`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(userScoreStr, currentX2, bottomScoreY);
      currentX2 -= ctx.measureText(userScoreStr).width + 6;

      ctx.fillStyle = '#b84fff';
      ctx.fillText('/>', currentX2, bottomScoreY);
      currentX2 -= ctx.measureText('/>').width + 1;
      
      ctx.fillStyle = '#ffe600';
      ctx.fillText('You', currentX2, bottomScoreY);
      currentX2 -= ctx.measureText('You').width + 1;
      
      ctx.fillStyle = '#b84fff';
      ctx.fillText('<', currentX2, bottomScoreY);

      // ACTION BANNER TO THE LEFT SIDE
      ctx.font = bannerFont;
      ctx.textAlign = 'left';
      const leftX = isMobile ? 15 : 25;
      const bannerY = isMobile ? 30 : 40;

      if (isSystemWin) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText(isMobile ? 'All errors eliminated' : 'All errors eliminated, system integrity ensured.', leftX, bannerY);
      } else if (isUserSpamStop) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText(isMobile ? 'Okay fine, we get it.' : 'Okay fine, we get it. You can scroll down now.', leftX, bannerY);
      } else {
        ctx.fillStyle = '#ffffff';
        const bannerTxt = 'Help me eliminate errors';
        ctx.fillText(bannerTxt, leftX, bannerY);

        const textWidth = ctx.measureText(bannerTxt).width;
        const iconX = leftX + textWidth + (isMobile ? 6 : 10);
        const iconY = bannerY - (isMobile ? 10 : 14); 

        ctx.fillStyle = '#ffe600';
        ctx.beginPath();
        ctx.moveTo(iconX, iconY);
        ctx.lineTo(iconX + (isMobile ? 8 : 11), iconY + (isMobile ? 5 : 7));
        ctx.lineTo(iconX + (isMobile ? 4.5 : 6.5), iconY + (isMobile ? 6 : 8));
        ctx.lineTo(iconX + (isMobile ? 6.5 : 9), iconY + (isMobile ? 10 : 14));
        ctx.lineTo(iconX + (isMobile ? 4.5 : 6.5), iconY + (isMobile ? 11 : 15));
        ctx.lineTo(iconX + (isMobile ? 2.5 : 4), iconY + (isMobile ? 6.5 : 9));
        ctx.lineTo(iconX, iconY + (isMobile ? 8 : 12));
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.restore();
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
    <section 
      id="home" 
      className="hero" 
      ref={heroRef}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <canvas 
        ref={canvasRef} 
        className="arcade-simulation-canvas" 
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none' 
        }}
      />

      <div 
        className="gameplay-click-overlay"
        onPointerDown={handleGameplayClick}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 5,
          cursor: 'pointer',
          background: 'transparent',
          pointerEvents: 'auto'
        }}
      />

      <div 
        className="hero-content" 
        style={{ 
          position: 'relative', 
          zIndex: 10,
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'none' 
        }}
      >
        <div style={{ transform: 'translateY(-20px)' }}>
          <h1 className="animate-slide-left">
            Hello, I&apos;m <span className="name" ref={nameRef}>Saad</span>
            <span className="name" ref={dotRef} style={{ display: 'inline-block' }}>.</span>
          </h1>

          <p className="subtitle animate-slide-right">
            <Typewriter words={roles} startDelay={1300} />
          </p>
        </div>
      </div>

      <a 
        href="#about" 
        className="backdrop-blur-md view-work-btn animate-fade-up"
        style={{ 
          position: 'absolute', 
          bottom: '2rem',
          zIndex: 200,
          pointerEvents: 'auto' 
        }}
      >
        View my work <span className="arrow">↓</span>
      </a>
    </section>
  );
}