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

// Vivid gumball colors — one assigned per skill on unlock
const GUMBALL_COLORS = [
  '#FF3CAC', '#FF7C2A', '#FFD600', '#00E676',
  '#00B0FF', '#D500F9', '#FF1744', '#69F0AE',
  '#40C4FF', '#FFAB40',
];

// ── Animated falling gumball ─────────────────────────────────────
function GumballBall({ color, onComplete }: { color: string; onComplete: () => void }) {
  const ref = useRef<any>(null);
  const progress = useRef(0);

  useFrame((_, delta) => {
    progress.current += delta * 0.55;
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
// Added unlockedCount props so FilledGlobe can access it safely
function GumballMachineModel({ 
  onCrankClick, 
  unlockedCount 
}: { 
  onCrankClick: () => void; 
  unlockedCount: number; 
}) {
  const { scene } = useGLTF('/models/gumball-machine-transformed.glb');
  const [balls, setBalls] = useState<Array<{ id: number; color: string }>>([]);

  function spawnBall() {
    const id = Date.now();
    const color = GUMBALL_COLORS[Math.floor(Math.random() * GUMBALL_COLORS.length)];
    setBalls(prev => [...prev, { id, color }]);
  }

  function removeBall(id: number) {
    setBalls(prev => prev.filter(b => b.id !== id));
  }

  return (
    <>
      <primitive
        object={scene}
        scale={2}
        position={[0, -1.45, 0]}
        rotation={[0, 0, 0]}
        onClick={(e: any) => {
          e.stopPropagation();
          spawnBall();
          onCrankClick();
        }}
      />
      {balls.map(ball => (
        <GumballBall
          key={ball.id}
          color={ball.color}
          onComplete={() => removeBall(ball.id)}
        />
      ))}

      {/* Moved FilledGlobe inside the Model environment where its positions coordinate natively */}
      <FilledGlobe unlockedCount={unlockedCount} totalSkills={skills.length} />
    </>
  );
}

// ── Canvas ────────────────────────────────────────────────────────
// Added unlockedCount to pass it down through the Canvas tree
function ModelCanvas({ 
  onCrankClick, 
  unlockedCount 
}: { 
  onCrankClick: () => void; 
  unlockedCount: number; 
}) {
  return (
    <div className="canvas-container">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        onClick={(e) => e.stopPropagation()}
      >
        <ambientLight intensity={2.5} />
        <directionalLight position={[0, 10, 8]}  intensity={2.0} />
        <directionalLight position={[-5, 5, 5]}  intensity={1.0} />
        <pointLight       position={[0, 3, 4]}   intensity={1.5} color="#ffffff" />
        <GumballMachineModel onCrankClick={onCrankClick} unlockedCount={unlockedCount} />
      </Canvas>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────
export default function GumballSkills() {
  const [unlocked, setUnlocked]         = useState<Set<number>>(new Set());
  const [skillColors, setSkillColors]   = useState<Record<number, string>>({});
  const [spinning, setSpinning]         = useState(false);
  const [toast, setToast]               = useState('');
  const [justUnlocked, setJustUnlocked] = useState<number | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockRef    = useRef(false);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  }

  function handleCrankClick() {
    if (spinning || lockRef.current) return;

    const locked = skills.map((_, i) => i).filter(i => !unlocked.has(i));
    if (!locked.length) { showToast('All skills unlocked! 🎉'); return; }

    lockRef.current = true;
    setSpinning(true);

    setTimeout(() => {
      const idx = locked[Math.floor(Math.random() * locked.length)];

      // Assign a unique gumball color to this skill
      const usedColors = Object.values(skillColors);
      const available = GUMBALL_COLORS.filter(c => !usedColors.includes(c));
      const color = available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : GUMBALL_COLORS[idx % GUMBALL_COLORS.length];

      setSkillColors(prev => ({ ...prev, [idx]: color }));
      setUnlocked(prev => new Set([...prev, idx]));
      setJustUnlocked(idx);
      showToast(`Unlocked: ${skills[idx].name}!`);
      setSpinning(false);
      lockRef.current = false;
      setTimeout(() => setJustUnlocked(null), 800);
    }, 2000);
  }

  const remaining = skills.length - unlocked.size;

  return (
    <div className="gumball-skills-container">

      {/* Passing down the size of the unlocked Set directly here */}
      <ModelCanvas onCrankClick={handleCrankClick} unlockedCount={unlocked.size} />

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