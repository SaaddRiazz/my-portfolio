'use client';

import { useRef, useState, createContext, useContext, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import Image from 'next/image';
import * as THREE from 'three';

// ─── Skills & Palettes ────────────────────────────────────────────────────────

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

export const SKILL_PALETTES: [string, string, string, string][] = [
  ['#1a1a2e', '#16213e', '#00e5ff', '#00e5ff'],
  ['#0f3460', '#1a1a4e', '#61dafb', '#61dafb'],
  ['#1b4332', '#0d3b2a', '#ffd43b', '#ffd43b'],
  ['#003087', '#001f5b', '#3178c6', '#60aaff'],
  ['#1b4d1b', '#0d2e0d', '#68a063', '#8fff8a'],
  ['#1a1a1a', '#0d0d0d', '#ffffff', '#ccccff'],
  ['#3b0066', '#220044', '#9b4dca', '#cc66ff'],
  ['#7a1c00', '#4d1200', '#f89820', '#ffcc44'],
  ['#1a3a5c', '#0d2240', '#ea7600', '#ffaa44'],
  ['#4d0000', '#2e0000', '#f05032', '#ff7755'],
];

useGLTF.preload('/models/claw-machine-transformed.glb');

// ─── Claw animation phases ─────────────────────────────────────────────────

type ClawPhase = 'idle' | 'grabbing' | 'rising' | 'done';

// ─── Context ──────────────────────────────────────────────────────────────────

interface ClawCtx {
  unlocked: Set<number>;
  justUnlocked: number | null;
  remaining: number;
  handleGrab: () => void;
  handleUnlockAll: () => void;
  toast: string;
  // Joystick position: -1 (full left) … +1 (full right)
  joystickX: number;
  setJoystickX: (v: number) => void;
  clawPhase: ClawPhase;
  isMoving: boolean;
}

const ClawContext = createContext<ClawCtx | null>(null);

export function useClawMachine() {
  const ctx = useContext(ClawContext);
  if (!ctx) throw new Error('Must be inside ClawProvider');
  return ctx;
}

export function ClawProvider({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked]         = useState<Set<number>>(new Set());
  const [justUnlocked, setJustUnlocked] = useState<number | null>(null);
  const [toast, setToast]               = useState('');
  const [joystickX, setJoystickX]       = useState(0);           // -1 … +1
  const [clawPhase, setClawPhase]       = useState<ClawPhase>('idle');
  const [isMoving, setIsMoving]         = useState(false);

  const reservedRef = useRef<Set<number>>(new Set());
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(''), 2600);
  }

  function handleGrab() {
    if (clawPhase !== 'idle') return;

    const locked = skills.map((_, i) => i).filter(
      i => !unlocked.has(i) && !reservedRef.current.has(i)
    );
    if (!locked.length) { showToast('All skills unlocked! 🎉'); return; }

    // Pick a random locked skill
    const idx = locked[Math.floor(Math.random() * locked.length)];
    reservedRef.current.add(idx);

    setClawPhase('grabbing');

    // grabbing phase → 800 ms claw descends
    setTimeout(() => {
      setClawPhase('rising');

      // rising phase → 800 ms claw ascends, then unlock fires
      setTimeout(() => {
        setUnlocked(prev => new Set([...prev, idx]));
        setJustUnlocked(idx);
        showToast(`Grabbed it! Unlocked: ${skills[idx].name} 🎉`);
        setTimeout(() => setJustUnlocked(null), 900);

        setClawPhase('done');
        setTimeout(() => setClawPhase('idle'), 400);
      }, 800);
    }, 800);
  }

  function handleUnlockAll() {
    if (unlocked.size === skills.length) { showToast('All skills already unlocked! 🎉'); return; }
    skills.forEach((_, idx) => reservedRef.current.add(idx));
    setUnlocked(new Set(skills.map((_, i) => i)));
    showToast('Boom! All skills unlocked! 🛠️💥');
  }

  const handleJoystickX = useCallback((v: number) => {
    if (clawPhase !== 'idle') return;
    setIsMoving(true);
    setJoystickX(Math.max(-1, Math.min(1, v)));
    // brief "moving" flag for visual feedback
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsMoving(false), 200);
  }, [clawPhase]);

  return (
    <ClawContext.Provider value={{
      unlocked, justUnlocked,
      remaining: skills.length - unlocked.size,
      handleGrab, handleUnlockAll,
      toast, joystickX, setJoystickX: handleJoystickX,
      clawPhase, isMoving,
    }}>
      {children}
    </ClawContext.Provider>
  );
}

