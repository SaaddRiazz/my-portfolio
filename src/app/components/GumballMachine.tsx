'use client';

import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import Image from 'next/image';
import FilledGlobe from './FilledGlobe';

const skills = [
  { name: 'Unity',      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/unity/unity-original.svg' },
  { name: 'React',      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg' },
  { name: 'Python',     icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg' },
  { name: 'TypeScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg' },
  { name: 'Node.js',    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg' },
  { name: 'Next.js',    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg' },
  { name: 'C#',         icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/csharp/csharp-original.svg' },
  { name: 'Java',       icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg' },
  { name: 'Blender',    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/blender/blender-original.svg' },
  { name: 'Git',        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg' },
];

const GUMBALL_COLORS = [
  '#FF3CAC', '#FF7C2A', '#FFD600', '#00E676',
  '#00B0FF', '#D500F9', '#FF1744', '#69F0AE',
  '#40C4FF', '#FFAB40',
];

// ── Animated falling gumball ─────────────────────────────────────
function GumballBall({ 
  color, 
  onComplete 
}: { 
  color: string; 
  onComplete: () => void; 
}) {
  const ref = useRef<any>(null);
  const progress = useRef(0);

  useFrame((_, delta) => {
    progress.current += delta * 1; // Falling speed
    const t = Math.min(progress.current, 1);

    const radius = 0.15;
    const turns  = 3.45;
    const startY = 0.49;
    const endY   = -1.08;

    const angle = t * Math.PI * 2 * turns;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = startY + (endY - startY) * t;

    if (ref.current) {
      ref.current.position.set(x, y, z);
      ref.current.rotation.x += delta * 8;
      ref.current.rotation.z += delta * 5;
    }

    if (t >= 1) onComplete();
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.055, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} roughness={0} metalness={1} />
    </mesh>
  );
}

// ── Machine model ────────────────────────────────────────────────
function GumballMachineModel({ 
  onCrankClick, 
  unlockedCount,
  balls,
  removeBall
}: { 
  onCrankClick: () => void; 
  unlockedCount: number; 
  balls: Array<{ id: number; color: string; skillIndex: number }>;
  removeBall: (id: number, skillIndex: number) => void;
}) {
  const { scene } = useGLTF('/models/gumball-machine-transformed.glb');

  return (
    <>
      <primitive
        object={scene}
        scale={2}
        position={[0, -1.45, 0]}
        rotation={[0, 0, 0]}
        onClick={(e: any) => {
          e.stopPropagation();
          onCrankClick(); // Direct trigger lets users spam clicks fast
        }}
      />
      {balls.map(ball => (
        <GumballBall
          key={ball.id}
          color={ball.color}
          onComplete={() => removeBall(ball.id, ball.skillIndex)}
        />
      ))}

      <FilledGlobe unlockedCount={unlockedCount} totalSkills={skills.length} />
    </>
  );
}

// ── Canvas ────────────────────────────────────────────────────────
function ModelCanvas({ 
  onCrankClick, 
  unlockedCount,
  balls,
  removeBall
}: { 
  onCrankClick: () => void; 
  unlockedCount: number; 
  balls: Array<{ id: number; color: string; skillIndex: number }>;
  removeBall: (id: number, skillIndex: number) => void;
}) {
  return (
    <div className="canvas-container">
      <Canvas
        orthographic 
        camera={{ position: [0, 0, 4], zoom: 120, near: 0.1, far: 1000 }}
        onClick={(e) => e.stopPropagation()}
      >
        <ambientLight intensity={2.5} />
        <directionalLight position={[0, 10, 8]}  intensity={2.0} />
        <directionalLight position={[-5, 5, 5]}  intensity={2.0} />
        <pointLight       position={[0, 3, 4]}   intensity={1.5} color="#ffffff" />
        <GumballMachineModel 
          onCrankClick={onCrankClick} 
          unlockedCount={unlockedCount} 
          balls={balls}
          removeBall={removeBall}
        />
      </Canvas>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────
export default function GumballSkills() {
  const [unlocked, setUnlocked]         = useState<Set<number>>(new Set());
  const [skillColors, setSkillColors]   = useState<Record<number, string>>({});
  const [justUnlocked, setJustUnlocked] = useState<number | null>(null);
  const [toast, setToast]               = useState('');
  const [balls, setBalls]               = useState<Array<{ id: number; color: string; skillIndex: number }>>([]);
  
  // Track backend allocations immediately so spamming clicks doesn't pick the same skill twice
  const reservedSkillsRef = useRef<Set<number>>(new Set());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  }

  // Called ONLY when the ball finishes rolling out of the tube
  function handleBallComplete(ballId: number, skillIndex: number) {
    // 1. Remove ball from rendering array
    setBalls(prev => prev.filter(b => b.id !== ballId));

    // 2. Commit the unlock to the state so it flashes and reveals on the UI grid
    setUnlocked(prev => new Set([...prev, skillIndex]));
    setJustUnlocked(skillIndex);
    showToast(`Unlocked: ${skills[skillIndex].name}!`);

    setTimeout(() => setJustUnlocked(null), 800);
  }

  // Fires instantly when clicking the crank
  function handleCrankClick() {
    // Check against what is locked on the backend (including things currently rolling in tubes)
    const locked = skills
      .map((_, i) => i)
      .filter(i => !unlocked.has(i) && !reservedSkillsRef.current.has(i));

    if (!locked.length) {
      // If everything is already in transit or fully unlocked, do nothing
      if (unlocked.size < skills.length) return;
      showToast('All skills unlocked! 🎉');
      return;
    }

    // Immediately pick a random skill from what remains on the backend
    const randomSkillIdx = locked[Math.floor(Math.random() * locked.length)];
    reservedSkillsRef.current.add(randomSkillIdx);

    // Pick a non-duplicate color mapping for it instantly
    const usedColors = Object.values(skillColors);
    const available = GUMBALL_COLORS.filter(c => !usedColors.includes(c));
    const ballColor = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : GUMBALL_COLORS[randomSkillIdx % GUMBALL_COLORS.length];

    // Save color configuration mapping instantly
    setSkillColors(prev => ({ ...prev, [randomSkillIdx]: ballColor }));

    // Spawn the ball instantly with its color and its target skill index attached
    setBalls(prev => [
      ...prev, 
      { id: Date.now() + Math.random(), color: ballColor, skillIndex: randomSkillIdx }
    ]);
  }

  // Globes and status counters drop as things actually unlock on screen
  const remaining = skills.length - unlocked.size;

  return (
    <div className="gumball-skills-container">

      <ModelCanvas 
        onCrankClick={handleCrankClick} 
        unlockedCount={unlocked.size} 
        balls={balls}
        removeBall={handleBallComplete}
      />

      <p className="status-message">
        {remaining > 0
          ? <>Click the <strong>crank</strong> to unlock — <span className="highlight">{remaining}</span> remaining</>
          : <strong className="success-highlight">All skills unlocked! 🎉</strong>}
      </p>

      <div className="skills-grid">
        {skills.map((s, i) => {
          const isUnlocked = unlocked.has(i);
          const isNew = justUnlocked === i;
          const bgColor = skillColors[i] || 'transparent';

          return (
            <div
              key={s.name}
              className={`skill-card${isNew ? ' newly-unlocked' : ''}${isUnlocked ? ' unlocked' : ''}`}
              style={isUnlocked ? { background: bgColor, borderColor: bgColor } : {}}
            >
              {isUnlocked ? (
                <>
                  <div className="icon-wrapper">
                    <Image src={s.icon} alt={s.name} width={36} height={36} unoptimized />
                  </div>
                  <span className="skill-name">{s.name}</span>
                </>
              ) : (
                <>
                  <div className="lock-placeholder">🔒</div>
                  <span className="skill-name locked-text">???</span>
                </>
              )}
            </div>
          );
        })}
      </div>

      {toast && <div className="gumball-toast">{toast}</div>}
    </div>
  );
}