"use client";

import { useState, type PointerEvent } from "react";
import { ViewTransition } from "react";
import Image from "next/image";
import type { Project } from "@/types/project";
import { useMagnetic } from "@/hooks/use-magnetic";

type PortfolioCardProps = {
  project: Project;
  className?: string;
  /** Kekuatan tarik magnet ke kursor (rasio jarak). */
  magnetStrength?: number;
  /** Batas maksimum pergeseran translate (px). */
  maxOffset?: number;
  /** Skala saat hover. */
  magnetScale?: number;
  /** Maksimum kemiringan 3D mengikuti kursor (derajat). */
  tilt?: number;
  /** Card sedang dalam mode expand — fan ditutup & magnet dimatikan. */
  expanded?: boolean;
  /** Fase menutup fan sebelum expand (visual "kartu dirapikan"). */
  closing?: boolean;
  /** Dipanggil saat card diklik (trigger expand). */
  onActivate?: () => void;
  /** Dipanggil saat pointer masuk card (untuk prefetch route detail). */
  onPrefetch?: () => void;
  /** Paksa fan terbuka (dipakai animasi intro home; lepas → menutup smooth). */
  previewFan?: boolean;
};

// Konfigurasi kipas per-depth (index 0 = layer paling dekat front card).
// Jumlah layer mengikuti panjang `project.images` (1 kartu per gambar).
const FAN_LAYERS = [
  { rotate: 3, scale: 0.97, hoverRotate: 12, hoverScale: 0.95 },
  { rotate: -6, scale: 0.94, hoverRotate: -24, hoverScale: 0.91 },
  { rotate: 9, scale: 0.91, hoverRotate: 34, hoverScale: 0.88 },
  { rotate: -12, scale: 0.88, hoverRotate: -44, hoverScale: 0.85 },
  { rotate: 15, scale: 0.85, hoverRotate: 54, hoverScale: 0.82 },
];

// Ukuran kartu responsif (lebar x tinggi): base 288x296, sm 312x320, lg 352x362.
// Di-export supaya komponen lain (mis. placeholder About) bisa menyamakan ukuran persis.
export const CARD_SIZE =
  "h-[296px] w-[288px] sm:h-[320px] sm:w-[312px] lg:h-[362px] lg:w-[352px]";

// `sizes` untuk next/image — sinkron dengan CARD_SIZE di atas.
const IMAGE_SIZES =
  "(min-width: 1024px) 352px, (min-width: 640px) 312px, 288px";

const FAN_TRANSITION =
  "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]";

export default function PortfolioCard({
  project,
  className = "",
  magnetStrength = 0.06,
  maxOffset = 12,
  magnetScale = 1.015,
  tilt = 7,
  expanded = false,
  closing = false,
  onActivate,
  onPrefetch,
  previewFan = false,
}: PortfolioCardProps) {
  const [cover, ...backImages] = project.images;

  // Fan di-drive state (bukan CSS group-hover) supaya bisa dipaksa menutup
  // saat `closing`/`expanded` — memberi kontrol penuh atas animasi "rapikan".
  const [hovered, setHovered] = useState(false);

  // Magnet hover: seluruh stack tertarik ke kursor + miring 3D mengikuti posisi.
  const { ref, handlers } = useMagnetic<HTMLDivElement>({
    magnetStrength,
    maxOffset,
    magnetScale,
    tilt,
    disabled: expanded || closing,
  });

  const collapsed = expanded || closing;
  const fanOpen = (hovered || previewFan) && !collapsed;

  const handlePointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") setHovered(true);
    onPrefetch?.();
    handlers.onPointerEnter(event);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    setHovered(false);
    handlers.onPointerLeave(event);
  };

  return (
    <div
      ref={ref}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlers.onPointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlers.onPointerDown}
      onPointerUp={handlers.onPointerUp}
      onPointerCancel={handlers.onPointerCancel}
      style={{ transformOrigin: "center center", willChange: "transform" }}
      className={`relative flex w-full items-center justify-center ${className}`}
    >
      {/* Back layers — satu kartu per gambar sisa (images[1..]) */}
      {backImages.map((src, index) => {
        const fan = FAN_LAYERS[Math.min(index, FAN_LAYERS.length - 1)];

        // Saat collapsed, semua layer rata di belakang front (visual 1 kartu).
        const rotate = collapsed ? 0 : fanOpen ? fan.hoverRotate : fan.rotate;
        const scale = collapsed ? 1 : fanOpen ? fan.hoverScale : fan.scale;

        return (
          <div
            key={src}
            aria-hidden="true"
            style={{
              transform: `rotate(${rotate}deg) scale(${scale})`,
              zIndex: 9 - index,
            }}
            className={`pointer-events-none absolute ${CARD_SIZE} origin-bottom overflow-hidden rounded-[34px] motion-reduce:transition-none ${FAN_TRANSITION} ${project.theme}`}
          >
            <Image
              src={src}
              alt=""
              fill
              sizes={IMAGE_SIZES}
              className="object-cover"
            />
            <div className="absolute inset-[8%] rounded-[26px]" />
            <div className="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-black/[0.08] to-transparent" />
          </div>
        );
      })}

      {/* Front card — gambar utama (images[0]); klik = trigger expand.
          Dibungkus View Transition: morph card ini ⇄ panel galeri di detail. */}
      <ViewTransition
        name={`project-${project.slug}`}
        share="morph"
        default="none"
      >
        <button
          type="button"
          onClick={onActivate}
          aria-label={`Buka project ${project.name}`}
          style={{
            transform: fanOpen ? "translateY(-3px) scale(1.01)" : "none",
          }}
          className={`relative z-10 block cursor-pointer ${CARD_SIZE} origin-bottom overflow-hidden rounded-[34px] text-left transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${project.theme}`}
        >
          {cover && (
            <Image
              src={cover}
              alt={project.name}
              fill
              sizes={IMAGE_SIZES}
              className="object-cover"
            />
          )}

          {/* Legibility gradient */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Project title */}
          <div className="absolute inset-x-0 bottom-0 p-6">
            <h2 className="text-xl font-medium tracking-[-0.04em] text-white">
              {project.name}
            </h2>
          </div>
        </button>
      </ViewTransition>
    </div>
  );
}
