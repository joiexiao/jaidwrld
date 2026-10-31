"use client";

import { useEffect, useRef } from "react";
import PortfolioCard from "@/components/ui/PortfolioCard";
import type { Project } from "@/types/project";

type ProjectCarouselProps = {
  /** Index project aktif (controlled oleh parent). */
  activeIndex: number;
  /** Callback saat navigasi wheel mengubah project aktif. */
  onActiveIndexChange: (index: number) => void;
  /** Fase menutup fan sebelum navigasi. */
  closing?: boolean;
  /** Callback saat card aktif diklik. */
  onOpen?: () => void;
  /** Dipanggil setelah animasi collapse selesai. */
  onCollapseComplete?: () => void;
  /** Prefetch route detail saat pointer masuk card. */
  onPrefetch?: () => void;
  /** Paksa fan terbuka untuk animasi intro. */
  previewFan?: boolean;
  enableLayoutId?: boolean;
  enableWheel?: boolean;
  className?: string;
  projects: Project[];
};

const WHEEL_THRESHOLD = 40;
const WHEEL_LOCK_DURATION = 650;
const WHEEL_GESTURE_RESET_MS = 150;
const WHEEL_DIRECTION_RESET_MS = 120;
const TOUCH_THRESHOLD = 35;

const CARD_SPACING = 180;
const IDLE_SCALE = 0.68;

export default function ProjectCarousel({
  projects,
  activeIndex,
  onActiveIndexChange,
  closing = false,
  onOpen,
  onCollapseComplete,
  onPrefetch,
  previewFan = false,
  enableLayoutId = true,
  enableWheel = true,
  className = "",
}: ProjectCarouselProps) {
  const activeIndexRef = useRef(activeIndex);

  const wheelLockedRef = useRef(false);
  const wheelDeltaRef = useRef(0);
  const wheelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wheelGestureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastWheelTimeRef = useRef(0);

  const touchStartYRef = useRef(0);
  const touchTriggeredRef = useRef(false);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const projectCount = projects.length;

  useEffect(() => {
    // Jangan izinkan pergantian active card selama collapse.
    if (!enableWheel || closing || projectCount <= 1) {
      return;
    }

    const clearWheelLock = () => {
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
        wheelTimeoutRef.current = null;
      }

      wheelLockedRef.current = false;
    };

    const scheduleWheelReset = () => {
      if (wheelGestureTimeoutRef.current) {
        clearTimeout(wheelGestureTimeoutRef.current);
      }

      wheelGestureTimeoutRef.current = setTimeout(() => {
        wheelDeltaRef.current = 0;
        wheelGestureTimeoutRef.current = null;
      }, WHEEL_GESTURE_RESET_MS);
    };

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) {
        return;
      }

      event.preventDefault();

      const now = performance.now();
      const timeSinceLastWheel = now - lastWheelTimeRef.current;

      lastWheelTimeRef.current = now;

      if (wheelLockedRef.current) {
        return;
      }

      if (timeSinceLastWheel > WHEEL_DIRECTION_RESET_MS) {
        wheelDeltaRef.current = 0;
      }

      scheduleWheelReset();
      wheelDeltaRef.current += event.deltaY;

      if (Math.abs(wheelDeltaRef.current) < WHEEL_THRESHOLD) {
        return;
      }

      const direction = wheelDeltaRef.current > 0 ? 1 : -1;

      wheelDeltaRef.current = 0;
      wheelLockedRef.current = true;

      const nextIndex =
        (activeIndexRef.current + direction + projectCount) % projectCount;

      activeIndexRef.current = nextIndex;
      onActiveIndexChange(nextIndex);

      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }

      wheelTimeoutRef.current = setTimeout(() => {
        wheelLockedRef.current = false;
        wheelTimeoutRef.current = null;
      }, WHEEL_LOCK_DURATION);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        touchTriggeredRef.current = true;
        return;
      }

      touchStartYRef.current = event.touches[0].clientY;
      touchTriggeredRef.current = false;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        return;
      }

      const deltaY = touchStartYRef.current - event.touches[0].clientY;

      if (Math.abs(deltaY) < TOUCH_THRESHOLD) {
        return;
      }

      event.preventDefault();

      if (touchTriggeredRef.current || wheelLockedRef.current) {
        return;
      }

      touchTriggeredRef.current = true;
      wheelLockedRef.current = true;

      const direction = deltaY > 0 ? 1 : -1;

      const nextIndex =
        (activeIndexRef.current + direction + projectCount) % projectCount;

      activeIndexRef.current = nextIndex;
      onActiveIndexChange(nextIndex);

      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }

      wheelTimeoutRef.current = setTimeout(() => {
        wheelLockedRef.current = false;
        wheelTimeoutRef.current = null;
      }, WHEEL_LOCK_DURATION);
    };

    const handleTouchEnd = () => {
      touchTriggeredRef.current = false;
    };

    window.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    window.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });

    window.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });

    window.addEventListener("touchend", handleTouchEnd, {
      passive: true,
    });

    window.addEventListener("touchcancel", handleTouchEnd, {
      passive: true,
    });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);

      clearWheelLock();

      if (wheelGestureTimeoutRef.current) {
        clearTimeout(wheelGestureTimeoutRef.current);
        wheelGestureTimeoutRef.current = null;
      }

      wheelDeltaRef.current = 0;
      touchTriggeredRef.current = false;
    };
  }, [enableWheel, closing, projectCount, onActiveIndexChange]);

  useEffect(() => {
    return () => {
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }

      if (wheelGestureTimeoutRef.current) {
        clearTimeout(wheelGestureTimeoutRef.current);
      }
    };
  }, []);

  if (projectCount === 0) {
    return null;
  }

  return (
    <div
      className={`relative w-full overflow-visible ${className}`}
      style={{
        height: "clamp(320px, 50vh, 700px)",
        perspective: "1200px",
        overflow: "visible",
        isolation: "isolate",
        touchAction: "none",
        pointerEvents: closing ? "none" : "auto",
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
              pointerEvents: isActive && !closing ? "auto" : "none",
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
              enableLayoutId={enableLayoutId}
              onActivate={isActive ? onOpen : undefined}
              onCollapseComplete={isActive ? onCollapseComplete : undefined}
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
