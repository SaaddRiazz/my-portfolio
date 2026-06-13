import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { skills, SKILL_PALETTES } from './ClawMachineMain';

interface FilledBoxProps {
  unlockedCount: number;
  totalSkills: number;
}

// ── Single ball that handles its own smooth opacity fade-out ────────────────
function FadingBall({
  position,
  color,
  shouldFade,
}: {
  position: [number, number, number];
  color: string;
  shouldFade: boolean;
}) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const opacityRef = useRef(1);
  const fadingRef = useRef(false);

  useFrame((_, delta) => {
    if (!matRef.current) return;

    if (shouldFade && !fadingRef.current) {
      fadingRef.current = true;
    }

    if (fadingRef.current) {
      opacityRef.current = Math.max(0, opacityRef.current - delta * 1.8);
      matRef.current.opacity = opacityRef.current;
    }
  });

  return (
    <mesh position={position}>
      <sphereGeometry args={[0.7, 16, 16]} />
      <meshStandardMaterial
        ref={matRef}
        color={color}
        roughness={0.3}
        metalness={0.4}
        emissive={color}
        emissiveIntensity={0.15}
        transparent
        opacity={1}
      />
    </mesh>
  );
}

export default function FilledBox({ unlockedCount, totalSkills }: FilledBoxProps) {
  const staticBalls = useMemo(() => {
    const balls: Array<{
      id: number;
      position: [number, number, number];
      color: string;
      threshold: 'always' | 'removeAt30' | 'removeAt70';
    }> = [];

    // Matching the inner spatial constraints of your crane limits
    const MIN_X = -3.5;
    const MAX_X = 3.5;
    const MIN_Z = -3.5;
    const MAX_Z = 3.5;

    // Bottom floor location in world units inside the cabinet
    const FLOOR_Y = 7;
    const BALL_RADIUS = 0.6;
    const MIN_DISTANCE = BALL_RADIUS * 2; // Packs them tightly/organically

    for (let attempts = 0; attempts < 1200; attempts++) {
      const x = THREE.MathUtils.randFloat(MIN_X, MAX_X);
      const z = THREE.MathUtils.randFloat(MIN_Z, MAX_Z);
      const y = THREE.MathUtils.randFloat(FLOOR_Y, FLOOR_Y + 3);

      let overlapping = false;
      for (const existing of balls) {
        const dx = x - existing.position[0];
        const dy = y - existing.position[1];
        const dz = z - existing.position[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < MIN_DISTANCE) {
          overlapping = true;
          break;
        }
      }

      if (!overlapping) {
        const skillIndex = balls.length % skills.length;
        const color = SKILL_PALETTES[skillIndex][3];

        const heightOffset = y - FLOOR_Y;
        let threshold: 'always' | 'removeAt30' | 'removeAt70' = 'always';
        if (heightOffset > 0.9) threshold = 'removeAt30';
        else if (heightOffset > 0.4) threshold = 'removeAt70';

        balls.push({ id: balls.length, position: [x, y, z], color, threshold });
      }
    }

    return balls;
  }, []);

  const unlockPercentage = (unlockedCount / totalSkills) * 100;

  return (
    <group>
      {staticBalls.map((ball) => {
        const isTopLayer = ball.threshold === 'removeAt30';
        const isMiddleLayer = ball.threshold === 'removeAt70';
        const isBaseLayer = ball.threshold === 'always';

        if (isTopLayer && unlockPercentage >= 30 + 15) return null;
        if (isMiddleLayer && unlockPercentage >= 70 + 15) return null;
        if (isBaseLayer && unlockPercentage >= 100 + 15) return null;

        let shouldFade = false;
        if (isTopLayer && unlockPercentage >= 30) {
          shouldFade = true;
        } else if (isMiddleLayer && unlockPercentage >= 70) {
          shouldFade = true;
        } else if (isBaseLayer && unlockPercentage >= 100) {
          shouldFade = true;
        }

        return (
          <FadingBall
            key={ball.id}
            position={ball.position}
            color={ball.color}
            shouldFade={shouldFade}
          />
        );
      })}
    </group>
  );
}