// ─── 3-D Scene ────────────────────────────────────────────────────────────────

/**
 * Nodes from the GLTF:
 *   SM_Body_InnerGlass – glass body (static)
 *   SM_Hand_2          – the claw head  (translate X + Y for move/grab)
 *   SM_Rope            – rope           (translate X to follow claw)
 *   SM_Joystick        – joystick stick (tilt Z based on joystickX)
 *   Cube014            – body part 1 (static)
 *   Cube014_1          – body part 2 (static)
 *
 * Base positions from the GLTF file:
 *   SM_Hand_2  pos [-0.412, 0, 12.245]
 *   SM_Rope    pos [0,      0, 13.201]  scale [0.037, 0.037, 2.064]
 *   SM_Joystick pos [-6.365, 1.808, 5.335]  rot [0, -PI/5, -PI/2]
 */

const HAND_BASE_POS   = new THREE.Vector3(-0.412, 0,     12.245);
const ROPE_BASE_POS   = new THREE.Vector3(0,      0,     13.201);
const JOY_BASE_POS    = new THREE.Vector3(-6.365, 1.808,  5.335);
const JOY_BASE_ROT_Y  = -Math.PI / 5;
const JOY_BASE_ROT_Z  = -Math.PI / 2;

// How far left/right the claw travels (in model units)
const CLAW_X_RANGE    = 3.5;
// How far down the claw drops when grabbing
const CLAW_GRAB_DROP  = 4.5;
// Max joystick tilt angle (radians)
const JOY_TILT        = 0.4;

function ClawMachineModel() {
  const { joystickX, clawPhase } = useClawMachine();
  const { nodes, materials }     = useGLTF('/models/claw-machine-transformed.glb') as any;

  const handRef     = useRef<THREE.Mesh>(null);
  const ropeRef     = useRef<THREE.Mesh>(null);
  const joystickRef = useRef<THREE.Mesh>(null);

  // Animated values (smoothed with lerp each frame)
  const animX    = useRef(0); // claw X offset
  const animY    = useRef(0); // claw Y offset (grab drop)
  const joyTilt  = useRef(0); // joystick tilt angle

  useFrame((_, delta) => {
    const speed  = 1 - Math.pow(0.001, delta); // ~lerp factor per frame
    const lerpF  = Math.min(delta * 8, 1);

    // ── Joystick tilt ──
    const targetJoy = joystickX * JOY_TILT;
    joyTilt.current += (targetJoy - joyTilt.current) * lerpF;

    // ── Claw X position ──
    const targetX = joystickX * CLAW_X_RANGE;
    animX.current += (targetX - animX.current) * lerpF;

    // ── Claw Y (grab animation) ──
    let targetY = 0;
    if (clawPhase === 'grabbing') targetY = -CLAW_GRAB_DROP;
    else if (clawPhase === 'rising' || clawPhase === 'done') targetY = 0;
    animY.current += (targetY - animY.current) * lerpF;

    // ── Apply to refs ──
    if (handRef.current) {
      handRef.current.position.set(
        HAND_BASE_POS.x + animX.current,
        HAND_BASE_POS.y + animY.current,
        HAND_BASE_POS.z
      );
    }
    if (ropeRef.current) {
      ropeRef.current.position.set(
        ROPE_BASE_POS.x + animX.current,
        ROPE_BASE_POS.y + animY.current * 0.5, // rope stretches half as much
        ROPE_BASE_POS.z
      );
      // Stretch rope scale Z slightly when grabbing
      const baseScaleZ = 2.064;
      const stretchFactor = 1 + Math.max(0, -animY.current / CLAW_GRAB_DROP) * 0.4;
      ropeRef.current.scale.set(0.037, 0.037, baseScaleZ * stretchFactor);
    }
    if (joystickRef.current) {
      joystickRef.current.rotation.set(
        0,
        JOY_BASE_ROT_Y,
        JOY_BASE_ROT_Z + joyTilt.current
      );
    }
  });

  return (
    <group dispose={null}>
      {/* Static body */}
      <mesh geometry={nodes.SM_Body_InnerGlass.geometry} material={materials.PaletteMaterial003} rotation={[0, 0, -Math.PI / 2]} />
      <mesh geometry={nodes.Cube014.geometry}    material={materials.PaletteMaterial001} />
      <mesh geometry={nodes.Cube014_1.geometry}  material={materials.PaletteMaterial002} />

      {/* Animated joystick */}
      <mesh
        ref={joystickRef}
        geometry={nodes.SM_Joystick.geometry}
        material={materials.PaletteMaterial005}
        position={[JOY_BASE_POS.x, JOY_BASE_POS.y, JOY_BASE_POS.z]}
        rotation={[0, JOY_BASE_ROT_Y, JOY_BASE_ROT_Z]}
      />

      {/* Animated rope */}
      <mesh
        ref={ropeRef}
        geometry={nodes.SM_Rope.geometry}
        material={nodes.SM_Rope.material}
        position={[ROPE_BASE_POS.x, ROPE_BASE_POS.y, ROPE_BASE_POS.z]}
        scale={[0.037, 0.037, 2.064]}
      />

      {/* Animated claw hand */}
      <mesh
        ref={handRef}
        geometry={nodes.SM_Hand_2.geometry}
        material={materials.PaletteMaterial004}
        position={[HAND_BASE_POS.x, HAND_BASE_POS.y, HAND_BASE_POS.z]}
      />
    </group>
  );
}

