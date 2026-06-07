'use client';

import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import Image from 'next/image';

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

const BALL_COLORS = ['#ff007b', '#ffc400', '#003cff', '#ff0000', '#00ff08', '#ff00fb', '#ff5100', '#7700ff'];

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
    }

    if (t >= 1) onComplete();
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.05, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );
}

function GumballMachineModel({ onCrankClick }: { onCrankClick: () => void; spinning: boolean }) {
  const { scene } = useGLTF('/models/gumball-machine-transformed.glb');
  const [balls, setBalls] = useState<Array<{ id: number; color: string }>>([]);

  function spawnBall() {
    const id = Date.now();
    const color = BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)];
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
    </>
  );
}

function ModelCanvas({ onCrankClick, spinning }: { onCrankClick: () => void; spinning: boolean }) {
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
        <GumballMachineModel onCrankClick={onCrankClick} spinning={spinning} />
      </Canvas>
    </div>
  );
}

export default function GumballSkills() {
  const [unlocked, setUnlocked]         = useState<Set<number>>(new Set());
  const [spinning, setSpinning]         = useState(false);
  const [toast, setToast]               = useState('');
  const [justUnlocked, setJustUnlocked] = useState<number | null>(null);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);
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
      setUnlocked(prev => new Set([...prev, idx]));
      setJustUnlocked(idx);
      showToast(`Unlocked: ${skills[idx].name}!`);
      setSpinning(false);
      lockRef.current = false;
      setTimeout(() => setJustUnlocked(null), 700);
    }, 2000);
  }

  const remaining = skills.length - unlocked.size;

  return (
    <div className="gumball-skills-container">
      
      <ModelCanvas onCrankClick={handleCrankClick} spinning={spinning} />

      <p className="status-message">
        {remaining > 0
          ? <>Click the <strong>crank</strong> to unlock — <span className="highlight">{remaining}</span> remaining</>
          : <strong className="success-highlight">All skills unlocked! 🎉</strong>}
      </p>

      <div className="skills-grid">
        {skills.map((s, i) => {
          const isUnlocked = unlocked.has(i);
          const isNew = justUnlocked === i;
          let gridItemClass = "skill-card";
          if (isNew) gridItemClass += " newly-unlocked";
          if (isUnlocked) gridItemClass += " unlocked";

          return (
            <div key={s.name} className={gridItemClass}>
              {isUnlocked ? (
                <>
                  <div className="icon-wrapper">
                    <Image src={s.icon} alt={s.name} width={40} height={40} unoptimized />
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