"use client";

import type { CSSProperties } from "react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
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
const CARD_SIZE =
  "h-[296px] w-[288px] sm:h-[320px] sm:w-[312px] lg:h-[362px] lg:w-[352px]";

// `sizes` untuk next/image — sinkron dengan CARD_SIZE di atas.
const IMAGE_SIZES =
  "(min-width: 1024px) 352px, (min-width: 640px) 312px, 288px";

export default function PortfolioCard({
  project,
  className = "",
  magnetStrength = 0.06,
  maxOffset = 12,
  magnetScale = 1.015,
  tilt = 7,
}: PortfolioCardProps) {
  const [cover, ...backImages] = project.images;

  // Magnet hover: seluruh stack tertarik ke kursor + miring 3D mengikuti posisi.
  const { ref, handlers } = useMagnetic<HTMLDivElement>({
    magnetStrength,
    maxOffset,
    magnetScale,
    tilt,
  });

  return (
    <div
      ref={ref}
      {...handlers}
      style={{ transformOrigin: "center center", willChange: "transform" }}
      className={`group/card-stack relative flex w-full items-center justify-center ${className}`}
    >
      {/* Back layers — satu kartu per gambar sisa (images[1..]) */}
      {backImages.map((src, index) => {
        const fan = FAN_LAYERS[Math.min(index, FAN_LAYERS.length - 1)];

        return (
          <div
            key={src}
            aria-hidden="true"
            style={
              {
                "--fan-deg": `${fan.rotate}deg`,
                "--fan-scale": fan.scale,
                "--fan-deg-hover": `${fan.hoverRotate}deg`,
                "--fan-scale-hover": fan.hoverScale,
                zIndex: 9 - index,
              } as CSSProperties
            }
            className={`pointer-events-none absolute ${CARD_SIZE} origin-bottom [transform:rotate(var(--fan-deg))_scale(var(--fan-scale))] overflow-hidden rounded-[34px] transition-[transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card-stack:[transform:rotate(var(--fan-deg-hover))_scale(var(--fan-scale-hover))] motion-reduce:transition-none ${project.theme}`}
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

      {/* Front card — gambar utama (images[0]) */}
      <Link
        href={`/project/${project.slug}` as Route}
        className={`relative z-10 block ${CARD_SIZE} origin-bottom overflow-hidden rounded-[34px] transition-[transform,translate,scale] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card-stack:-translate-y-[3px] group-hover/card-stack:scale-[1.01] motion-reduce:transition-none ${project.theme}`}
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
      </Link>
    </div>
  );
}