// ─── Joystick UI (HTML overlay) ───────────────────────────────────────────────

function JoystickControls() {
  const { joystickX, setJoystickX, clawPhase, handleGrab, remaining } = useClawMachine();
  const isBusy = clawPhase !== 'idle';

  // Continuous press support
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startMove(dir: -1 | 1) {
    if (isBusy) return;
    setJoystickX(joystickX + dir * 0.25);
    intervalRef.current = setInterval(() => {
      setJoystickX(dir === -1 ? joystickX - 0.25 : joystickX + 0.25);
    }, 120);
  }
  function stopMove() {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  // Keyboard support
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isBusy) return;
      if (e.key === 'ArrowLeft')  setJoystickX(joystickX - 0.3);
      if (e.key === 'ArrowRight') setJoystickX(joystickX + 0.3);
      if (e.key === ' ' || e.key === 'Enter') handleGrab();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isBusy, joystickX, setJoystickX, handleGrab]);

  const btnBase: React.CSSProperties = {
    background: 'transparent',
    border: '2px solid rgba(184,79,255,0.5)',
    color: '#b84fff',
    fontFamily: "'RainyHearts', monospace",
    fontSize: '1.1rem',
    width: '2.4rem',
    height: '2.4rem',
    borderRadius: '4px',
    cursor: isBusy ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isBusy ? 0.4 : 1,
    transition: 'all 0.15s ease',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none',
  };

  const grabBtnStyle: React.CSSProperties = {
    background: isBusy ? 'transparent' : 'rgba(184,79,255,0.12)',
    border: `2px solid ${isBusy ? 'rgba(184,79,255,0.2)' : 'var(--neon-purple)'}`,
    color: isBusy ? '#5a5278' : 'var(--neon-purple)',
    fontFamily: "'RainyHearts', monospace",
    fontSize: '0.85rem',
    letterSpacing: '0.08em',
    padding: '0.45rem 1.1rem',
    borderRadius: '0',
    clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
    cursor: isBusy || remaining === 0 ? 'not-allowed' : 'pointer',
    opacity: isBusy || remaining === 0 ? 0.45 : 1,
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap' as const,
  };

  // Indicator bar showing joystick position
  const pct = ((joystickX + 1) / 2) * 100; // 0–100%

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>

      {/* Position track */}
      <div style={{ width: '80%', maxWidth: '220px', position: 'relative' }}>
        <div style={{
          height: '4px',
          background: 'rgba(255,255,255,0.07)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            left: `calc(${pct}% - 6px)`,
            top: '-4px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: 'var(--neon-purple)',
            boxShadow: '0 0 8px #b84fff',
            transition: 'left 0.05s linear',
          }} />
        </div>
      </div>

      {/* Joystick row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          style={btnBase}
          aria-label="Move claw left"
          onPointerDown={() => startMove(-1)}
          onPointerUp={stopMove}
          onPointerLeave={stopMove}
          disabled={isBusy}
        >◀</button>

        <button
          style={grabBtnStyle}
          onClick={handleGrab}
          disabled={isBusy || remaining === 0}
          aria-label="Grab skill"
        >
          {clawPhase === 'grabbing' ? '⬇ Grabbing…'
            : clawPhase === 'rising'   ? '⬆ Rising…'
            : remaining === 0          ? '🔒 Done'
            : '▼ GRAB'}
        </button>

        <button
          style={btnBase}
          aria-label="Move claw right"
          onPointerDown={() => startMove(1)}
          onPointerUp={stopMove}
          onPointerLeave={stopMove}
          disabled={isBusy}
        >▶</button>
      </div>
    </div>
  );
}

// ─── Public ClawMachine component ────────────────────────────────────────────

export function ClawMachine() {
  const { remaining, handleUnlockAll, clawPhase } = useClawMachine();

  return (
    <div className="gumball-skills-container">
      <div className="canvas-container">
        <Canvas
          camera={{ position: [0, 6, 20], fov: 100 }}
          onClick={e => e.stopPropagation()}
          gl={{
            toneMapping: THREE.NoToneMapping,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
        >
          <ambientLight intensity={2.5} />
          <directionalLight position={[0, 10, 8]}  intensity={2.0} />
          <directionalLight position={[-5, 5, 5]}  intensity={2.0} />
          <pointLight       position={[0, 3, 4]}   intensity={1.5} color="#ffffff" />
          <ClawMachineModel />
        </Canvas>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
        <p className="status-message" style={{ margin: 0 }}>
          {remaining > 0
            ? <>Use the <strong>joystick</strong> to aim, then <strong>GRAB</strong> — <span className="highlight">{remaining}</span> remaining</>
            : <strong className="success-highlight">All skills unlocked! 🎉</strong>}
        </p>

        <JoystickControls />

        <button
          onClick={handleUnlockAll}
          disabled={remaining === 0}
          className="unlock-all-btn"
          style={{ marginTop: '2px' }}
        >
          {remaining > 0 ? '▶ Smash Machine (Unlock All)' : '🔒 All Skills Discovered'}
        </button>
      </div>
    </div>
  );
}

// ─── SkillsGrid (unchanged logic, same CSS classes) ──────────────────────────

export function SkillsGrid() {
  const { unlocked, justUnlocked } = useClawMachine();
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const gridEl = gridRef.current;
    if (!gridEl) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaX !== 0) return;
      e.preventDefault();
      gridEl.scrollLeft += e.deltaY;
    };
    gridEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => gridEl.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    if (justUnlocked === null || !gridRef.current) return;
    const targetCard = gridRef.current.querySelector(`[data-skill-id="${skills[justUnlocked].name}"]`);
    if (targetCard) {
      setTimeout(() => targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }), 50);
    }
  }, [justUnlocked]);

  return (
    <div className="skills-grid" ref={gridRef}>
      {skills.map((s, i) => {
        const isUnlocked = unlocked.has(i);
        const isNew      = justUnlocked === i;
        const [gradFrom, gradTo, ring, glow] = SKILL_PALETTES[i];

        const unlockedStyle = isUnlocked ? {
          background: `linear-gradient(160deg, ${gradFrom} 0%, ${gradTo} 100%)`,
          border: `3px solid ${ring}`,
          boxShadow: `0 0 12px ${glow}88, 0 0 12px ${glow}33, inset 0 1px 0 rgba(255,255,255,0.1)`,
        } : {};

        return (
          <div
            key={s.name}
            data-skill-id={s.name}
            className={`skill-card${isNew ? ' newly-unlocked' : ''}${isUnlocked ? ' unlocked' : ''}`}
            style={unlockedStyle}
          >
            <div className="skill-icon-area">
              {isUnlocked ? (
                <div className="icon-wrapper">
                  <Image src={s.icon} alt={s.name} width={40} height={40} unoptimized />
                </div>
              ) : (
                <div className="lock-placeholder">🔒</div>
              )}
            </div>
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

// ─── Toast ────────────────────────────────────────────────────────────────────

export function ClawToast() {
  const { toast } = useClawMachine();
  return toast ? <div className="gumball-toast">{toast}</div> : null;
}

// ─── Root export (drop-in for GumballMachine default export) ──────────────────

export default function ClawMachineSkills() {
  return (
    <ClawProvider>
      <ClawMachine />
      <SkillsGrid />
      <ClawToast />
    </ClawProvider>
  );
}