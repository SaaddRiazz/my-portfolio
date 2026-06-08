'use client';

import { useRef, useState, createContext, useContext } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import Image from 'next/image';
import FilledGlobe from './FilledGlobe';

/* ── Skills data ─────────────────────────────────────────────────── */
export const skills = [
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

/* ── Per-skill arcade token palette ─────────────────────────────────
   Each entry: [gradientFrom, gradientTo, ringColor, glowColor]
   Deliberately loud, high-contrast, every token distinct.
────────────────────────────────────────────────────────────────── */
const SKILL_PALETTES: [string, string, string, string][] = [
  /* Unity      */ ['#1a1a2e', '#16213e', '#00e5ff', '#00e5ff'],
  /* React      */ ['#0f3460', '#1a1a4e', '#61dafb', '#61dafb'],
  /* Python     */ ['#1b4332', '#0d3b2a', '#ffd43b', '#ffd43b'],
  /* TypeScript */ ['#003087', '#001f5b', '#3178c6', '#60aaff'],
  /* Node.js    */ ['#1b4d1b', '#0d2e0d', '#68a063', '#8fff8a'],
  /* Next.js    */ ['#1a1a1a', '#0d0d0d', '#ffffff', '#ccccff'],
  /* C#         */ ['#3b0066', '#220044', '#9b4dca', '#cc66ff'],
  /* Java       */ ['#7a1c00', '#4d1200', '#f89820', '#ffcc44'],
  /* Blender    */ ['#1a3a5c', '#0d2240', '#ea7600', '#ffaa44'],
  /* Git        */ ['#4d0000', '#2e0000', '#f05032', '#ff7755'],
];

/* gumball animation still uses random colors for flying balls */
const GUMBALL_COLORS = [
  '#FF3CAC', '#FF7C2A', '#FFD600', '#00E676',
  '#00B0FF', '#D500F9', '#FF1744', '#69F0AE',
  '#40C4FF', '#FFAB40',
];

useGLTF.preload('/models/gumball-machine-transformed.glb');
useGLTF.preload('/models/gumball-machine-broken-transformed.glb');

/* ── Context ─────────────────────────────────────────────────────── */
interface GumballCtx {
  unlocked: Set<number>;
  justUnlocked: number | null;
  remaining: number;
  handleCrankClick: () => void;
  handleUnlockAll: () => void;
  allocatedCount: number;
  balls: Array<{ id: number; color: string; skillIndex: number }>;
  handleBallComplete: (id: number, skillIndex: number) => void;
  modelPath: string;
  toast: string;
}

const GumballContext = createContext<GumballCtx | null>(null);

function useGumball() {
  const ctx = useContext(GumballContext);
  if (!ctx) throw new Error('Must be inside GumballProvider');
  return ctx;
}

/* ── Provider ────────────────────────────────────────────────────── */
export function GumballProvider({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked]             = useState<Set<number>>(new Set());
  const [justUnlocked, setJustUnlocked]     = useState<number | null>(null);
  const [toast, setToast]                   = useState('');
  const [balls, setBalls]                   = useState<Array<{ id: number; color: string; skillIndex: number }>>([]);
  const [allocatedCount, setAllocatedCount] = useState(0);
  const [modelPath, setModelPath]           = useState('/models/gumball-machine-transformed.glb');

  const reservedRef = useRef<Set<number>>(new Set());
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(''), 2400);
  }

  function handleBallComplete(ballId: number, skillIndex: number) {
    setBalls(prev => prev.filter(b => b.id !== ballId));
    setUnlocked(prev => new Set([...prev, skillIndex]));
    setJustUnlocked(skillIndex);
    showToast(`Unlocked: ${skills[skillIndex].name}!`);
    setTimeout(() => setJustUnlocked(null), 800);
  }

  function handleCrankClick() {
    if (modelPath.includes('broken')) return;
    const locked = skills.map((_, i) => i).filter(i => !unlocked.has(i) && !reservedRef.current.has(i));
    if (!locked.length) { showToast('All skills unlocked! 🎉'); return; }

    const idx   = locked[Math.floor(Math.random() * locked.length)];
    const color = GUMBALL_COLORS[idx % GUMBALL_COLORS.length];
    reservedRef.current.add(idx);
    setAllocatedCount(p => p + 1);
    setBalls(p => [...p, { id: Date.now() + Math.random(), color, skillIndex: idx }]);
  }

  function handleUnlockAll() {
    if (unlocked.size === skills.length) { showToast('All skills already unlocked! 🎉'); return; }
    setBalls([]);
    skills.forEach((_, idx) => reservedRef.current.add(idx));
    setAllocatedCount(skills.length);
    setUnlocked(new Set(skills.map((_, i) => i)));
    setModelPath('/models/gumball-machine-broken-transformed.glb');
    showToast('Boom! Machine broken, all skills unlocked! 🛠️💥');
  }

  return (
    <GumballContext.Provider value={{
      unlocked, justUnlocked,
      remaining: skills.length - unlocked.size,
      handleCrankClick, handleUnlockAll,
      allocatedCount, balls, handleBallComplete,
      modelPath, toast,
    }}>
      {children}
    </GumballContext.Provider>
  );
}

