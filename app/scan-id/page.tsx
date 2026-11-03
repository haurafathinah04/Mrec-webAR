"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import DynamicModelFBX from "@/components/DynamicModelFBX";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ScanLine,
  Camera,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Zap,
} from "lucide-react";
import * as THREE from "three";
import { FBXLoader } from "three-stdlib";
import { createWorker } from "tesseract.js";

interface Member {
  id: string;
  nama: string;
  kategori: string;
  role: string;
  deskripsi: string;
  foto?: string;
  model: string;
  texture?: string;
  textureFolder?: string;
}

interface VerificationState {
  status: "idle" | "verifying" | "verified";
  confidence: number;
  candidate: Member | null;
  detectedText?: string;
}

// Keyword unik untuk masing-masing dari 21 kartu member MREC
// Membaca langsung teks nama yang tertera di kartu agar tidak mungkin tertukar (misal Najma vs Achmad)
const MEMBER_KEYWORDS: Record<number, string[]> = {
  0: ["ACHMAD", "MAULANA"],
  1: ["ALFONSUS", "ALFON", "DWIANKA"],
  2: ["AQBIL", "AOBIL", "AORIL", "JIZDAN"],
  3: ["ARGO", "PRADANA"],
  4: ["AZKA", "ALFARISI", "ALIFIA"],
  5: ["CHELSA", "SALVASTA", "CHEFEISA"],
  6: ["DECKA", "HARDIANA"],
  7: ["FARREL", "FARRFI", "AGATHA"],
  8: ["FAUZAN R", "AHMAD FAUZAN"],
  9: ["FIRAS", "NAUFAN"],
  10: ["FREDI", "FREDY"],
  11: ["HAURA", "FATHINAH"],
  12: ["MUTHIA", "LUTHFI"],
  13: ["NAJMA", "JMA"],
  14: ["NIKI", "GIRI"],
  15: ["RANGGA"],
  16: ["RIFKY", "NADHIF"],
  17: ["RIMBA", "PROJECT MANAGER"],
  18: ["SAHIB", "FADZIA", "ALIFADZIA", "SAHIR"],
  19: ["SYUKUR", "WIJITAMA"],
  20: ["TIARA", "JASMINE", "NABILA", "NARIIA"],
  21: ["APRIL", "APRILIA", "AYU APRILIA"],
  22: ["HENDIKA", "DIKA", "HENDIKA PUTRA"],
};

