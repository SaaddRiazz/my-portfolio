"use client";

import React, { Suspense, useRef, useCallback, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_PARTS = ["body", "button", "holder", "joystick", "left", "right", "rope", "sides"];

const JOYSTICK_MAX_ANGLE  = 0.4;
const JOYSTICK_RETURN_SPD = 8;
const CRANE_MOVE_SPEED    = 3.5;

const DROP_ZONE_X    = -3.5;
const DROP_ZONE_Z    =  2.0;
const LOWER_DEPTH    = -2.5;
const CLAW_CLOSE_ROT =  0.5;
const ANIM_SPEED     =  2;

const CRANE_MIN_X = -3.5;
const CRANE_MAX_X =  3.5;
const CRANE_MIN_Z = -2.0;
const CRANE_MAX_Z =  2.0;

interface ModelAssemblyProps {
  onAnimationComplete: () => void;
  triggerAnimation: boolean;
  setTriggerAnimation: (val: boolean) => void;
  onButtonClick: () => void;
}

function ModelAssembly({ onAnimationComplete, triggerAnimation, setTriggerAnimation, onButtonClick }: ModelAssemblyProps) {
  const filePaths = MODEL_PARTS.map((part) => `/models/claw-${part}.glb`);
  const gltfs = useGLTF(filePaths);
  const { gl } = useThree();

  const clones = useMemo(() => {
    const map: Record<string, THREE.Group> = {};
    MODEL_PARTS.forEach((part, i) => {
      map[part] = gltfs[i].scene.clone(true);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pivotOffsets = useMemo(() => {
    const getPivotOffset = (obj: THREE.Group, anchor: "top" | "bottom") => {
      const box = new THREE.Box3().setFromObject(obj);
      const center = new THREE.Vector3();
      box.getCenter(center);
      const targetY = anchor === "top" ? box.max.y : box.min.y;
      return new THREE.Vector3(center.x, targetY, center.z);
    };
    return {
      joystick: getPivotOffset(clones["joystick"], "bottom"),
      left:     getPivotOffset(clones["left"],     "top"),
      right:    getPivotOffset(clones["right"],    "top"),
    };
  }, [clones]);

  // Transform Animation References
  const craneGroupRef = useRef<THREE.Group>(null);
  const vertGroupRef  = useRef<THREE.Group>(null);
  const buttonRef     = useRef<THREE.Group>(null);
  const joystickRef   = useRef<THREE.Group>(null);
  const ropeRef       = useRef<THREE.Group>(null);
  const leftRef       = useRef<THREE.Group>(null);
  const rightRef      = useRef<THREE.Group>(null);

  // ── Animation state ───────────────────────────────────────────────────────
  type AnimState =
    | "idle" | "pressing" | "lowering" | "closing" | "raising"
    | "movingX" | "openClaw" | "raiseReturn" | "returnX";

  const animState  = useRef<AnimState>("idle");
  const stateTime  = useRef(0);
  const dropStartX = useRef(0);
  const dropStartZ = useRef(0);

  // Track claw Y offset separately so pivot positions are never corrupted
  const clawY = useRef(0);

  // ── Joystick drag ─────────────────────────────────────────────────────────
  const isDragging   = useRef(false);
  const dragStart    = useRef({ x: 0, y: 0 });
  const joyRotX      = useRef(0);
  const joyRotZ      = useRef(0);
  const joyAxis      = useRef<"x" | "z" | null>(null);
  const joystickPointerId = useRef<number | null>(null);

  const onMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current) return;
    if (joystickPointerId.current !== null && e.pointerId !== joystickPointerId.current) return;
    const dx = (e.clientX - dragStart.current.x) / 120;
    const dy = (e.clientY - dragStart.current.y) / 120;
    if (!joyAxis.current) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 0.04) joyAxis.current = "x";
      else if (Math.abs(dy) > 0.04) joyAxis.current = "z";
    }
    if (joyAxis.current === "x") {
      joyRotX.current = 0;
      joyRotZ.current = THREE.MathUtils.clamp(-dx, -JOYSTICK_MAX_ANGLE, JOYSTICK_MAX_ANGLE);
    } else if (joyAxis.current === "z") {
      joyRotZ.current = 0;
      joyRotX.current = THREE.MathUtils.clamp(dy, -JOYSTICK_MAX_ANGLE, JOYSTICK_MAX_ANGLE);
    }
  }, []);

  const onUp = useCallback((e: PointerEvent) => {
    if (joystickPointerId.current !== null && e.pointerId !== joystickPointerId.current) return;
    isDragging.current = false;
    joyAxis.current = null;
    joystickPointerId.current = null;
  }, []);

  useEffect(() => {
    const c = gl.domElement;
    c.addEventListener("pointermove",  onMove as EventListener);
    c.addEventListener("pointerup",    onUp as EventListener);
    c.addEventListener("pointercancel", onUp as EventListener);
    c.addEventListener("pointerleave", onUp as EventListener);
    return () => {
      c.removeEventListener("pointermove",  onMove as EventListener);
      c.removeEventListener("pointerup",    onUp as EventListener);
      c.removeEventListener("pointercancel", onUp as EventListener);
      c.removeEventListener("pointerleave", onUp as EventListener);
    };
  }, [gl, onMove, onUp]);

  // Helper: apply clawY offset on top of pivot base positions
  const applyClawY = useCallback((y: number) => {
    clawY.current = y;
    if (ropeRef.current) ropeRef.current.position.y = y;
    if (leftRef.current)  leftRef.current.position.y  = pivotOffsets.left.y  + y;
    if (rightRef.current) rightRef.current.position.y = pivotOffsets.right.y + y;
  }, [pivotOffsets]);

  // ── Frame loop ────────────────────────────────────────────────────────────
  useFrame((_, delta) => {
    // 1. Joystick physics
    if (joystickRef.current) {
      if (isDragging.current) {
        joystickRef.current.rotation.x = joyRotX.current;
        joystickRef.current.rotation.z = joyRotZ.current;
      } else {
        joystickRef.current.rotation.x = THREE.MathUtils.lerp(joystickRef.current.rotation.x, 0, delta * JOYSTICK_RETURN_SPD);
        joystickRef.current.rotation.z = THREE.MathUtils.lerp(joystickRef.current.rotation.z, 0, delta * JOYSTICK_RETURN_SPD);
        joyRotX.current = joystickRef.current.rotation.x;
        joyRotZ.current = joystickRef.current.rotation.z;
      }
    }

    // 2. Manual crane movement (idle only)
    if (animState.current === "idle") {
      if (joyAxis.current === "x" && Math.abs(joyRotZ.current) > 0.02) {
        const dir = joyRotZ.current < 0 ? 1 : -1;
        if (craneGroupRef.current) {
          craneGroupRef.current.position.x = THREE.MathUtils.clamp(
            craneGroupRef.current.position.x + dir * CRANE_MOVE_SPEED * delta,
            CRANE_MIN_X, CRANE_MAX_X
          );
        }
      }
      if (joyAxis.current === "z" && Math.abs(joyRotX.current) > 0.02) {
        const dir = joyRotX.current > 0 ? 1 : -1;
        if (vertGroupRef.current) {
          vertGroupRef.current.position.z = THREE.MathUtils.clamp(
            vertGroupRef.current.position.z + dir * CRANE_MOVE_SPEED * delta,
            CRANE_MIN_Z, CRANE_MAX_Z
          );
        }
      }
    }

    if (triggerAnimation && animState.current === "idle") {
      animState.current = "pressing";
      stateTime.current = 0;
      dropStartX.current = craneGroupRef.current?.position.x ?? 0;
      dropStartZ.current = vertGroupRef.current?.position.z  ?? 0;
    }

    // 3. Animation state machine
    switch (animState.current) {
      case "pressing": {
        stateTime.current += delta * 5;
        if (buttonRef.current) {
          buttonRef.current.position.y = -Math.sin(Math.min(stateTime.current, Math.PI)) * 0.1;
        }
        if (stateTime.current >= Math.PI) { animState.current = "lowering"; stateTime.current = 0; }
        break;
      }
      case "lowering": {
        const next = clawY.current - delta * 2.5;
        applyClawY(next);
        if (clawY.current <= LOWER_DEPTH) { animState.current = "closing"; stateTime.current = 0; }
        break;
      }
      case "closing": {
        stateTime.current += delta * 3;
        const t = Math.min(stateTime.current, 1);
        if (leftRef.current)  leftRef.current.rotation.z  = THREE.MathUtils.lerp(0,  CLAW_CLOSE_ROT, t);
        if (rightRef.current) rightRef.current.rotation.z = THREE.MathUtils.lerp(0, -CLAW_CLOSE_ROT, t);
        if (stateTime.current >= 1) { animState.current = "raising"; }
        break;
      }
      case "raising": {
        const next = clawY.current + delta * 2.5;
        applyClawY(Math.min(next, 0));
        if (clawY.current >= 0) {
          applyClawY(0);
          animState.current = "movingX"; stateTime.current = 0;
        }
        break;
      }
      case "movingX": {
        stateTime.current += delta * ANIM_SPEED;
        const t = Math.min(stateTime.current, 1);
        if (craneGroupRef.current) craneGroupRef.current.position.x = THREE.MathUtils.lerp(dropStartX.current, DROP_ZONE_X, t);
        if (vertGroupRef.current)  vertGroupRef.current.position.z  = THREE.MathUtils.lerp(dropStartZ.current, DROP_ZONE_Z, t);
        if (stateTime.current >= 1) {
          if (craneGroupRef.current) craneGroupRef.current.position.x = DROP_ZONE_X;
          if (vertGroupRef.current)  vertGroupRef.current.position.z  = DROP_ZONE_Z;
          // Skip lowerDrop — go straight to opening the claw
          animState.current = "openClaw"; stateTime.current = 0;
        }
        break;
      }
      case "openClaw": {
        stateTime.current += delta * 3;
        const t = Math.min(stateTime.current, 1);
        if (leftRef.current)  leftRef.current.rotation.z  = THREE.MathUtils.lerp(-CLAW_CLOSE_ROT, 0, t);
        if (rightRef.current) rightRef.current.rotation.z = THREE.MathUtils.lerp( CLAW_CLOSE_ROT, 0, t);
        if (stateTime.current >= 1) {
          onAnimationComplete();
          animState.current = "raiseReturn"; stateTime.current = 0;
        }
        break;
      }
      case "raiseReturn": {
        // Already at y=0 (no lowering was done), go straight to returnX
        animState.current = "returnX"; stateTime.current = 0;
        break;
      }
      case "returnX": {
        stateTime.current += delta * ANIM_SPEED;
        const t = Math.min(stateTime.current, 1);
        if (craneGroupRef.current) craneGroupRef.current.position.x = THREE.MathUtils.lerp(DROP_ZONE_X, 0, t);
        if (vertGroupRef.current)  vertGroupRef.current.position.z  = THREE.MathUtils.lerp(DROP_ZONE_Z, 0, t);
        if (stateTime.current >= 1) {
          if (craneGroupRef.current) craneGroupRef.current.position.x = 0;
          if (vertGroupRef.current)  vertGroupRef.current.position.z  = 0;
          animState.current = "idle";
          setTriggerAnimation(false);
        }
        break;
      }
      default: break;
    }
  });

  return (
    <>
      {/* Background Frame Core */}
      <primitive object={clones["body"]} />

      {/* Button Assembly */}
      <group
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          onButtonClick();
        }}
        onPointerDown={(e) => { e.stopPropagation(); }}
        onPointerUp={(e) => { e.stopPropagation(); }}
      >
        <primitive object={clones["button"]} />
      </group>

      {/* Joystick Pivot Wrapper */}
      <group
        ref={joystickRef}
        position={pivotOffsets.joystick}
        onPointerDown={(e) => {
          e.stopPropagation();
          isDragging.current = true;
          joystickPointerId.current = e.pointerId;
          dragStart.current = { x: e.clientX, y: e.clientY };
          joyAxis.current = null;
          // Capture pointer for reliable touch tracking
          (e.target as Element & { setPointerCapture?: (id: number) => void })
            ?.setPointerCapture?.(e.pointerId);
        }}
      >
        <primitive object={clones["joystick"]} position={pivotOffsets.joystick.clone().negate()} />
      </group>

      {/* MAIN HORIZONTAL CRANE TRACK ASSEMBLY */}
      <group ref={craneGroupRef}>
        <primitive object={clones["sides"]} />

        <group ref={vertGroupRef}>
          <primitive object={clones["holder"]} />

          {/* Rope */}
          <group ref={ropeRef}>
            <primitive object={clones["rope"]} />
          </group>

          {/* Left Claw — initial Y set in useEffect via applyClawY(0) */}
          <group
            ref={leftRef}
            position={[pivotOffsets.left.x, pivotOffsets.left.y, pivotOffsets.left.z]}
          >
            <primitive object={clones["left"]} position={pivotOffsets.left.clone().negate()} />
          </group>

          {/* Right Claw */}
          <group
            ref={rightRef}
            position={[pivotOffsets.right.x, pivotOffsets.right.y, pivotOffsets.right.z]}
          >
            <primitive object={clones["right"]} position={pivotOffsets.right.clone().negate()} />
          </group>
        </group>
      </group>
    </>
  );
}

