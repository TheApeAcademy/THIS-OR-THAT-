import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export type SnapshotPose = "headshot" | "fullbody";

interface PoseConfig {
  width: number;
  height: number;
  fov: number;
  cameraY: number;
  cameraDistance: number;
  targetY: number;
}

// Headshot matches components/Avatar3DViewer.tsx's interactive camera (face
// + shoulders, right for small circular avatars everywhere). Fullbody pulls
// back to frame roughly 2m of vertical space centered on a standing adult
// figure (feet near y=0, head near y~1.7), for contexts that want to show
// the whole avatar rather than a face crop.
//
// This capture's own aspect ratio must match the aspect ratio of the box
// it's ultimately object-cover'd into (ShareCard's portrait panel — a
// ~38%-wide sliver of the whole card, roughly 1:3.7), or object-cover crops
// away most of the frame and leaves only a zoomed-in sliver (in practice,
// a giant close-up of the face). Vertical FOV (head-to-feet framing) is
// unaffected by aspect — only the horizontal slice narrows — so cameraY/
// cameraDistance/targetY stay tuned for the same standing-figure framing,
// just pulled back slightly for shoulder-width margin at this narrow crop.
const POSE_CONFIG: Record<SnapshotPose, PoseConfig> = {
  headshot: { width: 512, height: 512, fov: 30, cameraY: 1.3, cameraDistance: 1.6, targetY: 1.1 },
  fullbody: { width: 300, height: 1120, fov: 35, cameraY: 0.9, cameraDistance: 4.2, targetY: 0.9 },
};

/**
 * Renders one frame of a glTF/GLB model to a PNG blob, client-side, with
 * plain three.js (no R3F/React tree needed for a one-off capture).
 */
export async function captureGlbSnapshot(glbUrl: string, pose: SnapshotPose = "headshot"): Promise<Blob> {
  const config = POSE_CONFIG[pose];
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(glbUrl);

  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, preserveDrawingBuffer: true, antialias: true });
  renderer.setSize(config.width, config.height, false);

  try {
    const scene = new THREE.Scene();
    scene.add(gltf.scene);
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const directional = new THREE.DirectionalLight(0xffffff, 1.2);
    directional.position.set(1, 2, 1);
    scene.add(directional);

    const camera = new THREE.PerspectiveCamera(config.fov, config.width / config.height, 0.1, 10);
    camera.position.set(0, config.cameraY, config.cameraDistance);
    camera.lookAt(0, config.targetY, 0);

    renderer.render(scene, camera);
    const dataUrl = canvas.toDataURL("image/png");
    const response = await fetch(dataUrl);
    return await response.blob();
  } finally {
    renderer.dispose();
  }
}
