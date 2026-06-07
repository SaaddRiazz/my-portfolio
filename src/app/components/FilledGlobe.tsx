import React, { useMemo } from 'react';

const GUMBALL_COLORS = [
  '#FF3CAC', '#FF7C2A', '#FFD600', '#00E676',
  '#00B0FF', '#D500F9', '#FF1744', '#69F0AE',
  '#40C4FF', '#FFAB40',
];

interface FilledGlobeProps {
  unlockedCount: number; // Pass unlocked.size from your parent state
  totalSkills: number;   // Pass skills.length (10) from your parent state
}

export default function FilledGlobe({ unlockedCount, totalSkills }: FilledGlobeProps) {
  const staticBalls = useMemo(() => {
    const balls: Array<{ 
      id: number; 
      position: [number, number, number]; 
      color: string; 
      threshold: 'always' | 'removeAt30' | 'removeAt70' 
    }> = [];
    
    const MAX_RADIUS = 0.55;
    const BALL_DIAMETER = 0.06; // 2 * radius (0.055)
    
    const centerX = 0.04;
    const centerY = 1.1;
    const centerZ = 0;

    for (let attempts = 0; attempts < 600; attempts++) {
      const theta = Math.PI + Math.random() * Math.PI; // Pure semi-circle bottom arc
      const r = Math.sqrt(Math.random()) * MAX_RADIUS;

      const x = centerX + r * Math.cos(theta);
      const y = centerY + r * Math.sin(theta);
      const z = centerZ;

      let overlapping = false;
      for (const existingBall of balls) {
        const dx = x - existingBall.position[0];
        const dy = y - existingBall.position[1];
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < BALL_DIAMETER) {
          overlapping = true;
          break;
        }
      }

      if (!overlapping) {
        const randomColor = GUMBALL_COLORS[Math.floor(Math.random() * GUMBALL_COLORS.length)];
        
        // ── Assign Static Threshold Group Based on Height/Position ──
        // Higher relative Y values get designated to vanish first
        const heightOffset = y - centerY; 
        let threshold: 'always' | 'removeAt30' | 'removeAt70' = 'always';

        if (heightOffset > -0.1) {
          threshold = 'removeAt30'; // Top layer of the semi-circle drops out at 30%
        } else if (heightOffset > -0.30) {
          threshold = 'removeAt70'; // Middle layer drops out at 70%
        }

        balls.push({
          id: balls.length,
          position: [x, y, z],
          color: randomColor,
          threshold
        });
      }
    }
    return balls;
  }, []);

  // Calculate percentage dynamically based on current state
  const unlockPercentage = (unlockedCount / totalSkills) * 100;

  return (
    <group>
      {staticBalls.map((ball) => {
        // 1. If 100% unlocked, all static background balls disappear completely
        if (unlockPercentage >= 100) return null;

        // 2. If >= 70% unlocked, remove the top layer AND the middle layer
        if (unlockPercentage >= 70 && (ball.threshold === 'removeAt30' || ball.threshold === 'removeAt70')) return null;

        // 3. If >= 30% unlocked, remove just the top layer
        if (unlockPercentage >= 30 && ball.threshold === 'removeAt30') return null;

        return (
          <mesh key={ball.id} position={ball.position}>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshStandardMaterial
              color={ball.color}
              roughness={0.2}
              metalness={0.1}
            />
          </mesh>
        );
      })}
    </group>
  );
}