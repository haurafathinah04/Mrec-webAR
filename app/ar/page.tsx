"use client";

import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { markerData } from "@/data/members";
import DynamicModelFBX from "@/components/DynamicModelFBX";

export default function ARPage() {
  // Ambil list member dari object markerData
  const membersList = Object.values(markerData);
  
  // State untuk menyimpan member yang sedang aktif terdeteksi
  const [activeMember, setActiveMember] = useState(membersList[0]);

  return (
    <div className="relative w-screen h-screen bg-black text-white">
      {/* Selector/Pilihan ID Card (Ganti Target) */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 overflow-x-auto max-w-full px-4">
        {membersList.map((member) => (
          <button
            key={member.id}
            onClick={() => setActiveMember(member)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeMember.id === member.id
                ? "bg-red-600 text-white"
                : "bg-black/60 text-zinc-300 backdrop-blur-md"
            }`}
          >
            {member.nama} ({member.kategori})
          </button>
        ))}
      </div>

      {/* Pop-up Info Member Aktif */}
      <div className="absolute bottom-6 left-6 z-20 bg-black/70 backdrop-blur-md p-4 rounded-2xl border border-white/10 max-w-xs">
        <h3 className="text-lg font-bold text-red-500">{activeMember.nama}</h3>
        <p className="text-xs font-semibold text-zinc-300">{activeMember.role}</p>
        <p className="text-xs text-zinc-400 mt-2">{activeMember.deskripsi}</p>
      </div>

      {/* 3D Canvas Renderer */}
      <div className="w-full h-full">
        <Canvas camera={{ position: [0, 1, 5], fov: 50 }}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 10, 10]} intensity={2} />

          <Suspense fallback={null}>
            {/* Render 3D Model yang berubah otomatis sesuai activeMember */}
            <DynamicModelFBX
              key={activeMember.id}
              modelPath={activeMember.model}
              texturePath={(activeMember as any).texture}
              textureFolderPath={activeMember.textureFolder}
            />
          </Suspense>

          <OrbitControls enableZoom={true} />
        </Canvas>
      </div>
    </div>
  );
}