/* ── Falling gumball ─────────────────────────────────────────────── */
function GumballBall({ color, onComplete }: { color: string; onComplete: () => void }) {
  const ref      = useRef<any>(null);
  const progress = useRef(0);
  useFrame((_, delta) => {
    progress.current += delta;
    const t = Math.min(progress.current, 1);
    const angle = t * Math.PI * 2 * 3.45;
    if (ref.current) {
      ref.current.position.set(Math.cos(angle) * 0.15, 0.49 + (-1.08 - 0.49) * t, Math.sin(angle) * 0.15);
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

/* ── 3-D model ───────────────────────────────────────────────────── */
function MachineModel() {
  const { handleCrankClick, allocatedCount, balls, handleBallComplete, modelPath } = useGumball();
  const { scene } = useGLTF(modelPath);
  return (
    <>
      <primitive object={scene} scale={2} position={[0, -1.45, 0]}
        onClick={(e: any) => { e.stopPropagation(); handleCrankClick(); }} />
      {balls.map(b => (
        <GumballBall key={b.id} color={b.color} onComplete={() => handleBallComplete(b.id, b.skillIndex)} />
      ))}
      <FilledGlobe unlockedCount={allocatedCount} totalSkills={skills.length} />
    </>
  );
}

/* ── GumballMachine (canvas + controls) ─────────────────────────── */
export function GumballMachine() {
  const { remaining, handleUnlockAll } = useGumball();
  return (
    <div className="gumball-skills-container">
      <div className="canvas-container">
        <Canvas orthographic camera={{ position: [0, 0, 4], zoom: 120, near: 0.1, far: 1000 }}
          onClick={e => e.stopPropagation()}>
          <ambientLight intensity={2.5} />
          <directionalLight position={[0, 10, 8]} intensity={2.0} />
          <directionalLight position={[-5, 5, 5]} intensity={2.0} />
          <pointLight position={[0, 3, 4]} intensity={1.5} color="#ffffff" />
          <MachineModel />
        </Canvas>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <p className="status-message" style={{ margin: 0 }}>
          {remaining > 0
            ? <>Click the <strong>crank</strong> to unlock — <span className="highlight">{remaining}</span> remaining</>
            : <strong className="success-highlight">All skills unlocked! 🎉</strong>}
        </p>
        {remaining > 0 && (
          <button
            onClick={handleUnlockAll}
            className="unlock-all-btn"
            style={{
              padding: '10px 20px', fontSize: '14px', fontWeight: '700',
              color: '#ffffff', background: 'linear-gradient(135deg, #FF1744 0%, #D500F9 100%)',
              border: 'none', borderRadius: '30px', cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(213,0,249,0.4)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(213,0,249,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';    e.currentTarget.style.boxShadow = '0 4px 15px rgba(213,0,249,0.4)'; }}
          >
            💥 Smash Machine (Unlock All)
          </button>
        )}
      </div>
    </div>
  );
}

/* ── SkillsGrid ─────────────────────────────────────────────────── */
export function SkillsGrid() {
  const { unlocked, justUnlocked } = useGumball();

  return (
    <div className="skills-grid">
      {skills.map((s, i) => {
        const isUnlocked = unlocked.has(i);
        const isNew      = justUnlocked === i;
        const [gradFrom, gradTo, ring, glow] = SKILL_PALETTES[i];

        const unlockedStyle = isUnlocked ? {
          background: `linear-gradient(160deg, ${gradFrom} 0%, ${gradTo} 100%)`,
          border: `3px solid ${ring}`,
          boxShadow: `0 0 12px ${glow}88, 0 0 28px ${glow}33, inset 0 1px 0 rgba(255,255,255,0.1)`,
        } : {};

        return (
          <div
            key={s.name}
            className={`skill-card${isNew ? ' newly-unlocked' : ''}${isUnlocked ? ' unlocked' : ''}`}
            style={unlockedStyle}
          >
            {/* Icon area */}
            <div className="skill-icon-area">
              {isUnlocked ? (
                <div className="icon-wrapper">
                  <Image src={s.icon} alt={s.name} width={40} height={40} unoptimized />
                </div>
              ) : (
                <div className="lock-placeholder">🔒</div>
              )}
            </div>

            {/* Name badge */}
            <div className="skill-name-badge">
              <span
                className="skill-name"
                style={isUnlocked ? { color: '#ffffff', textShadow: `0 0 6px ${glow}cc, 0 1px 3px rgba(0,0,0,0.9)` } : {}}
              >
                {isUnlocked ? s.name : '???'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Toast ───────────────────────────────────────────────────────── */
export function GumballToast() {
  const { toast } = useGumball();
  return toast ? <div className="gumball-toast">{toast}</div> : null;
}

/* ── Default standalone export ───────────────────────────────────── */
export default function GumballSkills() {
  return (
    <GumballProvider>
      <GumballMachine />
      <SkillsGrid />
      <GumballToast />
    </GumballProvider>
  );
}