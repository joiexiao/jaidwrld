"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import HeroIdentity from "@/components/portfolio/sections/hero-identity";
import FeaturedWork from "@/components/portfolio/sections/featured-work";
import ThemeCta from "@/components/ui/theme-cta";
import type { Project } from "@/types/project";

type HeroSectionProps = {
  projects: Project[];
};

// Fase menutup fan sebelum panel membesar (durasi sinkron dengan CSS fan).
const FAN_CLOSE_MS = 320;

export default function HeroSection({ projects }: HeroSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [closing, setClosing] = useState(false);
  const [view, setView] = useState<"gallery" | "detail">("gallery");

  const stageRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeProject = projects[activeIndex];

  const handleActiveIndexChange = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const handleExpand = useCallback(() => {
    setView("gallery");
    setClosing(true);

    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    closeTimerRef.current = setTimeout(() => {
      setExpanded(true);
      setClosing(false);
    }, FAN_CLOSE_MS);
  }, []);

  const handleCollapse = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    setClosing(false);
    setExpanded(false);
    setView("gallery");
  }, []);

  const handleToggleView = useCallback(() => {
    setView((current) => (current === "gallery" ? "detail" : "gallery"));
  }, []);

  const handleLivePreview = useCallback(() => {
    const live = activeProject?.links.find(
      (link) => link.label.toLowerCase() === "live",
    );

    if (!live || !live.href || live.href === "#") return;

    window.open(live.href, "_blank", "noopener,noreferrer");
  }, [activeProject]);

  // Keluar dari expand: Escape + klik di luar area stage.
  useEffect(() => {
    if (!expanded) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleCollapse();
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (
        stageRef.current &&
        !stageRef.current.contains(event.target as Node)
      ) {
        handleCollapse();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [expanded, handleCollapse]);

  // Bersihkan timer saat unmount.
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  return (
    <main
      id="top"
      className="bg-surface text-foreground relative flex min-h-[100svh] w-full items-center overflow-x-hidden px-6 sm:px-10 lg:px-48"
    >
      {/* Theme switch CTA */}
      <div className="fixed top-5 right-5 z-50">
        <ThemeCta />
      </div>

      {/* Main composition */}
      <div
        ref={stageRef}
        className="relative mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-12 py-24 md:grid-cols-[1fr_0.95fr] md:gap-10 lg:gap-20"
      >
        {/* Left: identity / project meta */}
        <section className="relative z-10 flex w-full flex-col items-start">
          {activeProject && (
            <HeroIdentity
              expanded={expanded}
              project={activeProject}
              view={view}
              onExpand={handleExpand}
              onToggleView={handleToggleView}
              onLivePreview={handleLivePreview}
            />
          )}
        </section>

        {/* Right: featured work (collapsed card ⇄ expanded gallery) */}
        <section className="relative flex items-center justify-center">
          <FeaturedWork
            projects={projects}
            activeIndex={activeIndex}
            onActiveIndexChange={handleActiveIndexChange}
            expanded={expanded}
            closing={closing}
            view={view}
            onExpand={handleExpand}
            onCollapse={handleCollapse}
            onToggleView={handleToggleView}
            onLivePreview={handleLivePreview}
          />
        </section>
      </div>
    </main>
  );
}
