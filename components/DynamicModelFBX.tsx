"use client";

import { useEffect, useRef } from "react";
import { useLoader, useFrame } from "@react-three/fiber";
import { FBXLoader } from "three-stdlib";
import * as THREE from "three";

interface DynamicModelProps {
  modelPath: string;
  texturePath?: string;
  textureFolderPath?: string;
}

export default function DynamicModelFBX({
  modelPath,
  texturePath,
  textureFolderPath,
}: DynamicModelProps) {
  const fbx = useLoader(FBXLoader, modelPath);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!fbx) return;

    // 1. Selalu reset transform ke netral agar hitungan Bounding Box stabil 100%
    fbx.position.set(0, 0, 0);
    fbx.rotation.set(0, 0, 0);
    fbx.scale.set(1, 1, 1);
    fbx.updateMatrixWorld(true);

    // 2. Hitung Bounding Box dari model murni unscaled
    const box = new THREE.Box3().setFromObject(fbx);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Ukuran target ideal di dalam kotak scanner (tinggi ~2.1 unit presisi)
    const TARGET_HEIGHT = 2.15;
    const height = size.y > 0 ? size.y : 1.0;
    const scaleFactor = TARGET_HEIGHT / height;

    // Terapkan scale dan centering pas di tengah viewport
    fbx.scale.set(scaleFactor, scaleFactor, scaleFactor);
    fbx.position.x = -center.x * scaleFactor;
    fbx.position.y = -box.min.y * scaleFactor - (TARGET_HEIGHT / 2);
    fbx.position.z = -center.z * scaleFactor;

    // 3. Muat tekstur basecolor
    const resolvedTexture =
      texturePath ||
      (textureFolderPath ? `${textureFolderPath}/fauzanrpla_basecolor.JPEG` : "");

    if (resolvedTexture) {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        resolvedTexture,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          fbx.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.material = new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.5,
                metalness: 0.1,
              });
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          });
        },
        undefined,
        (err) => {
          console.warn("Info texture error:", err);
        }
      );
    }
  }, [fbx, texturePath, textureFolderPath]);

  // Animasi rotasi perlahan otomatis 360 derajat
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.45;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={fbx} />
    </group>
  );
}