function CameraRig() {
  const { camera, scene } = useThree();
  const done = useRef(false);

  useFrame(() => {
    if (done.current) return;
    const box = new THREE.Box3().setFromObject(scene);
    if (box.isEmpty()) return;
    done.current = true;

    const center = new THREE.Vector3();
    const size   = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov    = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
    const dist   = (maxDim / 2) / Math.tan(fov / 2) * 1.4;

    camera.position.set(center.x, center.y + size.y * 0.15, center.z + dist);
    camera.lookAt(center);
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  });

  return null;
}

interface ViewerProps {
  onAnimationComplete: () => void;
  triggerAnimation: boolean;
  setTriggerAnimation: (val: boolean) => void;
  onButtonClick: () => void;
}

export default function ClawMachineViewer({
  onAnimationComplete,
  triggerAnimation,
  setTriggerAnimation,
  onButtonClick,
}: ViewerProps) {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: "400px" }}>
      <Canvas camera={{ position: [0, 2, 18], fov: 100 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={4.5} />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />
        <Suspense fallback={null}>
          <ModelAssembly
            onAnimationComplete={onAnimationComplete}
            triggerAnimation={triggerAnimation}
            setTriggerAnimation={setTriggerAnimation}
            onButtonClick={onButtonClick}
          />
          <CameraRig />
        </Suspense>
      </Canvas>
    </div>
  );
}

MODEL_PARTS.forEach((part) => {
  useGLTF.preload(`/models/claw-${part}.glb`);
});