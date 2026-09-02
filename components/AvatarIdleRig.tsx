"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

/**
 * Cheap procedural idle sway for a loaded avatar scene - Avaturn exports
 * carry no animation clips, so this fakes "standing, breathing" with a
 * small sinusoidal yaw + vertical bob instead of a real animation asset.
 */
export function AvatarIdleRig({ children }: { children: React.ReactNode }) {
  const ref = useRef<Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = Math.sin(t * 0.4) * 0.05;
    ref.current.position.y = Math.sin(t * 0.8) * 0.012;
  });

  return <group ref={ref}>{children}</group>;
}
