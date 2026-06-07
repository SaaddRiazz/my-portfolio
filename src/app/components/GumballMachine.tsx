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

// Helper function to check contrast color dynamically based on background hex
function getContrastColor(hexColor: string): string {
  if (!hexColor || hexColor === 'transparent') return '#ffffff';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
  const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
  const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 155 ? '#121212' : '#ffffff';
}

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
    progress.current += delta * 1;
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
      ref.current.rotation.x += delta * 16;
      ref.current.rotation.z += delta * 10;
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
  allocatedCount, // SYNC FIX: Uses allocatedCount instead of unlockedCount
  balls,
  removeBall
}: { 
  onCrankClick: () => void; 
  allocatedCount: number; 
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
          onCrankClick();
        }}
      />
      {balls.map(ball => (
        <GumballBall
          key={ball.id}
          color={ball.color}
          onComplete={() => removeBall(ball.id, ball.skillIndex)}
        />
      ))}

      {/* Globe responds instantly to the allocatedCount */}
      <FilledGlobe unlockedCount={allocatedCount} totalSkills={skills.length} />
    </>
  );
}

// ── Canvas ────────────────────────────────────────────────────────
function ModelCanvas({ 
  onCrankClick, 
  allocatedCount, // SYNC FIX: Bubbled up change
  balls,
  removeBall
}: { 
  onCrankClick: () => void; 
  allocatedCount: number; 
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
          allocatedCount={allocatedCount} 
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
  
  // Track backend allocations immediately so user spam clicks don't re-roll the same skill
  const reservedSkillsRef = useRef<Set<number>>(new Set());
  
  // SYNC FIX: A reactive state counter representing active + complete unlocks to feed into the 3D globe instantly
  const [allocatedCount, setAllocatedCount] = useState(0);
  
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  }

  function handleBallComplete(ballId: number, skillIndex: number) {
    setBalls(prev => prev.filter(b => b.id !== ballId));

    setUnlocked(prev => new Set([...prev, skillIndex]));
    setJustUnlocked(skillIndex);
    showToast(`Unlocked: ${skills[skillIndex].name}!`);

    setTimeout(() => setJustUnlocked(null), 800);
  }

  function handleCrankClick() {
    const locked = skills
      .map((_, i) => i)
      .filter(i => !unlocked.has(i) && !reservedSkillsRef.current.has(i));

    if (!locked.length) {
      if (unlocked.size < skills.length) return;
      showToast('All skills unlocked! 🎉');
      return;
    }

    const randomSkillIdx = locked[Math.floor(Math.random() * locked.length)];
    reservedSkillsRef.current.add(randomSkillIdx);

    // SYNC FIX: Increment allocated count instantly upon user crank click
    setAllocatedCount(prev => prev + 1);

    const usedColors = Object.values(skillColors);
    const available = GUMBALL_COLORS.filter(c => !usedColors.includes(c));
    const ballColor = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : GUMBALL_COLORS[randomSkillIdx % GUMBALL_COLORS.length];

    setSkillColors(prev => ({ ...prev, [randomSkillIdx]: ballColor }));

    setBalls(prev => [
      ...prev, 
      { id: Date.now() + Math.random(), color: ballColor, skillIndex: randomSkillIdx }
    ]);
  }

  const remaining = skills.length - unlocked.size;

  return (
    <div className="gumball-skills-container">

      <ModelCanvas 
        onCrankClick={handleCrankClick} 
        allocatedCount={allocatedCount} // SYNC FIX: Updates instantly on click event
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
          const textColor = getContrastColor(bgColor);

          return (
            <div
              key={s.name}
              className={`skill-card${isNew ? ' newly-unlocked' : ''}${isUnlocked ? ' unlocked' : ''}`}
              style={isUnlocked ? { 
                background: bgColor, 
                borderColor: bgColor,
                color: textColor,
                boxShadow: '0 4px 14px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.2)'
              } : {}}
            >
              {isUnlocked ? (
                <>
                  <div className="icon-wrapper" style={{ background: 'rgba(255, 255, 255, 0.92)', padding: '5px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Image src={s.icon} alt={s.name} width={28} height={28} unoptimized />
                  </div>
                  <span className="skill-name" style={{ fontWeight: '600', textShadow: textColor === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.15)' : 'none' }}>
                    {s.name}
                  </span>
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