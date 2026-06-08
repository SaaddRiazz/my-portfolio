import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const GUMBALL_COLORS = [
  '#FF3CAC', '#FF7C2A', '#FFD600', '#00E676',
  '#00B0FF', '#D500F9', '#FF1744', '#69F0AE',
  '#40C4FF', '#FFAB40',
];

interface FilledGlobeProps {
  unlockedCount: number;
  totalSkills: number;
}

// ── Single ball that can fade out smoothly ────────────────────────
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
  // Track whether this ball has started fading
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
      <sphereGeometry args={[0.055, 8, 8]} />
      <meshStandardMaterial
        ref={matRef}
        color={color}
        roughness={0.2}
        metalness={0.9}
        emissive={color}
        emissiveIntensity={0.1}
        transparent
        opacity={1}
      />
    </mesh>
  );
}

export default function FilledGlobe({ unlockedCount, totalSkills }: FilledGlobeProps) {
  const staticBalls = useMemo(() => {
    const balls: Array<{
      id: number;
      position: [number, number, number];
      color: string;
      threshold: 'always' | 'removeAt30' | 'removeAt70';
    }> = [];

    const MAX_RADIUS = 0.55;
    const BALL_DIAMETER = 0.06;

    const centerX = 0.04;
    const centerY = 1.1;
    const centerZ = 0;

    for (let attempts = 0; attempts < 600; attempts++) {
      const theta = Math.PI + Math.random() * Math.PI;
      const r = Math.sqrt(Math.random()) * MAX_RADIUS;

      const x = centerX + r * Math.cos(theta);
      const y = centerY + r * Math.sin(theta);
      const z = centerZ;

      let overlapping = false;
      for (const existing of balls) {
        const dx = x - existing.position[0];
        const dy = y - existing.position[1];
        if (Math.sqrt(dx * dx + dy * dy) < BALL_DIAMETER) {
          overlapping = true;
          break;
        }
      }

      if (!overlapping) {
        const color = GUMBALL_COLORS[Math.floor(Math.random() * GUMBALL_COLORS.length)];
        const heightOffset = y - centerY;
        let threshold: 'always' | 'removeAt30' | 'removeAt70' = 'always';
        if (heightOffset > -0.10) threshold = 'removeAt30';
        else if (heightOffset > -0.30) threshold = 'removeAt70';

        balls.push({ id: balls.length, position: [x, y, z], color, threshold });
      }
    }

    return balls;
  }, []);

  const unlockPercentage = (unlockedCount / totalSkills) * 100;

  return (
    <group>
      {staticBalls.map((ball) => {
        // Determine if this ball should be fading (crossing a threshold)
        // or fully hidden (well past the threshold).

        // Already fully gone — don't render at all (saves draw calls after fade)
        if (unlockPercentage >= 100) return null;

        const isTopLayer    = ball.threshold === 'removeAt30';
        const isMiddleLayer = ball.threshold === 'removeAt70';

        // Completely past threshold + enough time for fade → skip
        if (unlockPercentage >= 70 + 15 && (isTopLayer || isMiddleLayer)) return null;
        if (unlockPercentage >= 30 + 15 && isTopLayer && !isMiddleLayer) return null;

        // Should this ball be fading right now?
        const shouldFade =
          (unlockPercentage >= 70 && (isTopLayer || isMiddleLayer)) ||
          (unlockPercentage >= 30 && isTopLayer && !isMiddleLayer);

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