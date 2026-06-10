"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center } from "@react-three/drei";

// Define the names matching your files
const MODEL_PARTS = [
  "body",
  "button",
  "holder",
  "joystick",
  "left",
  "right",
  "rope",
  "sides",
];

// Component to load and render all the individual GLB parts
function ModelAssembly() {
  // Map through the parts to generate the correct public paths
  const filePaths = MODEL_PARTS.map((part) => `/models/claw-${part}.glb`);
  
  // useGLTF can accept an array of paths and will load them in parallel
  const gltfs = useGLTF(filePaths);

  return (
    <group>
      {gltfs.map((gltf, index) => (
        <primitive 
          key={MODEL_PARTS[index]} 
          object={gltf.scene.clone()} 
        />
      ))}
    </group>
  );
}

// Loading placeholder component
function Loader() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hotpink" wireframe />
    </mesh>
  );
}

// Main Canvas Component
export default function ClawMachineViewer() {
  return (
    <div style={{ width: "100vw", height: "100vh", backgroundColor: "#1a1a1a" }}>
      <Canvas camera={{ position: [0, 2, 5], fov: 45 }}>
        {/* Ambient light for general visibility */}
        <ambientLight intensity={0.7} />
        
        {/* Directional light to cast shadows and give depth */}
        <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />

        <Suspense fallback={<Loader />}>
          {/* <Center> automatically centers the combined bounding box of all models */}
          <Center>
            <ModelAssembly />
          </Center>
        </Suspense>

        {/* Allows the user to click and drag to rotate/zoom the model */}
        <OrbitControls makeDefault enableDamping />
      </Canvas>
    </div>
  );
}

// Preload assets to avoid loading lag when the component mounts
MODEL_PARTS.forEach((part) => {
  useGLTF.preload(`/models/claw-${part}.glb`);
});