"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { AvatarIdleRig } from "@/components/AvatarIdleRig";

function GltfModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function LoadingPlaceholder() {
  return (
    <mesh>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshBasicMaterial color="#94a3b8" wireframe />
    </mesh>
  );
}

export function Avatar3DViewer({
  url,
  className,
  autoRotate = false,
  interactive = true,
  standing = false,
}: {
  url: string;
  className?: string;
  autoRotate?: boolean;
  interactive?: boolean;
  /** Full-body "standing on your card" framing + a subtle idle sway, instead of the tight bust-level editor framing. */
  standing?: boolean;
}) {
  const cameraPosition: [number, number, number] = standing ? [0, 1.1, 4.2] : [0, 0.9, 3.3];
  const fov = standing ? 30 : 35;
  const target: [number, number, number] = standing ? [0, 1.0, 0] : [0, 0.9, 0];

  return (
    <div className={className}>
      <Canvas camera={{ position: cameraPosition, fov }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[1, 2, 1]} intensity={1.2} />
        <Suspense fallback={<LoadingPlaceholder />}>
          {standing ? (
            <AvatarIdleRig>
              <GltfModel url={url} />
            </AvatarIdleRig>
          ) : (
            <GltfModel url={url} />
          )}
        </Suspense>
        <OrbitControls
          target={target}
          enablePan={false}
          enableRotate={interactive}
          enableZoom={interactive}
          minDistance={0.8}
          maxDistance={5}
          maxPolarAngle={Math.PI / 1.6}
          autoRotate={autoRotate}
          autoRotateSpeed={1.2}
        />
      </Canvas>
    </div>
  );
}
