"use client";

import { useEffect, useRef } from "react";
import PortfolioCard from "@/components/ui/PortfolioCard";
import type { Project } from "@/types/project";

type ProjectCarouselProps = {
  projects: Project[];
  /** Index project aktif (controlled oleh parent). */
  activeIndex: number;
  /** Callback saat navigasi (wheel) mengubah project aktif. */
  onActiveIndexChange: (index: number) => void;
  /** Fase menutup fan sebelum navigasi (diteruskan ke PortfolioCard). */
  closing?: boolean;
  /** Dipanggil saat card diklik untuk membuka detail. */
  onOpen?: () => void;
  /** Prefetch route detail saat pointer masuk card. */
  onPrefetch?: () => void;
  enableWheel?: boolean;
  className?: string;
};

export default function ProjectCarousel({
  projects,
  activeIndex,
  onActiveIndexChange,
  closing = false,
  onOpen,
  onPrefetch,
  enableWheel = true,
  className = "",
}: ProjectCarouselProps) {
  const activeIndexRef = useRef(activeIndex);
  const wheelLockedRef = useRef(false);
  const wheelDeltaRef = useRef(0);
  const wheelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Selalu sinkron agar handler wheel membaca index terbaru tanpa re-subscribe.
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const projectCount = projects.length;
  const activeProject = projects[activeIndex];

  useEffect(() => {
    if (!enableWheel || projectCount <= 1) return;

    const handleWheel = (event: WheelEvent) => {
      // Only capture vertical wheel gestures.
      if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;

      event.preventDefault();

      if (wheelLockedRef.current) return;

      wheelDeltaRef.current += event.deltaY;

      if (Math.abs(wheelDeltaRef.current) < 40) return;

      const direction = wheelDeltaRef.current > 0 ? 1 : -1;
      wheelDeltaRef.current = 0;

      const nextIndex = activeIndexRef.current + direction;

      // Stop at the first and last project.
      if (nextIndex < 0 || nextIndex >= projectCount) return;

      activeIndexRef.current = nextIndex;
      onActiveIndexChange(nextIndex);
      wheelLockedRef.current = true;

      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }

      wheelTimeoutRef.current = setTimeout(() => {
        wheelLockedRef.current = false;
      }, 650);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);

      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
    };
  }, [enableWheel, projectCount, onActiveIndexChange]);

  if (!activeProject) return null;

  return (
    <PortfolioCard
      key={activeProject.slug}
      project={activeProject}
      closing={closing}
      onActivate={onOpen}
      onPrefetch={onPrefetch}
      className={className}
    />
  );
}
