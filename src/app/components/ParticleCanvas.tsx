'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>(0);
  // Track previous dimensions to redistribute particles on scale
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    dimensionsRef.current = { width, height };

    const setCanvasSize = () => {
      const prevWidth = dimensionsRef.current.width;
      const prevHeight = dimensionsRef.current.height;

      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      dimensionsRef.current = { width, height };

      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      // Dynamically redistribute particles into the new dimensions on resize
      if (prevWidth > 0 && prevHeight > 0) {
        for (const p of particlesRef.current) {
          p.x = (p.x / prevWidth) * width;
          p.y = (p.y / prevHeight) * height;
        }
      }
    };

    // Dense particle field initialization
    const particleCount = Math.min(Math.floor((width * height) / 1800), 450);
    particlesRef.current = [];

    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        radius: Math.random() * 1.2 + 0.3,
        opacity: Math.random() * 0.35 + 0.1,
      });
    }

    setCanvasSize();

    // Max distance between two particles to form a connection
    const connectionDist = 90;
    // Radius within which the mouse connects to all particles
    const mouseConnectionRadius = 130;
    // Max propagation depth from mouse
    const maxDepth = 12;
    // Physical distance from mouse beyond which connections fade out completely
    const maxRadius = 380;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Update particle positions (gentle drift)
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap gracefully handling edge conditions
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      }

      // 1. Draw all standard drifting background particles (Now Soft White)
      for (const p of particlesRef.current) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();
      }

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      if (mx < 0 || my < 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // --- Cascading network from mouse ---
      const visited = new Map<number, number>();
      const queue: [number, number][] = [];

      // Initial seeds (all particles within mouseConnectionRadius)
      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];
        const dist = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
        if (dist < mouseConnectionRadius) {
          visited.set(i, 1);
          queue.push([i, 1]);
        }
      }

      while (queue.length > 0) {
        const [currentIdx, depth] = queue.shift()!;
        if (depth >= maxDepth) continue;

        const cp = particlesRef.current[currentIdx];

        // Find neighbors of this particle
        for (let i = 0; i < particlesRef.current.length; i++) {
          if (visited.has(i)) continue;
          const np = particlesRef.current[i];
          const dx = cp.x - np.x;
          const dy = cp.y - np.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            visited.set(i, depth + 1);
            queue.push([i, depth + 1]);
          }
        }
      }

      // Draw edges between connected particles
      const connectedIndices = Array.from(visited.keys());
      const baseOpacity = 0.45; // Slightly reduced to keep line webs clean and elegant

      for (let idx = 0; idx < connectedIndices.length; idx++) {
        const i = connectedIndices[idx];
        const pi = particlesRef.current[i];
        const depthI = visited.get(i)!;
        const distI = Math.sqrt((pi.x - mx) ** 2 + (pi.y - my) ** 2);

        // 2. Connection lines from mouse to seed particles (Now Glowing Cyan)
        if (distI < mouseConnectionRadius) {
          const edgeDepth = 1;
          const avgDist = distI / 2;
          const distFactor = Math.max(0, 1 - avgDist / maxRadius);
          const depthFactor = Math.max(0, 1 - edgeDepth / maxDepth);
          const opacity = baseOpacity * distFactor * depthFactor;

          ctx.beginPath();
          ctx.moveTo(mx, my);
          ctx.lineTo(pi.x, pi.y);
          ctx.strokeStyle = `rgba(0, 229, 255, ${opacity * 0.8})`; 
          ctx.lineWidth = Math.max(0.2, 0.85 - edgeDepth * 0.04);
          ctx.stroke();
        }

        // 3. Web connection lines between internal nodes (Now Fluid Teal/Cyan)
        for (let jdx = idx + 1; jdx < connectedIndices.length; jdx++) {
          const j = connectedIndices[jdx];
          const pj = particlesRef.current[j];
          const depthJ = visited.get(j)!;

          const dx = pi.x - pj.x;
          const dy = pi.y - pj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            const edgeDepth = Math.max(depthI, depthJ);
            const distJ = Math.sqrt((pj.x - mx) ** 2 + (pj.y - my) ** 2);
            const avgDist = (distI + distJ) / 2;

            const distFactor = Math.max(0, 1 - avgDist / maxRadius);
            const depthFactor = Math.max(0, 1 - edgeDepth / maxDepth);
            const opacity = baseOpacity * distFactor * depthFactor;

            ctx.beginPath();
            ctx.moveTo(pi.x, pi.y);
            ctx.lineTo(pj.x, pj.y);
            ctx.strokeStyle = `rgba(0, 229, 255, ${opacity * 0.6})`;
            ctx.lineWidth = Math.max(0.2, 0.85 - edgeDepth * 0.04);
            ctx.stroke();
          }
        }
      }

      // 4. Glow aura around connected active nodes (Now Clear Cyan Glow)
      for (const [idx, depth] of visited.entries()) {
        const p = particlesRef.current[idx];
        const dist = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
        const distFactor = Math.max(0, 1 - dist / maxRadius);
        const depthFactor = Math.max(0, 1 - depth / maxDepth);
        const opacity = 0.4 * distFactor * depthFactor;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 229, 255, ${opacity})`;
        ctx.fill();
      }

      // 5. Draw the tiny main node directly under the mouse cursor (Bright White)
      ctx.beginPath();
      ctx.arc(mx, my, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        mouseRef.current.x = x;
        mouseRef.current.y = y;
      } else {
        mouseRef.current.x = -1000;
        mouseRef.current.y = -1000;
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    const handleResize = () => {
      setCanvasSize();
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-canvas" />;
}