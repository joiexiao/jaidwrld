"use client";

import { useEffect, useRef } from "react";
import PortfolioCard from "@/components/ui/PortfolioCard";
import type { Project } from "@/types/project";

type ProjectCarouselProps = {
  projects: Project[];
  /** Index project aktif (controlled oleh parent). */
  activeIndex: number;
  /** Callback saat navigasi wheel mengubah project aktif. */
  onActiveIndexChange: (index: number) => void;
  /** Fase menutup fan sebelum navigasi. */
  closing?: boolean;
  /** Callback saat card aktif diklik. */
  onOpen?: () => void;
  /** Prefetch route detail saat pointer masuk card. */
  onPrefetch?: () => void;
  /** Paksa fan terbuka untuk animasi intro. */
  previewFan?: boolean;
  enableWheel?: boolean;
  className?: string;
};

const WHEEL_THRESHOLD = 40;
const WHEEL_LOCK_DURATION = 650;
const CARD_SPACING = 180;
const IDLE_SCALE = 0.68;

export default function ProjectCarousel({
  projects,
  activeIndex,
  onActiveIndexChange,
  closing = false,
  onOpen,
  onPrefetch,
  previewFan = false,
  enableWheel = true,
  className = "",
}: ProjectCarouselProps) {
  const activeIndexRef = useRef(activeIndex);
  const wheelLockedRef = useRef(false);
  const wheelDeltaRef = useRef(0);
  const wheelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const projectCount = projects.length;

  useEffect(() => {
    if (!enableWheel || projectCount <= 1) return;

    const handleWheel = (event: WheelEvent) => {
      // Abaikan gesture horizontal.
      if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;

      event.preventDefault();

      if (wheelLockedRef.current) return;

      wheelDeltaRef.current += event.deltaY;

      if (Math.abs(wheelDeltaRef.current) < WHEEL_THRESHOLD) return;

      const direction = wheelDeltaRef.current > 0 ? 1 : -1;
      wheelDeltaRef.current = 0;

      // Infinite scroll: project terakhir kembali ke pertama.
      const nextIndex =
        (activeIndexRef.current + direction + projectCount) % projectCount;

      activeIndexRef.current = nextIndex;
      onActiveIndexChange(nextIndex);

      wheelLockedRef.current = true;

      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }

      wheelTimeoutRef.current = setTimeout(() => {
        wheelLockedRef.current = false;
      }, WHEEL_LOCK_DURATION);
    };

    window.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    return () => {
      window.removeEventListener("wheel", handleWheel);

      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
    };
  }, [enableWheel, projectCount, onActiveIndexChange]);

  useEffect(() => {
    return () => {
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
    };
  }, []);

  if (projectCount === 0) return null;

  return (
    <div
      className={`relative w-full overflow-visible ${className}`}
      style={{
        height: "clamp(440px, 70vh, 700px)",
        perspective: "1200px",
        overflow: "visible",
        isolation: "isolate",
      }}
    >
      {projects.map((project, index) => {
        // Hitung jarak melingkar untuk infinite carousel.
        let distance = index - activeIndex;

        if (distance > projectCount / 2) {
          distance -= projectCount;
        } else if (distance < -projectCount / 2) {
          distance += projectCount;
        }

        const isActive = distance === 0;

        // Card idle tidak ditampilkan.
        const isVisible = isActive;

        const offsetY = distance * CARD_SPACING;
        const scale = isActive ? 1 : IDLE_SCALE;
        const opacity = isActive ? 1 : 0;
        const blur = 0;
        const rotateX = isActive ? 0 : distance * 5;

        return (
          <div
            key={project.slug}
            aria-hidden={!isActive}
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              width: "100%",
              zIndex: isActive
                ? projectCount + 1
                : projectCount - Math.abs(distance),
              opacity,
              visibility: isVisible ? "visible" : "hidden",
              pointerEvents: isActive ? "auto" : "none",
              transform: `
                translate3d(0, calc(-50% + ${offsetY}px), 0)
                scale(${scale})
                rotateX(${rotateX}deg)
              `,
              filter: `blur(${blur}px)`,
              transformOrigin: "center center",
              backfaceVisibility: "hidden",
              transition: [
                "transform 650ms cubic-bezier(0.22, 1, 0.36, 1)",
                "opacity 500ms ease",
                "filter 500ms ease",
              ].join(", "),
              willChange: "transform, opacity, filter",
            }}
          >
            <PortfolioCard
              project={project}
              closing={isActive && closing}
              onActivate={isActive ? onOpen : undefined}
              onPrefetch={isActive ? onPrefetch : undefined}
              previewFan={isActive && previewFan}
              className={className}
            />
          </div>
        );
      })}
    </div>
  );
}
