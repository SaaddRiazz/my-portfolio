import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// A single animated ball that travels down the spiral
function Gumball({ color, onComplete }) {
  const meshRef = useRef();
  const progress = useRef(0);

  useFrame((_, delta) => {
    progress.current += delta * 0.6; // ← speed, lower = slower

    const t = progress.current;      // 0 → 1 along the path

    // Spiral math — tune these to match your model's geometry
    const radius = 0.18;             // how wide the spiral is
    const turns = 4;                 // number of full rotations
    const startY = 1.2;              // top of spiral (world space)
    const endY = -0.8;               // bottom / exit point

    const angle = t * Math.PI * 2 * turns;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = startY + (endY - startY) * t;

    if (meshRef.current) {
      meshRef.current.position.set(x, y, z);
    }

    // Ball reached the bottom
    if (t >= 1) onComplete();
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.07, 16, 16]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
    </mesh>
  );
}