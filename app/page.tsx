"use client";

import { useState } from "react";
import Link from "next/link";
import { Camera, Menu, Globe } from "lucide-react";

export default function Home() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#FFF8F8] text-slate-900 flex flex-col justify-between overflow-x-hidden">
      
      {/* Background Glow Merah (Di belakang card) */}
      <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[420px] bg-red-600/25 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Header Navbar */}
      <header className="max-w-[1400px] w-full mx-auto px-10 sm:px-16 pt-10 pb-6 flex justify-between items-center z-20">
        {/* Logo MREC Kiri */}
        <Link href="/" className="flex items-center gap-2 pl-4">
          <img
            src="/Logo_MREC_clean.png"
            alt="MREC Logo"
            className="h-12 sm:h-14 w-auto object-contain"
          />
        </Link>
        
        {/* Menu Kanan */}
        <div className="relative pr-4">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl shadow-md border border-zinc-200 text-xs sm:text-sm font-bold tracking-widest cursor-pointer hover:bg-zinc-50 transition text-zinc-800"
          >
            <span>MENU</span>
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-zinc-100 py-2 z-30 animate-in fade-in slide-in-from-top-2">
              <Link
                href="https://mrec-company-profile-production.up.railway.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
              >
                <Globe className="w-4 h-4 text-red-600" />
                <span>Website Utama</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-4 flex flex-col items-center justify-center text-center z-10 my-auto w-full">
        
        {/* Container Utama Card & 5 Ornamen Posisi Awal */}
        <div className="relative w-full max-w-4xl mx-auto flex items-center justify-center mb-6 py-8">
          
          {/* 1. Prism (Kiri Atas Card) */}
          <div className="absolute -top-4 left-[12%] z-30 pointer-events-none animate-floatSlow">
            <div className="w-16 h-16 opacity-90 -rotate-12">
              <img src="/prism.png" alt="Prism" className="w-full h-full object-contain drop-shadow-md" />
            </div>
          </div>

          {/* 2. Sphere (Sebelah Kiri Card) */}
          <div className="absolute top-[45%] left-[2%] z-30 pointer-events-none animate-floatFast">
            <div className="w-9 h-9 opacity-85">
              <img src="/sphere.png" alt="Sphere" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
          </div>

          {/* 3. Glowing (Sebelah Kanan Card) */}
          <div className="absolute top-[38%] -right-2 z-30 pointer-events-none animate-floatMedium">
            <div className="w-28 h-28 opacity-95 rotate-12">
              <img src="/Glowing.png" alt="Glowing" className="w-full h-full object-contain drop-shadow-lg" />
            </div>
          </div>

          {/* 4. Ruby (Kiri Bawah Card) */}
          <div className="absolute -bottom-2 left-[15%] z-30 pointer-events-none animate-floatSlow">
            <div className="w-20 h-20 opacity-90 rotate-12">
              <img src="/ruby.png" alt="Ruby" className="w-full h-full object-contain drop-shadow-md" />
            </div>
          </div>

          {/* 5. Diamonds (Kanan Bawah Card) */}
          <div className="absolute bottom-0 right-[14%] z-30 pointer-events-none animate-floatFast">
            <div className="w-16 h-16 opacity-90 -rotate-12">
              <img src="/diamonds.png" alt="Diamonds" className="w-full h-full object-contain drop-shadow-md" />
            </div>
          </div>

          {/* Visual Card Utama (Menggunakan caard.png) */}
          <div className="relative w-full max-w-3xl mx-auto flex items-center justify-center z-10 animate-floatEffect">
            <div className="w-full drop-shadow-[0_25px_40px_rgba(220,38,38,0.22)]">
              <img
                src="/caard.png"
                alt="MREC ID Card Preview"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>

        {/* Judul & Deskripsi */}
        <div className="space-y-2 max-w-2xl px-4 z-10 mt-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 uppercase whitespace-nowrap">
            Ready to Scan Your ID Card?
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm font-normal">
            Position your ID card within the scanning area to get started.
          </p>
        </div>

        {/* Tombol Aksi */}
        <div className="mt-6 z-10">
          <Link
            href="/scan-id"
            className="inline-flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-xl shadow-red-600/30 transition-all hover:scale-105 active:scale-95 text-xs sm:text-sm tracking-wide"
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Scan Id Card</span>
          </Link>
        </div>

      </main>

      {/* CSS Keyframes Animasi Floating */}
      <style jsx global>{`
        @keyframes floatEffect {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes floatMedium {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes floatFast {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }

        .animate-floatEffect { animation: floatEffect 3s ease-in-out infinite; }
        .animate-floatSlow { animation: floatSlow 4s ease-in-out infinite; }
        .animate-floatMedium { animation: floatMedium 3.5s ease-in-out infinite; }
        .animate-floatFast { animation: floatFast 3s ease-in-out infinite; }
      `}</style>

      {/* Footer Minimalis */}
      <footer className="px-8 py-6 text-center text-xs text-zinc-400 border-t border-zinc-200 bg-white/50 backdrop-blur-sm z-10">
        © 2026 MREC - Telkom University. All rights reserved.
      </footer>
    </div>
  );
}