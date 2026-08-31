import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Renders one frame of a glTF/GLB model to a PNG blob, client-side, with
 * plain three.js (no R3F/React tree needed for a one-off capture). Camera
 * framing matches components/Avatar3DViewer.tsx so the still snapshot and
 * the interactive viewer agree on how the avatar is posed.
 */
export async function captureGlbSnapshot(glbUrl: string, size = 512): Promise<Blob> {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(glbUrl);

  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, preserveDrawingBuffer: true, antialias: true });
  renderer.setSize(size, size, false);

  try {
    const scene = new THREE.Scene();
    scene.add(gltf.scene);
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const directional = new THREE.DirectionalLight(0xffffff, 1.2);
    directional.position.set(1, 2, 1);
    scene.add(directional);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 10);
    camera.position.set(0, 1.3, 1.6);
    camera.lookAt(0, 1.1, 0);

    renderer.render(scene, camera);
    const dataUrl = canvas.toDataURL("image/png");
    const response = await fetch(dataUrl);
    return await response.blob();
  } finally {
    renderer.dispose();
  }
}
