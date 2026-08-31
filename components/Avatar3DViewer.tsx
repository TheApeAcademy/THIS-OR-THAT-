"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

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

export function Avatar3DViewer({ url, className }: { url: string; className?: string }) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 1.3, 1.6], fov: 30 }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[1, 2, 1]} intensity={1.2} />
        <Suspense fallback={<LoadingPlaceholder />}>
          <GltfModel url={url} />
        </Suspense>
        <OrbitControls
          target={[0, 1.1, 0]}
          enablePan={false}
          minDistance={0.8}
          maxDistance={3}
          maxPolarAngle={Math.PI / 1.6}
        />
      </Canvas>
    </div>
  );
}
