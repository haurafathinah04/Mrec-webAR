"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const targetFiles = [
  "Achmad3D.png",    // 0: Achmad Maulana H.
  "AlfonFS.png",     // 1: Alfonsus Dwianka S.
  "AqbilUnity.png",   // 2: Moh Aqbil Jizdan A.L.
  "ArgoUnity.png",    // 3: Rizky Argo Pradana
  "AzkaUIUX.png",     // 4: Alifia Azka Alfarisi
  "ChelsaUIUX.png",   // 5: Chelsa Alya Salvasta
  "DeckaUnity.png",   // 6: Decka Hardiana
  "FarrelUnity.png",  // 7: M. Farrel Agatha
  "FauzanUnity.png",  // 8: Ahmad Fauzan R.
  "FirasUnity.png",   // 9: Firas Naufan M.
  "FredyUnity.png",   // 10: M. Fauzan Fredi
  "HauraFS.png",      // 11: Haura Fathinah A.M.
  "MuthiaUIUX.png",   // 12: Muthia Luthfi N.
  "Najma3D.png",      // 13: Najma
  "NikiUIUX.png",     // 14: Niki Giri
  "RanggaUnity.png",  // 15: Rangga Pratama W.
  "RifkyFS.png",      // 16: M. Rifky Nadhif A.
  "RimbaPM.png",      // 17: A. Rimba M.P., A.Md.Kom.
  "Sahib3D.png",      // 18: M. Alifadzia Sahib
  "Syukur3D.png",     // 19: Syukur Wijitama
  "TiaraUIUX.png",                       // 20: Nabila Tiara Jasmine
  "April_Creative_Content_Designer.png", // 21: Ayu Aprilia
  "Hendika_AI_Engginer.png",             // 22: Muhammad Hendika Putra
];

export default function CompilePage() {
  const [status, setStatus] = useState("Menunggu...");
  const [progress, setProgress] = useState(0);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Load script MindAR Compiler
    if ((window as any).MINDAR?.IMAGE?.Compiler) {
      setStatus("Compiler siap.");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js";
    script.async = true;
    script.onload = () => {
      setStatus("Compiler siap digunakan.");
    };
    script.onerror = () => {
      setStatus("Gagal memuat modul MindAR Compiler dari CDN.");
    };
    document.body.appendChild(script);
  }, []);

  const handleStartCompile = async () => {
    try {
      setIsCompiling(true);
      setIsDone(false);
      setStatus("Memuat 21 gambar ID Card...");
      setProgress(5);

      const loadedImages: HTMLImageElement[] = [];

      for (let i = 0; i < targetFiles.length; i++) {
        const file = targetFiles[i];
        setStatus(`Memuat gambar ${i + 1}/${targetFiles.length}: ${file}`);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = `/targets/${file}`;

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error(`Gagal memuat /targets/${file}`));
        });

        loadedImages.push(img);
      }

      setStatus("Memulai proses ekstraksi titik fitur MindAR (mohon tunggu)...");
      setProgress(10);

      const CompilerClass = (window as any).MINDAR?.IMAGE?.Compiler;
      if (!CompilerClass) {
        throw new Error("MINDAR.IMAGE.Compiler belum tersedia");
      }

      const compiler = new CompilerClass();

      await compiler.compileImageTargets(loadedImages, (percent: number) => {
        const calcProgress = Math.min(95, Math.round(10 + percent * 0.85));
        setProgress(calcProgress);
        setStatus(`Sedang mengekstrak fitur: ${Math.round(percent)}%`);
      });

      setStatus("Mengekspor data biner targets.mind...");
      setProgress(96);

      const exportedBuffer = await compiler.exportData();

      setStatus(`Menyimpan targets.mind (${exportedBuffer.length} bytes)...`);
      setProgress(98);

      const res = await fetch("/api/save-targets", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
        },
        body: exportedBuffer,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan file");
      }

      setProgress(100);
      setStatus("SELESAI! Seluruh 21 target berhasil di-training ulang dan disimpan ke public/targets/targets.mind.");
      setIsDone(true);
    } catch (err: any) {
      console.error(err);
      setStatus(`ERROR: ${err.message}`);
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 flex flex-col items-center justify-center">
      <div className="max-w-xl w-full bg-neutral-900 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
        <h1 className="text-2xl font-black text-center text-white">
          MREC AR Target Compiler
        </h1>
        <p className="text-xs text-zinc-400 text-center leading-relaxed">
          Alat ini akan mengekstrak fitur geometris dari seluruh 21 ID Card secara berurutan (index 0 s/d 20) dan mengompilasinya menjadi file <code className="text-red-400">targets.mind</code> baru yang presisi.
        </p>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Status:</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-neutral-800 h-3 rounded-full overflow-hidden">
            <div
              className="bg-red-600 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs font-semibold text-cyan-400 mt-2 text-center">
            {status}
          </p>
        </div>

        {/* Action Button */}
        <button
          id="btn-start-compile"
          onClick={handleStartCompile}
          disabled={isCompiling}
          className={`w-full py-4 rounded-2xl font-bold text-sm shadow-xl transition-all cursor-pointer ${
            isCompiling
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              : isDone
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white hover:scale-[1.02]"
          }`}
        >
          {isCompiling
            ? "Sedang Men-training 21 Kartu..."
            : isDone
            ? "✓ Training Selesai! Klik untuk Ulangi"
            : "Mulai Training Ulang Semua Target (21 Kartu)"}
        </button>

        <div className="pt-4 border-t border-white/5 flex justify-between items-center text-xs">
          <Link href="/scan-id" className="text-zinc-400 hover:text-white transition">
            ← Kembali ke Halaman Scan AR
          </Link>
          <span className="text-zinc-500">Total: 21 Kartu</span>
        </div>
      </div>
    </div>
  );
}
