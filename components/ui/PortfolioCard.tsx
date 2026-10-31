"use client";

import { useState, useEffect, type PointerEvent } from "react";
import { ViewTransition } from "react";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Project } from "@/types/project";
import { useMagnetic } from "@/hooks/use-magnetic";

type PortfolioCardProps = {
  project: Project;
  className?: string;
  magnetStrength?: number;
  maxOffset?: number;
  magnetScale?: number;
  tilt?: number;
  expanded?: boolean;
  closing?: boolean;
  enableLayoutId?: boolean;
  onActivate?: () => void;
  /** Dipanggil setelah animasi collapse selesai. */
  onCollapseComplete?: () => void;
  onPrefetch?: () => void;
  previewFan?: boolean;
};

/** Konfigurasi kipas per-depth (index 0 = layer paling dekat front card). */
const FAN_LAYERS = [
  // Card 2
  { rotate: 3, scale: 0.97, hoverRotate: 12, hoverScale: 0.95 },

  // Card 3
  { rotate: -6, scale: 0.94, hoverRotate: -24, hoverScale: 0.91 },

  // Card 4 — posisi seperti card 2, tetapi miring ke kiri
  { rotate: -3, scale: 0.97, hoverRotate: -12, hoverScale: 0.95 },

  // Card 5
  { rotate: -12, scale: 0.88, hoverRotate: -44, hoverScale: 0.85 },

  // Card 6
  { rotate: 15, scale: 0.85, hoverRotate: 54, hoverScale: 0.82 },
];

/** Ukuran kartu responsif: base 288x296, sm 312x320, lg 352x362. */
export const CARD_SIZE =
  "h-[296px] w-[288px] sm:h-[320px] sm:w-[312px] lg:h-[362px] lg:w-[352px]";

/** `sizes` untuk next/image — sinkron dengan CARD_SIZE di atas. */
const IMAGE_SIZES =
  "(min-width: 1024px) 352px, (min-width: 640px) 312px, 288px";

const COVER_TRANSITION_SHARE = {
  "project-open": "morph-open",
  "project-close": "morph-close",
  default: "none",
} as const;

export default function PortfolioCard({
  project,
  className = "",
  magnetStrength = 0.06,
  maxOffset = 12,
  magnetScale = 1.015,
  tilt = 7,
  expanded = false,
  closing = false,
  enableLayoutId = true,
  onActivate,
  onCollapseComplete,
  onPrefetch,
  previewFan = false,
}: PortfolioCardProps) {
  const images = project.images ?? [];
  const videos = project.videos ?? [];

  const media = [
    ...videos.map((src) => ({ src, type: "video" as const })),
    ...images.map((src) => ({ src, type: "image" as const })),
  ];

  const [cover, ...backMedia] = media;
  const [hovered, setHovered] = useState(false);

  const { ref, handlers } = useMagnetic<HTMLDivElement>({
    magnetStrength,
    maxOffset,
    magnetScale,
    tilt,
    disabled: expanded || closing,
  });

  const collapsed = expanded || closing;
  const fanOpen = (hovered || previewFan) && !collapsed;

  // Tidak ada back layer yang perlu dianimasikan pada card dengan satu media.
  // Laporkan selesai langsung agar pemanggil lama tidak menunggu fallback.
  useEffect(() => {
    if (closing && backMedia.length === 0) {
      onCollapseComplete?.();
    }
  }, [closing, backMedia.length, onCollapseComplete]);

  const handlePointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") setHovered(true);
    onPrefetch?.();
    handlers.onPointerEnter(event);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    setHovered(false);
    handlers.onPointerLeave(event);
  };

  const frontCard = (
    <motion.button
      type="button"
      onClick={onActivate}
      aria-label={`Buka project ${project.name}`}
      style={{
        transform: fanOpen ? "translateY(-3px) scale(1.01)" : "none",
      }}
      className={`relative z-10 block cursor-pointer ${CARD_SIZE} origin-bottom overflow-hidden rounded-[34px] text-left ${project.theme}`}
    >
      {cover?.type === "video" ? (
        <video
          src={cover.src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={`${project.name} video preview`}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : cover?.type === "image" ? (
        <Image
          src={cover.src}
          alt={project.name}
          fill
          sizes={IMAGE_SIZES}
          className="object-cover"
        />
      ) : null}

      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-6">
        <h2 className="text-xl font-medium tracking-[-0.04em] text-white">
          {project.name}
        </h2>
      </div>
    </motion.button>
  );

  return (
    <div
      ref={ref}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlers.onPointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlers.onPointerDown}
      onPointerUp={handlers.onPointerUp}
      onPointerCancel={handlers.onPointerCancel}
      style={{
        transformOrigin: "center center",
        willChange: "transform",
      }}
      className={`relative flex w-full items-center justify-center ${className}`}
    >
      {/* Back layers: disembunyikan dari snapshot saat shared card mulai morph. */}
      {backMedia.map(({ src, type }, index) => {
        const fan = FAN_LAYERS[Math.min(index, FAN_LAYERS.length - 1)];
        const rotate = collapsed ? 0 : fanOpen ? fan.hoverRotate : fan.rotate;
        const scale = collapsed ? 1 : fanOpen ? fan.hoverScale : fan.scale;

        return (
          <motion.div
            key={`${type}-${src}`}
            aria-hidden="true"
            animate={{
              rotate,
              scale,
              borderRadius: "34px",
            }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
            }}
            onAnimationComplete={() => {
              if (
                collapsed &&
                index === backMedia.length - 1 &&
                onCollapseComplete
              ) {
                onCollapseComplete();
              }
            }}
            style={{
              zIndex: 9 - index,
              visibility: collapsed ? "hidden" : "visible",
            }}
            className={`pointer-events-none absolute ${CARD_SIZE} origin-bottom overflow-hidden rounded-[34px] ${project.theme}`}
          >
            {type === "video" ? (
              <video
                src={src}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <Image
                src={src}
                alt=""
                fill
                sizes={IMAGE_SIZES}
                className="object-cover"
              />
            )}

            <div className="absolute inset-[8%] rounded-[26px]" />
            <div className="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-black/[0.08] to-transparent" />
          </motion.div>
        );
      })}

      {/*
        Shared front card: carousel ⇄ first project gallery card.
        Kedua halaman menggunakan name dan share mapping yang sama.
      */}
      {enableLayoutId ? (
        <ViewTransition
          name={`project-cover-${project.slug}`}
          default="none"
          share={COVER_TRANSITION_SHARE}
        >
          {frontCard}
        </ViewTransition>
      ) : (
        frontCard
      )}
    </div>
  );
}