export default function ScanPage() {
  const router = useRouter();
  const [markerData, setMarkerData] = useState<Record<number, Member>>({});
  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [verificationState, setVerificationState] = useState<VerificationState>({
    status: "idle",
    confidence: 0,
    candidate: null,
  });
  const [statusText, setStatusText] = useState("Memuat sistem AR...");
  const [isScriptsLoaded, setIsScriptsLoaded] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [trackedTargetIndex, setTrackedTargetIndex] = useState<number | null>(null);
  const trackedIndexRef = useRef<number | null>(null);

  const workerRef = useRef<any>(null);
  const ocrScanningRef = useRef(false);
  const ocrIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const verifiedLockRef = useRef<Member | null>(null);
  const lossTimerRef = useRef<NodeJS.Timeout | null>(null);
  const emptyOcrTicksRef = useRef(0);

  // Status siap hanya ketika data member dan script MindAR sudah 100% selesai dimuat
  const isReady = Object.keys(markerData).length > 0 && isScriptsLoaded;

  // Fungsi pembersihan total AR dan kamera
  const cleanupAR = useCallback(() => {
    if (lossTimerRef.current) {
      clearTimeout(lossTimerRef.current);
      lossTimerRef.current = null;
    }

    if (ocrIntervalRef.current) {
      clearInterval(ocrIntervalRef.current);
      ocrIntervalRef.current = null;
    }

    if (workerRef.current) {
      try {
        workerRef.current.terminate();
      } catch (e) {
        console.warn("Worker terminate error:", e);
      }
      workerRef.current = null;
    }

    try {
      const sceneEl = document.querySelector("a-scene") as any;
      if (sceneEl?.systems?.["mindar-image-system"]) {
        sceneEl.systems["mindar-image-system"].stop();
      }
    } catch (e) {
      console.warn("Gagal stop MindAR system:", e);
    }

    const videos = document.querySelectorAll("video");
    videos.forEach((video) => {
      try {
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      } catch (e) {
        console.warn("Gagal stop video track:", e);
      }
      video.remove();
    });

    document
      .querySelectorAll(
        ".mindar-ui-overlay, .mindar-ui-scanning, .mindar-ui-loading, .mindar-ui-compatibility, .a-canvas, .a-enter-vr, .a-enter-ar"
      )
      .forEach((el) => {
        el.remove();
      });
  }, []);

  // 1. Hook getUserMedia untuk memaksa resolusi tinggi HD / Full HD (Kamera Jernih)
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) return;

    const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

    navigator.mediaDevices.getUserMedia = async (constraints: any) => {
      let enhanced = constraints;
      if (constraints && typeof constraints === "object") {
        if (typeof constraints.video === "boolean") {
          enhanced = {
            ...constraints,
            video: {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              facingMode: "environment",
            },
          };
        } else if (typeof constraints.video === "object") {
          enhanced = {
            ...constraints,
            video: {
              ...constraints.video,
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              advanced: [{ focusMode: "continuous" }],
            },
          };
        }
      }
      return originalGetUserMedia(enhanced);
    };

    return () => {
      navigator.mediaDevices.getUserMedia = originalGetUserMedia;
      cleanupAR();
    };
  }, [cleanupAR]);

  // 2. Fetch data member & siapkan AI OCR Engine
  useEffect(() => {
    async function initDataAndOCR() {
      try {
        const res = await fetch("/api/markers");
        if (!res.ok) throw new Error("Gagal mengambil data");
        const data = await res.json();
        setMarkerData(data);

        // Inisialisasi Tesseract OCR worker di background thread
        try {
          const worker = await createWorker("eng");
          await worker.setParameters({
            tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz. ",
          });
          workerRef.current = worker;
          console.log("AI Optical Name Verifier siap!");
        } catch (ocrErr) {
          console.warn("Gagal inisialisasi OCR worker:", ocrErr);
        }
      } catch (err) {
        console.error(err);
        setStatusText("Gagal memuat data member");
      }
    }
    initDataAndOCR();
  }, []);

  // 3. Registrasi custom FBX model & MindAR Listener untuk A-Frame
  const registerCustomComponents = useCallback(() => {
    if (typeof window === "undefined") return;
    const AFRAME = (window as any).AFRAME;
    if (!AFRAME) return;

    // A. Component untuk mendengarkan targetFound & targetLost per target index
    if (!AFRAME.components["target-listener"]) {
      AFRAME.registerComponent("target-listener", {
        schema: {
          targetIndex: { type: "number", default: -1 },
        },
        init: function () {
          const targetIndex = this.data.targetIndex;
          this.el.addEventListener("targetFound", () => {
            window.dispatchEvent(
              new CustomEvent("ar-target-found", { detail: { targetIndex } })
            );
          });
          this.el.addEventListener("targetLost", () => {
            window.dispatchEvent(
              new CustomEvent("ar-target-lost", { detail: { targetIndex } })
            );
          });
        },
      });
    }

    // B. Custom FBX / Hologram Model Loader (Aman dari version error & multi THREE instance)
    if (!AFRAME.components["custom-fbx-model"]) {
      AFRAME.registerComponent("custom-fbx-model", {
        schema: {
          src: { type: "string" },
          texture: { type: "string", default: "" },
        },
        init: function () {
          const el = this.el;
          const src = this.data.src;
          const textureUrl = this.data.texture;

          if (!src) return;

          fetch(src)
            .then((res) => {
              if (!res.ok) return null;
              return res.arrayBuffer();
            })
            .then((buffer) => {
              if (!buffer) return;

              // Validasi header biner file
              const bytes = new Uint8Array(buffer.slice(0, 30));
              const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
              const headerStr = String.fromCharCode(...bytes.slice(0, 18));
              const isFbx =
                headerStr === "Kaydara FBX Binary" || headerStr.startsWith("; FBX");

              if (isFbx) {
                try {
                  const loader = new FBXLoader();
                  const fbx = loader.parse(buffer, src);
                  if (fbx) {
                    const box = new THREE.Box3().setFromObject(fbx);
                    const size = new THREE.Vector3();
                    box.getSize(size);
                    const maxDim = Math.max(size.x, size.y, size.z);

                    const targetHeight = 0.85;
                    const scale = targetHeight / (maxDim > 0 ? maxDim : 1);
                    fbx.scale.set(scale, scale, scale);

                    const center = new THREE.Vector3();
                    box.getCenter(center);
                    fbx.position.x = -center.x * scale;
                    fbx.position.y = -box.min.y * scale;
                    fbx.position.z = -center.z * scale;

                    if (textureUrl) {
                      const textureLoader = new THREE.TextureLoader();
                      textureLoader.load(
                        textureUrl,
                        (tex) => {
                          tex.colorSpace = THREE.SRGBColorSpace;
                          fbx.traverse((child: any) => {
                            if (child.isMesh) {
                              child.material = new THREE.MeshStandardMaterial({
                                map: tex,
                                roughness: 0.5,
                                metalness: 0.1,
                              });
                              if (child.material) {
                                child.material.needsUpdate = true;
                              }
                              child.castShadow = true;
                              child.receiveShadow = true;
                            }
                          });
                        },
                        undefined,
                        (texErr) => {
                          console.warn("FBX texture load warn:", texErr);
                        }
                      );
                    }

                    // Bersihkan model lama jika ada
                    if (this.currentModel) {
                      el.object3D.remove(this.currentModel);
                      this.currentModel = null;
                    }

                    // Tambahkan langsung ke THREE group entity tanpa setObject3D
                    el.object3D.add(fbx);
                    this.currentModel = fbx;
                  }
                } catch (parseErr) {
                  console.warn("FBX parse warn:", parseErr);
                }
              } else if (isJpeg) {
                const blob = new Blob([buffer], { type: "image/jpeg" });
                const imgUrl = URL.createObjectURL(blob);
                const textureLoader = new THREE.TextureLoader();
                textureLoader.load(imgUrl, (texture) => {
                  texture.colorSpace = THREE.SRGBColorSpace;
                  const geom = new THREE.PlaneGeometry(0.55, 0.75);
                  const mat = new THREE.MeshStandardMaterial({
                    map: texture,
                    roughness: 0.35,
                    metalness: 0.1,
                    side: THREE.DoubleSide,
                  });
                  const mesh = new THREE.Mesh(geom, mat);
                  mesh.position.set(0, 0, 0.05);

                  if (this.currentModel) {
                    el.object3D.remove(this.currentModel);
                  }
                  el.object3D.add(mesh);
                  this.currentModel = mesh;
                });
              }
            })
            .catch((err) => {
              console.warn("Model check error:", err);
            });
        },
        remove: function () {
          if (this.currentModel) {
            this.el.object3D.remove(this.currentModel);
            this.currentModel = null;
          }
        },
        tick: function (time: number, timeDelta: number) {
          if (this.currentModel) {
            this.currentModel.rotation.y += (timeDelta / 1000) * 0.4;
          }
        },
      });
    }
  }, []);

  // 4. Load script A-Frame, aframe-extras, & MindAR secara berurutan dan set status siap
  useEffect(() => {
    if ((window as any).AFRAME && (window as any).MINDAR) {
      registerCustomComponents();
      setIsScriptsLoaded(true);
      setStatusText("Siap mengaktifkan kamera AR");
      return;
    }

    const aframeScript = document.createElement("script");
    aframeScript.src = "https://aframe.io/releases/1.5.0/aframe.min.js";
    aframeScript.async = false;
    document.body.appendChild(aframeScript);

    aframeScript.onload = () => {
      registerCustomComponents();

      const extrasScript = document.createElement("script");
      extrasScript.src =
        "https://cdn.jsdelivr.net/gh/c-frame/aframe-extras@7.2.0/dist/aframe-extras.min.js";
      extrasScript.async = false;
      document.body.appendChild(extrasScript);

      extrasScript.onload = () => {
        const mindarScript = document.createElement("script");
        mindarScript.src =
          "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js";
        mindarScript.async = false;
        document.body.appendChild(mindarScript);

        mindarScript.onload = () => {
          registerCustomComponents();
          setIsScriptsLoaded(true);
          setStatusText("Siap mengaktifkan kamera AR");
        };
      };
    };
  }, [registerCustomComponents]);

  // 5. Fungsi untuk mengonfirmasi member terverifikasi dan menyalakan model 3D
  const applyVerifiedMember = useCallback((member: Member) => {
    if (lossTimerRef.current) {
      clearTimeout(lossTimerRef.current);
      lossTimerRef.current = null;
    }
    emptyOcrTicksRef.current = 0;

    verifiedLockRef.current = member;
    setActiveMember(member);
    setVerificationState({
      status: "verified",
      confidence: 100,
      candidate: member,
    });
    setStatusText(`✓ Terverifikasi: ${member.nama}`);

    // Tampilkan model 3D pada target aktif
    const sceneEl = document.querySelector("a-scene");
    if (sceneEl) {
      const allModels = sceneEl.querySelectorAll("[custom-fbx-model], [gltf-model]");
      allModels.forEach((m: any) => {
        m.setAttribute("visible", "true");
      });
    }

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(50);
      } catch (e) {}
    }
  }, []);

  // 6. Fungsi Reset Otomatis Saat Kartu Hilang / Tidak Terdeteksi (Auto-Hide)
  const handleCardLost = useCallback(() => {
    verifiedLockRef.current = null;
    setActiveMember(null);
    setVerificationState({
      status: "idle",
      confidence: 0,
      candidate: null,
    });
    setStatusText("Mencari ID Card MREC...");

    const sceneEl = document.querySelector("a-scene");
    if (sceneEl) {
      const allModels = sceneEl.querySelectorAll("[custom-fbx-model], [gltf-model]");
      allModels.forEach((m: any) => {
        m.setAttribute("visible", "false");
      });
    }
  }, []);

  // 7. Fungsi Ekstraksi & Verifikasi Teks Nama dari Kamera (Optical Verification)
  const performNameVerification = useCallback(async () => {
    if (ocrScanningRef.current || !workerRef.current) return;
    const video = document.querySelector("video") as HTMLVideoElement;
    if (!video || video.readyState < 2 || video.videoWidth === 0) return;

    ocrScanningRef.current = true;
    try {
      const vw = video.videoWidth;
      const vh = video.videoHeight;

      // Area nama di dalam viewfinder (bagian tengah-atas kartu)
      const cropW = Math.round(vw * 0.55);
      const cropH = Math.round(vh * 0.26);
      const cropX = Math.round((vw - cropW) / 2);
      const cropY = Math.round(vh * 0.28);

      const canvas = document.createElement("canvas");
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (ctx) {
        ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        // Filter kontras tinggi untuk membuat teks nama sangat tajam
        const imgData = ctx.getImageData(0, 0, cropW, cropH);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const val = gray < 135 ? 0 : 255;
          d[i] = val;
          d[i + 1] = val;
          d[i + 2] = val;
        }
        ctx.putImageData(imgData, 0, 0);

        const res = await workerRef.current.recognize(canvas);
        const textUpper = res.data.text.toUpperCase().replace(/[\r\n]+/g, " ").trim();

        // Cari kecocokan kata kunci pada nama member
        let matchedIndex = -1;
        if (textUpper.length > 2) {
          for (const [idxStr, keywords] of Object.entries(MEMBER_KEYWORDS)) {
            const idx = Number(idxStr);
            if (keywords.some((kw) => textUpper.includes(kw))) {
              matchedIndex = idx;
              break;
            }
          }
        }

        if (matchedIndex !== -1 && markerData[matchedIndex]) {
          // Kartu nama cocok ditemukan!
          emptyOcrTicksRef.current = 0;
          const confirmed = markerData[matchedIndex];
          applyVerifiedMember(confirmed);
        } else {
          // Kartu tidak lagi terdeteksi di kamera
          if (verifiedLockRef.current) {
            emptyOcrTicksRef.current += 1;
            // Jika 2 siklus berturut-turut (~800ms) nama tidak lagi ada di kamera, sembunyikan avatar
            if (emptyOcrTicksRef.current >= 2) {
              handleCardLost();
            }
          } else {
            emptyOcrTicksRef.current = 0;
            if (textUpper.length > 2) {
              setVerificationState({
                status: "verifying",
                confidence: 65,
                candidate: null,
                detectedText: textUpper.slice(0, 20),
              });
              setStatusText(`Membaca teks nama: "${textUpper.slice(0, 15)}..."`);
            }
          }
        }
      }
    } catch (err) {
      console.warn("OCR recognize warning:", err);
    } finally {
      ocrScanningRef.current = false;
    }
  }, [markerData, applyVerifiedMember, handleCardLost]);

  // Listener pemicu OCR berkala saat kamera aktif
  useEffect(() => {
    // Tidak ada dependensi ke watchdog yang bentrok
  }, []);

  // 8. Fungsi Start Kamera & AR yang dipicu tombol
  const handleStartCamera = () => {
    setIsStarted(true);
    setStatusText("Mengaktifkan kamera & melacak target...");

    // Mulai MindAR begitu A-Frame scene sudah siap di DOM
    const checkAndStartScene = () => {
      const sceneEl = document.querySelector("a-scene") as any;
      if (!sceneEl) {
        setTimeout(checkAndStartScene, 100);
        return;
      }

      const startSystem = () => {
        document.querySelectorAll(".a-enter-vr, .a-enter-ar, .a-orientation-modal").forEach((el) => el.remove());
        if (sceneEl.systems && sceneEl.systems["mindar-image-system"]) {
          sceneEl.addEventListener("arReady", () => {
            setStatusText("Arahkan kamera ke ID Card MREC");
          }, { once: true });
          sceneEl.addEventListener("arError", () => {
            setStatusText("Gagal memulai modul kamera AR");
          }, { once: true });
          sceneEl.systems["mindar-image-system"].start();
          console.log("MindAR System dimulai dengan seluruh 21 target!");
        }
      };

      if (sceneEl.hasLoaded) {
        startSystem();
      } else {
        sceneEl.addEventListener("loaded", startSystem, { once: true });
      }
    };

    setTimeout(checkAndStartScene, 200);

    // Interval pemindaian OCR setiap 400ms untuk mengenali nama di kartu
    if (ocrIntervalRef.current) clearInterval(ocrIntervalRef.current);
    ocrIntervalRef.current = setInterval(() => {
      performNameVerification();
    }, 400);
  };

  // 9. Navigasi kembali dengan pembersihan tuntas
  const handleBack = () => {
    cleanupAR();
    router.push("/");
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black text-white select-none">
      {/* Layer 1: A-Frame Scene (Target Entities dideklarasikan langsung di JSX agar terdaftar sejak frame 1) */}
      {isStarted && (
        <div className="ar-container absolute inset-0 z-0">
          {/* @ts-ignore */}
          <a-scene
            mindar-image="imageTargetSrc: /targets/targets.mind; autoStart: false; maxTrack: 2; warmupTolerance: 6; missTolerance: 15; uiLoading: no; uiError: no; uiScanning: no; filterMinCF: 0.0005; filterBeta: 0.01;"
            color-space="sRGB"
            renderer="colorManagement: true, physicallyCorrectLights"
            vr-mode-ui="enabled: false"
            device-orientation-permission-ui="enabled: false"
            loading-screen="enabled: false"
            embedded
            style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
          >
            {/* @ts-ignore */}
            <a-light type="ambient" color="#ffffff" intensity="2.2"></a-light>
            {/* @ts-ignore */}
            <a-light type="directional" color="#ffffff" intensity="2.5" position="0 2 2"></a-light>
            {/* @ts-ignore */}
            <a-light type="directional" color="#ffffff" intensity="1.5" position="0 -1 2"></a-light>
            {/* @ts-ignore */}
            <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

            {/* Seluruh 21 Target Entities terdaftar di MindAR untuk tracking */}
            {Object.entries(markerData).map(([targetIndexStr]) => (
              /* @ts-ignore */
              <a-entity
                key={targetIndexStr}
                mindar-image-target={`targetIndex: ${Number(targetIndexStr)}`}
              />
            ))}
          </a-scene>
        </div>
      )}

      {/* Layer 2: Viewfinder Presisi Tinggi & Pembaca Nama Nyata */}
      {isStarted && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center p-4">
          <div
            className={`relative w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden flex items-center justify-center backdrop-blur-[1px] transition-all duration-300 ${
              verificationState.status === "verified"
                ? "border-2 border-emerald-500/80 shadow-[0_0_35px_rgba(16,185,129,0.5)]"
                : verificationState.status === "verifying"
                ? "border-2 border-cyan-400/80 shadow-[0_0_25px_rgba(6,182,212,0.4)]"
                : "border-2 border-dashed border-red-500/40"
            }`}
          >
            {/* Siku Sudut Viewfinder */}
            <div
              className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-xl transition-colors duration-300 ${
                verificationState.status === "verified"
                  ? "border-emerald-500"
                  : verificationState.status === "verifying"
                  ? "border-cyan-400"
                  : "border-red-500"
              }`}
            />
            <div
              className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-xl transition-colors duration-300 ${
                verificationState.status === "verified"
                  ? "border-emerald-500"
                  : verificationState.status === "verifying"
                  ? "border-cyan-400"
                  : "border-red-500"
              }`}
            />
            <div
              className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-xl transition-colors duration-300 ${
                verificationState.status === "verified"
                  ? "border-emerald-500"
                  : verificationState.status === "verifying"
                  ? "border-cyan-400"
                  : "border-red-500"
              }`}
            />
            <div
              className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-xl transition-colors duration-300 ${
                verificationState.status === "verified"
                  ? "border-emerald-500"
                  : verificationState.status === "verifying"
                  ? "border-cyan-400"
                  : "border-red-500"
              }`}
            />

            {/* Garis Laser Scanner (Hanya tampil saat memindai) */}
            {!activeMember && (
              <div
                className={`absolute left-0 right-0 h-1 animate-scanline ${
                  verificationState.status === "verifying"
                    ? "bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(6,182,212,1)]"
                    : "bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_rgba(239,68,68,1)]"
                }`}
              />
            )}

            {/* Target Area Box Pembacaan Teks Nama */}
            {/* 3D Hologram Avatar 100% Reliabel (Muncul seketika saat kartu terverifikasi) */}
            {activeMember && (
              <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                <Canvas
                  camera={{ position: [0, 0, 3.2], fov: 45 }}
                  style={{ width: "100%", height: "100%", pointerEvents: "none" }}
                  gl={{ alpha: true, antialias: true }}
                >
                  <ambientLight intensity={2.2} />
                  <directionalLight position={[3, 5, 4]} intensity={2.5} />
                  <directionalLight position={[-3, -2, 2]} intensity={1.5} />
                  <Suspense fallback={null}>
                    <DynamicModelFBX
                      key={activeMember.id}
                      modelPath={activeMember.model}
                      texturePath={activeMember.texture}
                      textureFolderPath={activeMember.textureFolder}
                    />
                  </Suspense>
                </Canvas>
              </div>
            )}

            {!activeMember && (
              <div className="absolute top-1/4 w-4/5 h-12 border border-white/20 rounded-lg flex items-center justify-center bg-black/30 pointer-events-none">
                <span className="text-[10px] text-zinc-300 uppercase tracking-wider font-mono">
                  [ Area Nama ID Card ]
                </span>
              </div>
            )}

            {/* Badge Tengah Viewfinder */}
            {verificationState.status === "verified" ? (
              <span className="text-xs font-bold tracking-wider bg-emerald-950/80 text-emerald-300 px-3.5 py-1.5 rounded-full border border-emerald-500/50 backdrop-blur-md flex items-center gap-1.5 shadow-lg animate-in zoom-in-95">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Terverifikasi Cocok</span>
              </span>
            ) : verificationState.status === "verifying" ? (
              <span className="text-xs font-bold tracking-wider bg-cyan-950/80 text-cyan-300 px-3.5 py-1.5 rounded-full border border-cyan-500/50 backdrop-blur-md flex items-center gap-1.5 shadow-lg">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Membaca Nama di Kartu...</span>
              </span>
            ) : (
              <span className="text-xs text-white/80 font-medium tracking-wider bg-black/60 px-3.5 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                Posisikan Nama di Kotak Tengah
              </span>
            )}
          </div>

          <p className="mt-4 text-xs font-semibold text-zinc-300 bg-black/75 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg text-center">
            {activeMember ? "✨ 3D Avatar Terverifikasi Aktif" : "Arahkan nama di kartu ke dalam bingkai scanner"}
          </p>
        </div>
      )}

      {/* Layer 3: Header dengan Tombol Kembali & Re-Train (Ekstrak Fitur) */}
      <div className="absolute top-6 left-6 right-6 z-30 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white bg-black/60 hover:bg-black/90 active:scale-95 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 transition shadow-lg text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>

          {/* Tombol Re-train / Ekstrak Training Ulang */}
          <Link
            href="/compile"
            onClick={cleanupAR}
            className="flex items-center gap-1.5 text-zinc-300 hover:text-white bg-black/60 hover:bg-black/90 active:scale-95 px-3 py-2 rounded-xl backdrop-blur-md border border-white/10 transition shadow-lg text-xs font-medium cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>⚡ Re-train</span>
          </Link>
        </div>

        <div
          className={`flex items-center gap-2 backdrop-blur-md px-4 py-2 rounded-xl border text-xs font-semibold tracking-wide shadow-lg transition-colors ${
            verificationState.status === "verified"
              ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-400"
              : verificationState.status === "verifying"
              ? "bg-cyan-950/70 border-cyan-500/40 text-cyan-300"
              : "bg-black/60 border-white/10 text-zinc-300"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              verificationState.status === "verified"
                ? "bg-emerald-400 animate-pulse"
                : verificationState.status === "verifying"
                ? "bg-cyan-400 animate-ping"
                : "bg-zinc-400"
            }`}
          />
          <span className="truncate max-w-[180px] sm:max-w-xs">{statusText}</span>
        </div>
      </div>

      {/* Layer 4: Layar Permintaan Akses Kamera */}
      {!isStarted && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/95 p-6 text-center">
          <div className="max-w-md space-y-6">
            <div className="relative w-20 h-20 mx-auto mb-2 drop-shadow-[0_8px_20px_rgba(200,16,46,0.35)]">
              <Image
                src="/mrec-logo.png"
                alt="MREC Logo"
                fill
                priority
                className="object-contain"
              />
            </div>

            <div>
              <h2 className="text-3xl font-black text-white">MREC AR Scanner</h2>
              <p className="text-sm text-zinc-400 leading-relaxed mt-2">
                Tekan tombol di bawah untuk memberikan izin kamera dan mulai memindai ID Card MREC.
              </p>
            </div>

            <button
              onClick={handleStartCamera}
              disabled={!isReady}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-2 ${
                isReady
                  ? "bg-red-600 hover:bg-red-700 shadow-red-600/50 cursor-pointer hover:scale-[1.02] active:scale-95"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              }`}
            >
              {isReady ? (
                <>
                  <ScanLine className="w-5 h-5" />
                  <span>Aktifkan Kamera AR</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-zinc-400" />
                  <span>Memuat Modul AR...</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Layer 5: Pop-up Info Member Terverifikasi (Hanya Tampil Saat Kartu Terdeteksi) */}
      {activeMember && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-md bg-neutral-900/95 text-white p-5 rounded-3xl shadow-2xl backdrop-blur-xl border border-emerald-500/40 animate-in fade-in slide-in-from-bottom-6">
          <div className="flex items-start gap-4">
            {/* Foto ID Card / Avatar Profil Asli */}
            {activeMember.foto && (
              <div className="relative w-16 h-22 sm:w-20 sm:h-28 rounded-2xl overflow-hidden border border-white/20 shrink-0 bg-neutral-950 shadow-md">
                <Image
                  src={activeMember.foto}
                  alt={activeMember.nama}
                  fill
                  className="object-cover object-top"
                  sizes="80px"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-red-600/80 px-2 py-0.5 rounded-md">
                  {activeMember.kategori}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/90 border border-emerald-500/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  TERVERIFIKASI
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white truncate leading-tight">
                {activeMember.nama}
              </h2>
              <p className="text-xs font-semibold text-zinc-300 mt-0.5">
                {activeMember.role}
              </p>

              <p className="mt-2 text-xs text-zinc-400 leading-relaxed line-clamp-3">
                {activeMember.deskripsi}
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
