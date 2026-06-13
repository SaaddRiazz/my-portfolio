'use client';

import { useRef, useState, createContext, useContext, useEffect } from 'react';
import Image from 'next/image';
import ClawMachineViewer from './ClawMachine';

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

interface ClawMachineCtx {
  unlocked: Set<number>;
  justUnlocked: number | null;
  remaining: number;
  handlePlayClick: () => void;
  handleUnlockAll: () => void;
  processSkillUnlock: () => void;
  triggerAnimation: boolean;
  setTriggerAnimation: (val: boolean) => void;
  toast: string;
}

const ClawMachineContext = createContext<ClawMachineCtx | null>(null);

export function useClawMachine() {
  const ctx = useContext(ClawMachineContext);
  if (!ctx) throw new Error('Must be inside ClawMachineProvider');
  return ctx;
}

export function ClawMachineProvider({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked]         = useState<Set<number>>(new Set());
  const [justUnlocked, setJustUnlocked] = useState<number | null>(null);
  const [triggerAnimation, setTriggerAnimation] = useState(false);
  const [toast, setToast]               = useState('');

  const timerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationQueued = useRef(false);

  function showToast(msg: string) {
    setToast(msg);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(''), 2400);
  }

  function handlePlayClick() {
    if (triggerAnimation || animationQueued.current) return;
    const locked = skills.map((_, i) => i).filter(i => !unlocked.has(i));
    if (!locked.length) { showToast('All skills unlocked! 🎉'); return; }
    animationQueued.current = true;
    setTriggerAnimation(true);
  }

  useEffect(() => {
    if (!triggerAnimation) {
      animationQueued.current = false;
    }
  }, [triggerAnimation]);

  function processSkillUnlock() {
    const locked = skills.map((_, i) => i).filter(i => !unlocked.has(i));
    if (!locked.length) return;
    const idx = locked[Math.floor(Math.random() * locked.length)];
    setUnlocked(prev => new Set([...prev, idx]));
    setJustUnlocked(idx);
    showToast(`Unlocked: ${skills[idx].name}!`);
    setTimeout(() => setJustUnlocked(null), 800);
  }

  function handleUnlockAll() {
    if (unlocked.size === skills.length) { showToast('All skills already unlocked! 🎉'); return; }
    setUnlocked(new Set(skills.map((_, i) => i)));
    showToast('Success! All skills unlocked! 🛠️💥');
  }

  return (
    <ClawMachineContext.Provider value={{
      unlocked, justUnlocked,
      remaining: skills.length - unlocked.size,
      handlePlayClick, handleUnlockAll, processSkillUnlock,
      triggerAnimation, setTriggerAnimation,
      toast,
    }}>
      {children}
    </ClawMachineContext.Provider>
  );
}

export function ClawMachine() {
  const {
    remaining, handleUnlockAll, handlePlayClick,
    processSkillUnlock, triggerAnimation, setTriggerAnimation,
  } = useClawMachine();

  return (
    <div className="gumball-skills-container">
      <div className="canvas-container">
        <ClawMachineViewer
          onAnimationComplete={processSkillUnlock}
          triggerAnimation={triggerAnimation}
          setTriggerAnimation={setTriggerAnimation}
          onButtonClick={handlePlayClick}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <p className="status-message" style={{ margin: 0 }}>
          {remaining > 0
            ? <>Click the <strong>button</strong> to claw a skill — <span className="highlight">{remaining}</span> remaining</>
            : <strong className="success-highlight">All skills unlocked! 🎉</strong>}
        </p>
        <button
          onClick={handleUnlockAll}
          disabled={remaining === 0 || triggerAnimation}
          className="unlock-all-btn"
        >
          {remaining > 0 ? 'Unlock All' : 'All Skills Discovered'}
        </button>
      </div>
    </div>
  );
}

export function SkillsGrid() {
  const { unlocked, justUnlocked } = useClawMachine();
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (justUnlocked === null || !gridRef.current) return;
    const targetCard = gridRef.current.querySelector(`[data-skill-id="${skills[justUnlocked].name}"]`);
    if (targetCard) {
      setTimeout(() => {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }, 50);
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

export function ClawMachineToast() {
  const { toast } = useClawMachine();
  return toast ? <div className="gumball-toast">{toast}</div> : null;
}