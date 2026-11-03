"use client";

import Link from "next/link";
import Image from "next/image";
import { Camera } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#070709] text-white flex flex-col justify-between overflow-hidden">
      {/* Background Glow Red & Dark Gradient Effect */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[700px] h-[700px] bg-red-600/30 rounded-full blur-[180px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/40 via-[#070709] to-[#070709] -z-20" />

      {/* Main Hero Section */}
      <main className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-12 gap-8 items-center w-full my-auto">

        {/* Left Side: Text & CTA */}
        <div className="md:col-span-7 space-y-6 text-left z-10 -ml-2 lg:-ml-6">
          {/* Logo MREC */}
          <div className="relative h-8 sm:h-10 w-auto inline-block">
            <Image
              src="/Logo_MREC_clean.png"
              alt="MREC Logo"
              width={260}
              height={75}
              unoptimized
              priority
              className="h-full w-auto object-contain"
            />
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tight text-white">
            Metaverse Research <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-rose-400">
              and Experience Center
            </span>
          </h1>

          <p className="text-zinc-400 leading-relaxed text-base md:text-lg max-w-xl font-normal">
            MREC adalah Pusat Keunggulan (Center of Excellence) di Universitas Telkom yang berfokus pada penelitian dan pengembangan teknologi metaverse, realitas virtual, dan identitas digital interaktif.
          </p>

          {/* Action Button */}
          <div className="pt-4">
            <Link
              href="/scan-id"
              className="inline-flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-xl shadow-red-600/40 transition-all hover:scale-105 active:scale-95 border border-red-500/30 text-base"
            >
              <Camera className="w-5 h-5" />
              <span>Start AR Experience</span>
            </Link>
          </div>
        </div>

        {/* Right Side: ID Card dengan Animasi Mengambang (Floating Halus) */}
        <div className="md:col-span-5 flex justify-center md:justify-end items-center relative pl-4">
          <div className="absolute w-[400px] h-[400px] bg-red-600/40 rounded-full blur-[100px] pointer-events-none animate-pulse" />

          {/* Card dengan inline style memanggil keyframes di globals.css */}
          <div
            className="relative w-full max-w-2xl transform md:translate-x-12"
            style={{ animation: "floatEffect 3s ease-in-out infinite" }}
          >
            <Image
              src="/Card.png"
              alt="MREC ID Card Preview"
              width={900}
              height={600}
              className="w-full h-auto object-contain drop-shadow-[0_25px_60px_rgba(239,68,68,0.45)]"
              priority
            />
          </div>
        </div>

      </main>

      {/* Footer Minimalis */}
      <footer className="px-8 py-6 text-center text-xs text-zinc-500 border-t border-white/5 bg-black/40 backdrop-blur-md">
        © 2026 MREC - Telkom University. All rights reserved.
      </footer>
    </div>
  );
}
