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

// ── Animated gumball ball using your actual GLB ──────────────────
// function GumballBall({ color, onComplete }) {
//   const { scene: ballScene } = useGLTF('/models/gumball-transformed.glb');
//   const ref = useRef();
//   const progress = useRef(0);

//   // Clone so multiple balls can exist simultaneously
//   const cloned = ballScene.clone(true);

//   // Tint the ball color
//   cloned.traverse((child) => {
//     if (child.isMesh && child.material) {
//       child.material = child.material.clone();
//       child.material.color.set(color);
//     }
//   });

//   useFrame((_, delta) => {
//     progress.current += delta * 0.55; // speed — lower = slower
//     const t = Math.min(progress.current, 1);

//     // ── Tune these 4 values to match your model's spiral ──
//     const radius = 0.22;   // spiral width — increase if ball is too close to center
//     const turns  = 3.5;    // rotations — match the number of loops in your model
//     const startY = 1.1;    // top entry point — raise if ball spawns too low
//     const endY   = -1.0;   // bottom exit point — lower if ball disappears early
//     // ─────────────────────────────────────────────────────

//     const angle = t * Math.PI * 2 * turns;
//     const x = Math.cos(angle) * radius;
//     const z = Math.sin(angle) * radius;
//     const y = startY + (endY - startY) * t;

//     if (ref.current) {
//       ref.current.position.set(x, y, z);
//       // Rotate the ball itself as it rolls down
//       ref.current.rotation.x += delta * 6;
//       ref.current.rotation.z += delta * 4;
//     }

//     if (t >= 1) onComplete();
//   });

//   return <primitive ref={ref} object={cloned} scale={0.12} />;
// }

function GumballBall({ color, onComplete }) {
  const ref = useRef();
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
      <sphereGeometry args={[0.05, 16, 16]} />  {/* big enough to see */}
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );
}

// ── Machine model + ball spawner ─────────────────────────────────
function GumballMachineModel({ onCrankClick }) {
  const { scene } = useGLTF('/models/gumball-machine-transformed.glb');
  const [balls, setBalls] = useState([]);

  function spawnBall() {
    const id = Date.now();
    const color = BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)];
    setBalls(prev => [...prev, { id, color }]);
  }

  function removeBall(id) {
    setBalls(prev => prev.filter(b => b.id !== id));
  }

  return (
    <>
      <primitive
        object={scene}
        scale={2}
        position={[0, -1.45, 0]}
        rotation={[0, 0, 0]}
        onClick={(e) => {
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

// ── Canvas ────────────────────────────────────────────────────────
function ModelCanvas({ onCrankClick, spinning }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 50 }}
      style={{ width: '100%', height: '720px', cursor: 'pointer' }}
      onClick={(e) => e.stopPropagation()}
    >
      <ambientLight intensity={2.5} />
      <directionalLight position={[0, 10, 8]}  intensity={2.0} />
      <directionalLight position={[-5, 5, 5]}  intensity={1.0} />
      <pointLight       position={[0, 3, 4]}   intensity={1.5} color="#ffffff" />
      <GumballMachineModel onCrankClick={onCrankClick} spinning={spinning} />
    </Canvas>
  );
}

// ── Main export ───────────────────────────────────────────────────
export default function GumballSkills() {
  const [unlocked, setUnlocked]         = useState(new Set());
  const [spinning, setSpinning]         = useState(false);
  const [toast, setToast]               = useState('');
  const [justUnlocked, setJustUnlocked] = useState(null);
  const toastTimer = useRef(null);
  const lockRef    = useRef(false);

  function showToast(msg) {
    setToast(msg);
    clearTimeout(toastTimer.current);
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>

      <ModelCanvas onCrankClick={handleCrankClick} spinning={spinning} />

      <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', margin: 0 }}>
        {remaining > 0
          ? <>Click the <strong style={{ color: '#fff' }}>crank</strong> to unlock — <strong style={{ color: '#fff' }}>{remaining}</strong> remaining</>
          : <strong style={{ color: '#fff' }}>All skills unlocked! 🎉</strong>}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, width: '100%' }}>
        {skills.map((s, i) => {
          const isUnlocked = unlocked.has(i);
          const isNew = justUnlocked === i;
          return (
            <div key={s.name} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 8, padding: '14px 8px 10px',
              borderRadius: 10, height: 100, width: 100,
              border: isNew ? '1px solid #ff6eb4' : '0.5px solid rgba(255,255,255,0.12)',
              background: isNew ? 'rgba(255,110,180,0.15)' : 'rgba(255,255,255,0.06)',
              transform: isNew ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              {isUnlocked ? (
                <>
                  <Image src={s.icon} alt={s.name} width={44} height={44} unoptimized />
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>{s.name}</span>
                </>
              ) : (
                <>
                  <div style={{
                    width: 44, height: 44, borderRadius: 8,
                    background: 'rgba(255,255,255,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  }}>🔒</div>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>???</span>
                </>
              )}
            </div>
          );
        })}
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#111', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 12, padding: '10px 20px',
          fontSize: 13, fontWeight: 500, color: '#fff',
          zIndex: 999, whiteSpace: 'nowrap', animation: 'fadeUp 0.3s ease',
        }}>
          {toast}
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}