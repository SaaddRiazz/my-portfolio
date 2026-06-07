import React, { useMemo } from 'react';

const GUMBALL_COLORS = [
  '#FF3CAC', '#FF7C2A', '#FFD600', '#00E676',
  '#00B0FF', '#D500F9', '#FF1744', '#69F0AE',
  '#40C4FF', '#FFAB40',
];

export default function FilledGlobe() {
  const staticBalls = useMemo(() => {
    const balls: Array<{ id: number; position: [number, number, number]; color: string }> = [];
    const MAX_RADIUS = 0.55;
    const BALL_DIAMETER = 0.08; // 2 * radius (0.055) to avoid overlapping
    
    const centerX = 0.04;
    const centerY = 1.1;
    const centerZ = 0;

    // Try generating up to 1000 candidate positions to fill the space efficiently
    for (let attempts = 0; attempts < 1000; attempts++) {
      // Create a semi-circle angle (bottom half: Math.PI to 2*Math.PI)
      const theta = Math.PI + Math.random() * Math.PI;
      const r = Math.sqrt(Math.random()) * MAX_RADIUS;

      const x = centerX + r * Math.cos(theta);
      const y = centerY + r * Math.sin(theta);
      const z = centerZ;

      // Check distance against every ball already accepted into the pile
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

      // Only add the ball if it has enough breathing room
      if (!overlapping) {
        const randomColor = GUMBALL_COLORS[Math.floor(Math.random() * GUMBALL_COLORS.length)];
        balls.push({
          id: balls.length,
          position: [x, y, z],
          color: randomColor
        });
      }
    }
    return balls;
  }, []);

  return (
    <group>
      {staticBalls.map((ball) => (
        <mesh key={ball.id} position={ball.position}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial
            color={ball.color}
            roughness={0}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}