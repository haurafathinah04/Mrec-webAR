"use client";

import { useEffect } from "react";
import { useLoader } from "@react-three/fiber";
import { FBXLoader } from "three-stdlib";
import * as THREE from "three";

interface DynamicModelProps {
  modelPath: string;
  textureFolderPath?: string;
}

export default function DynamicModelFBX({ modelPath, textureFolderPath }: DynamicModelProps) {
  const fbx = useLoader(FBXLoader, modelPath);

  useEffect(() => {
    if (textureFolderPath) {
      const textureLoader = new THREE.TextureLoader();
      // Meload tekstur utama dari folder material
      const baseTexture = textureLoader.load(`${textureFolderPath}/texture.png`);

      fbx.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.material = new THREE.MeshStandardMaterial({ map: baseTexture });
        }
      });
    }
  }, [fbx, textureFolderPath]);

  return <primitive object={fbx} scale={0.01} position={[0, -1, 0]} />;
}