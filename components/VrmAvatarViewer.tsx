"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";

function VrmModel({ url }: { url: string }) {
  const [scene, setScene] = useState<VRM["scene"] | null>(null);
  const vrmRef = useRef<VRM | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(url, (gltf) => {
      if (cancelled) {
        VRMUtils.deepDispose(gltf.scene);
        return;
      }
      const vrm = gltf.userData.vrm as VRM;
      VRMUtils.removeUnnecessaryVertices(gltf.scene);
      VRMUtils.combineSkeletons(gltf.scene);
      VRMUtils.rotateVRM0(vrm); // VRM 0.x models face +Z; VRM 1.x already face the camera
      vrmRef.current = vrm;
      setScene(vrm.scene);
    });

    return () => {
      cancelled = true;
      if (vrmRef.current) {
        VRMUtils.deepDispose(vrmRef.current.scene);
        vrmRef.current = null;
      }
    };
  }, [url]);

  useFrame((_, delta) => {
    vrmRef.current?.update(delta);
  });

  if (!scene) {
    return (
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color="#94a3b8" wireframe />
      </mesh>
    );
  }

  return <primitive object={scene} />;
}

export function VrmAvatarViewer({ url, className }: { url: string; className?: string }) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 1.3, 1.6], fov: 30 }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[1, 2, 1]} intensity={1.2} />
        <VrmModel url={url} />
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
