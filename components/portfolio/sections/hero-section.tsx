"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import HeroIdentity from "@/components/portfolio/sections/hero-identity";
import FeaturedWork from "@/components/portfolio/sections/featured-work";
import ThemeCta from "@/components/ui/theme-cta";
import { useProjectSelection } from "@/components/portfolio/project-selection";
import type { Project } from "@/types/project";

type HeroSectionProps = {
  projects: Project[];
};

// Fase menutup fan sebelum navigasi ke detail (sinkron dengan CSS fan).
const FAN_CLOSE_MS = 320;

// Halaman home = state "collapsed". Klik card menutup fan lalu navigasi ke
// /project/[slug]; morph card → panel dijalankan View Transition (bukan state).
export default function HeroSection({ projects }: HeroSectionProps) {
  const router = useRouter();
  const { activeSlug, setActiveSlug } = useProjectSelection();

  // Pulihkan project aktif dari context (biar morph balik dari detail match).
  const initialIndex = Math.max(
    0,
    projects.findIndex((project) => project.slug === activeSlug),
  );

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [closing, setClosing] = useState(false);

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeProject = projects[activeIndex];

  const handleActiveIndexChange = useCallback(
    (index: number) => {
      setActiveIndex(index);

      const next = projects[index];
      if (next) setActiveSlug(next.slug);
    },
    [projects, setActiveSlug],
  );

  const handleOpen = useCallback(() => {
    if (!activeProject || closing) return;

    setClosing(true);

    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    closeTimerRef.current = setTimeout(() => {
      router.push(`/project/${activeProject.slug}` as Route);
    }, FAN_CLOSE_MS);
  }, [activeProject, closing, router]);

  const handlePrefetch = useCallback(() => {
    if (activeProject) {
      router.prefetch(`/project/${activeProject.slug}` as Route);
    }
  }, [activeProject, router]);

  // Bersihkan timer saat unmount.
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  return (
    <main
      id="top"
      className="bg-surface text-foreground relative flex min-h-[100svh] w-full items-center overflow-x-clip px-6 sm:px-10 lg:px-48"
    >
      {/* Theme switch CTA */}
      <div className="fixed top-5 right-5 z-50">
        <ThemeCta />
      </div>

      {/* Main composition */}
      <div className="relative mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-12 py-24 md:grid-cols-[1fr_0.95fr] md:gap-10 lg:gap-20">
        {/* Left: identity */}
        <section className="relative z-10 flex w-full flex-col items-start">
          <HeroIdentity onOpen={handleOpen} />
        </section>

        {/* Right: collapsed card carousel */}
        <section className="relative flex items-center justify-center">
          <FeaturedWork
            projects={projects}
            activeIndex={activeIndex}
            onActiveIndexChange={handleActiveIndexChange}
            closing={closing}
            onOpen={handleOpen}
            onPrefetch={handlePrefetch}
          />
        </section>
      </div>
    </main>
  );
}
