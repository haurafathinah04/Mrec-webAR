"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Camera Error:", error);
      }
    };

    startCamera();
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden">

      {/* Kamera */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay Gelap */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20">

        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-white bg-black/40 px-4 py-2 rounded-xl backdrop-blur-md"
        >
          ← Back
        </button>

        <h1 className="text-white text-4xl font-bold text-center">
          SCAN ID CARD
        </h1>

        <p className="text-center text-white/80 mt-2">
          Arahkan kamera ke kartu identitas
        </p>
      </div>

      {/* Area Scan */}
      <div className="absolute inset-0 flex items-center justify-center">

        <div className="relative w-[350px] h-[220px]">

          {/* Sudut Scan */}
          <div className="absolute top-0 left-0 w-12 h-12 border-l-4 border-t-4 border-cyan-400" />
          <div className="absolute top-0 right-0 w-12 h-12 border-r-4 border-t-4 border-cyan-400" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-l-4 border-b-4 border-cyan-400" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-r-4 border-b-4 border-cyan-400" />

          {/* Garis Scanner */}
          <div className="absolute left-0 w-full h-1 bg-cyan-400 animate-pulse top-1/2" />

        </div>

      </div>

      {/* Footer */}
      <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-4">

        <button
          className="
            w-24 h-24
            rounded-full
            bg-white
            text-black
            font-bold
            shadow-2xl
          "
        >
          SCAN
        </button>

        <p className="text-white/80 text-sm">
          Pastikan kartu terlihat jelas
        </p>

      </div>

    </main>
  );
}
