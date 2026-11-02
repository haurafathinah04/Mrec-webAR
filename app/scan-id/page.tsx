"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Member {
  id: string;
  nama: string;
  kategori: string;
  role: string;
  deskripsi: string;
  foto?: string;
  model: string;
  textureFolder?: string;
}

export default function ScanPage() {
  const [markerData, setMarkerData] = useState<Record<number, Member>>({});
  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [statusText, setStatusText] = useState("Memuat sistem AR...");
  const [isReady, setIsReady] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  // 1. Fetch data member
  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch("/api/markers");
        if (!res.ok) throw new Error("Gagal mengambil data");
        const data = await res.json();
        setMarkerData(data);
        setIsReady(true);
        setStatusText("Siap mengaktifkan kamera");
      } catch (err) {
        console.error(err);
        setStatusText("Gagal memuat data member");
      }
    }
    fetchMembers();
  }, []);

  // 2. Load script A-Frame & MindAR secara berurutan
  useEffect(() => {
    if ((window as any).AFRAME) return;

    const aframeScript = document.createElement("script");
    aframeScript.src = "https://aframe.io/releases/1.5.0/aframe.min.js";
    aframeScript.async = false;
    document.body.appendChild(aframeScript);

    aframeScript.onload = () => {
      const mindarScript = document.createElement("script");
      mindarScript.src = "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js";
      mindarScript.async = false;
      document.body.appendChild(mindarScript);
    };

    return () => {
      // Matikan stream kamera saat keluar halaman
      const videos = document.querySelectorAll("video");
      videos.forEach((v) => {
        const stream = v.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
        }
      });
    };
  }, []);

  // 3. Fungsi Start Kamera & AR yang dipicu tombol
  const handleStartCamera = () => {
    setIsStarted(true);
    setStatusText("Mengarahkan kamera ke ID Card...");

    setTimeout(() => {
      const sceneEl = document.querySelector("a-scene");
      if (!sceneEl) return;

      // Bersihkan entity target lama
      const existingTargets = sceneEl.querySelectorAll("[mindar-image-target]");
      existingTargets.forEach((el) => el.remove());

      // Masukkan target entity berdasarkan data marker
      Object.keys(markerData).forEach((targetIndexStr) => {
        const targetIndex = Number(targetIndexStr);
        const member = markerData[targetIndex];

        const targetEntity = document.createElement("a-entity");
        targetEntity.setAttribute("mindar-image-target", `targetIndex: ${targetIndex}`);

        if (member && member.model) {
          const modelEntity = document.createElement("a-entity");
          
          if (member.model.endsWith(".glb") || member.model.endsWith(".gltf")) {
            modelEntity.setAttribute("gltf-model", member.model);
          } else {
            modelEntity.setAttribute("fbx-model", member.model);
          }

          modelEntity.setAttribute("position", "0 0 0");
          modelEntity.setAttribute("scale", "0.01 0.01 0.01");
          modelEntity.setAttribute(
            "animation",
            "property: position; to: 0 0.1 0; dir: alternate; dur: 1500; loop: true; easing: easeInOutSine;"
          );

          targetEntity.appendChild(modelEntity);
        }

        targetEntity.addEventListener("targetFound", () => {
          setActiveMember(member);
          setStatusText(`Terdeteksi: ${member.nama}`);
        });

        targetEntity.addEventListener("targetLost", () => {
          setActiveMember(null);
          setStatusText("Mencari ID Card MREC...");
        });

        sceneEl.appendChild(targetEntity);
      });

      // Paksa jalankan sistem MindAR via A-Frame component/system
      if (sceneEl.systems && sceneEl.systems["mindar-image-system"]) {
        sceneEl.systems["mindar-image-system"].start();
      } else {
        sceneEl.setAttribute(
          "mindar-image",
          "imageTargetSrc: /targets/targets.mind; autoStart: true;"
        );
      }
    }, 600);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black text-white">
      {/* Layer 1: A-Frame Scene (Hanya muncul setelah tombol ditekan) */}
      {isStarted && (
        <div className="absolute inset-0 z-0">
          {/* @ts-ignore */}
          <a-scene
            mindar-image="imageTargetSrc: /targets/targets.mind; autoStart: true;"
            color-space="sRGB"
            renderer="colorManagement: true, physicallyCorrectLights"
            vr-mode-ui="enabled: false"
            device-orientation-permission-ui="enabled: false"
            loading-screen="enabled: false"
            embedded
            style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
          >
            {/* @ts-ignore */}
            <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
          {/* @ts-ignore */}
          </a-scene>
        </div>
      )}

      {/* Layer 2: Header (Tombol Kembali & Status) */}
      <div className="absolute top-6 left-6 right-6 z-30 flex justify-between items-center pointer-events-none">
        <Link
          href="/"
          className="flex items-center gap-2 text-white bg-black/60 hover:bg-black/90 px-4 py-2 rounded-xl backdrop-blur-md pointer-events-auto border border-white/10 transition shadow-lg text-xs font-bold"
        >
          ← Kembali
        </Link>

        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-cyan-400 text-xs font-semibold tracking-wide">
          {statusText}
        </div>
      </div>

      {/* Layer 3: Tombol Pemicu Utama (Paling Wajib untuk Buka Kamera di Browser) */}
      {!isStarted && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/95 p-6 text-center">
          <div className="max-w-md space-y-4">
            <h2 className="text-3xl font-black text-white">MREC AR Scanner</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Tekan tombol di bawah untuk memberikan izin kamera dan mulai memindai ID Card MREC.
            </p>
            <button
              onClick={handleStartCamera}
              disabled={!isReady}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-white shadow-xl transition-all ${
                isReady
                  ? "bg-red-600 hover:bg-red-700 shadow-red-600/50 cursor-pointer hover:scale-105"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              }`}
            >
              {isReady ? "Aktifkan Kamera AR" : "Memuat Data..."}
            </button>
          </div>
        </div>
      )}

      {/* Layer 4: Pop-up Info Member */}
      {activeMember && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-sm bg-white/95 text-slate-900 p-5 rounded-3xl shadow-2xl backdrop-blur-md border border-white/20 animate-in fade-in slide-in-from-bottom-6">
          <h2 className="text-2xl font-black">{activeMember.nama}</h2>
          <p className="text-xs font-bold text-red-600 uppercase tracking-wider mt-0.5">
            {activeMember.role} • {activeMember.kategori}
          </p>
          <p className="mt-3 text-xs text-slate-600 leading-relaxed">
            {activeMember.deskripsi}
          </p>
        </div>
      )}
    </main>
  );
}