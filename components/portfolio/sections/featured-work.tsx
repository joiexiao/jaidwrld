"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, type Variants } from "framer-motion";
import ProjectCarousel from "@/components/ui/ProjectCarousel";
import { isPhaseAtLeast, useIntro } from "@/components/portfolio/intro";
import {
  setCarouselBounds,
  CAROUSEL_EXIT_DURATION,
  subscribeNavAnimation,
  type AnimationPhase,
} from "@/components/portfolio/nav-intent";
import type { Project } from "@/types/project";

type FeaturedWorkProps = {
  projects: Project[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  /** Fase menutup fan sebelum navigasi (diteruskan ke PortfolioCard). */
  closing: boolean;
  /** Klik card → tutup fan lalu navigasi ke detail. */
  onOpen: () => void;
  /** Prefetch route detail saat hover (morph butuh halaman siap). */
  onPrefetch: () => void;
  /** Card bergeser ke kanan sebelum navigasi ke About. */
  aboutExit?: boolean;
  /** Dipanggil setelah card selesai bergeser ke kanan. */
  onAboutExit?: () => void;
  /** Kontrol visibility carousel saat kembali dari About. */
  showCarousel?: boolean;
};

// Sinkron dengan transition fan menutup di PortfolioCard (durasi 700ms).
const FAN_CLOSE_MS = 720;

// Intro: card naik dari bawah (fase "card"), dalam keadaan fan terbuka lalu
// menutup smooth ke bentuk default.
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 48, x: 0 },
  visible: { opacity: 1, y: 0, x: 0 },
  // Arah About: card bergeser ke kanan, menyingkap kertas di belakangnya.
  exitRight: {
    opacity: 0,
    x: "110vw",
    transition: { duration: CAROUSEL_EXIT_DURATION / 1000, ease: [0.45, 0, 0.55, 1] },
  },
};

// Dot muncul satu-per-satu setelah card selesai naik (delayChildren ≈ durasi
// rise card). Hanya opacity yang dianimasikan agar tidak bentrok dengan class
// transform (mis. `scale-110`) pada dot aktif.
const dotsGroupVariants: Variants = {
  hidden: {},
  visible: { transition: { delayChildren: 0.6, staggerChildren: 0.12 } },
};

const dotVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

// Kolom kanan home (collapsed): card carousel + dots navigasi.
export default function FeaturedWork({
  projects,
  activeIndex,
  onActiveIndexChange,
  closing,
  onOpen,
  onPrefetch,
  aboutExit = false,
  onAboutExit,
  showCarousel = true,
}: FeaturedWorkProps) {
  const { phase, active, advance } = useIntro();
  const isCard = isPhaseAtLeast(phase, "card");

  // Ref untuk capture carousel bounds saat navigasi ke About
  const carouselWrapperRef = useRef<HTMLDivElement>(null);

  // Fan dibuka sebelum card naik (card masih tersembunyi) lalu ditutup setelah
  // card sampai. Nilainya diturunkan dari fase + `fanClosed` supaya tidak ada
  // setState di dalam effect.
  const [fanClosed, setFanClosed] = useState(false);
  const fanOpen = active && isPhaseAtLeast(phase, "reveal") && !fanClosed;

  // Subscribe ke orchestrator untuk trigger carousel exit bersamaan dengan button
  const [orchestratedExit, setOrchestratedExit] = useState(false);
  
  useEffect(() => {
    const unsubscribe = subscribeNavAnimation((phase: AnimationPhase) => {
      if (phase === "panel-exit") {
        setOrchestratedExit(true);
      }
    });
    return unsubscribe;
  }, []);

  const fanCloseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (fanCloseTimerRef.current) {
        window.clearTimeout(fanCloseTimerRef.current);
      }
    };
  }, []);

  const handleCardRiseComplete = useCallback(() => {
    // Card sudah di posisi: tutup fan, lalu tandai fase selesai.
    setFanClosed(true);

    if (fanCloseTimerRef.current) {
      window.clearTimeout(fanCloseTimerRef.current);
    }

    fanCloseTimerRef.current = window.setTimeout(
      () => advance("card"),
      FAN_CLOSE_MS,
    );
  }, [advance]);

  // Capture carousel bounds saat aboutExit dimulai (sebelum card slide keluar)
  useEffect(() => {
    if (aboutExit && carouselWrapperRef.current) {
      const rect = carouselWrapperRef.current.getBoundingClientRect();
      setCarouselBounds({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        centerY: rect.top + rect.height / 2,
      });
    }
  }, [aboutExit]);

  const activeProject = projects[activeIndex];

  if (!activeProject) return null;

  return (
    <div ref={carouselWrapperRef} className="relative flex w-full flex-col items-center">
      <div className="relative w-full">
        <motion.div
          className="relative z-10 w-full"
          initial={
            !showCarousel
              ? { opacity: 1, x: 0 } // Langsung di posisi pendaratan jika dari About
              : active
              ? "hidden"
              : false
          }
          animate={
            (aboutExit || orchestratedExit)
              ? "exitRight"
              : isCard
              ? "visible"
              : "hidden"
          }
          variants={cardVariants}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          onAnimationComplete={(definition) => {
            if (definition === "exitRight") {
              onAboutExit?.();
              return;
            }
            if (definition === "visible") handleCardRiseComplete();
          }}
        >
          <ProjectCarousel
            projects={projects}
            activeIndex={activeIndex}
            onActiveIndexChange={onActiveIndexChange}
            closing={closing}
            onOpen={onOpen}
            onPrefetch={onPrefetch}
            previewFan={fanOpen}
          />
        </motion.div>
      </div>

      {/* Dots desktop — di tepi kanan kolom */}
      {projects.length > 1 && (
        <motion.div
          className="absolute top-1/2 right-0 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex"
          initial={active ? "hidden" : false}
          animate={(aboutExit || orchestratedExit) ? "hidden" : isCard ? "visible" : "hidden"}
          variants={dotsGroupVariants}
        >
          {projects.map((project, index) => (
            <motion.button
              key={project.slug}
              type="button"
              variants={dotVariants}
              aria-label={`Show ${project.name}`}
              aria-current={activeIndex === index ? "true" : undefined}
              onClick={() => onActiveIndexChange(index)}
              className={`size-1.5 rounded-full transition-all duration-300 ${
                activeIndex === index
                  ? "bg-foreground scale-110"
                  : "bg-border hover:bg-muted"
              }`}
            />
          ))}
        </motion.div>
      )}

      {/* Dots mobile */}
      {projects.length > 1 && (
        <motion.div
          className="mt-8 flex items-center gap-3 md:hidden"
          initial={active ? "hidden" : false}
          animate={(aboutExit || orchestratedExit) ? "hidden" : isCard ? "visible" : "hidden"}
          variants={dotsGroupVariants}
        >
          {projects.map((project, index) => (
            <motion.button
              key={project.slug}
              type="button"
              variants={dotVariants}
              aria-label={`Show ${project.name}`}
              aria-current={activeIndex === index ? "true" : undefined}
              onClick={() => onActiveIndexChange(index)}
              className={`size-1.5 rounded-full transition-all ${
                activeIndex === index ? "bg-foreground" : "bg-border"
              }`}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
