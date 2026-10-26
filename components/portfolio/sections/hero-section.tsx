"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";

import HeroIdentity from "@/components/portfolio/sections/hero-identity";
import FeaturedWork from "@/components/portfolio/sections/featured-work";
import ThemeCta from "@/components/ui/theme-cta";
import { IntroProvider } from "@/components/portfolio/intro";
import { useProjectSelection } from "@/components/portfolio/project-selection";
import { about } from "@/content/about";
import type { Project } from "@/types/project";

type HeroSectionProps = {
  projects: Project[];
};

const FAN_CLOSE_MS = 320;

export default function HeroSection({ projects }: HeroSectionProps) {
  const router = useRouter();
  const { activeSlug, setActiveSlug } = useProjectSelection();

  const initialIndex = Math.max(
    0,
    projects.findIndex((project) => project.slug === activeSlug),
  );

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [closing, setClosing] = useState(false);
  const [aboutExiting, setAboutExiting] = useState(false);

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const aboutNavigatingRef = useRef(false);
  const aboutWarmRef = useRef(false);

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

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = setTimeout(() => {
      router.push(`/project/${activeProject.slug}` as Route);
    }, FAN_CLOSE_MS);
  }, [activeProject, closing, router]);

  const handleOpenAbout = useCallback(() => {
    if (aboutNavigatingRef.current) return;

    aboutNavigatingRef.current = true;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      router.push("/about" as Route, {
        transitionTypes: ["to-about"],
      });
      return;
    }

    setAboutExiting(true);
  }, [router]);

  const handleAboutLeft = useCallback(() => {
    router.push("/about" as Route, {
      transitionTypes: ["to-about"],
    });
  }, [router]);

  const handlePrefetch = useCallback(() => {
    if (activeProject) {
      router.prefetch(`/project/${activeProject.slug}` as Route);
    }

    router.prefetch("/about" as Route);

    if (!aboutWarmRef.current) {
      aboutWarmRef.current = true;

      const image = new window.Image();
      image.decoding = "async";
      image.src = about.paperImage;
    }
  }, [activeProject, router]);

  useEffect(() => {
    if (activeProject) {
      setActiveSlug(activeProject.slug);
    }
  }, [activeProject, setActiveSlug]);

  useEffect(() => {
    router.prefetch("/about" as Route);
  }, [router]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  return (
    <IntroProvider>
      <main
        id="top"
        className="bg-surface text-foreground relative min-h-[100svh] w-full overflow-x-clip md:min-h-[200svh]"
      >
        {/* Sticky viewport — desktop scroll-lock behavior */}
        <div className="relative flex min-h-[100svh] w-full items-center px-6 sm:px-10 md:sticky md:top-0 md:h-[100svh] md:min-h-0 lg:px-48">
          {/* Theme switch CTA */}
          <div className="fixed top-5 right-5 z-50">
            <ThemeCta />
          </div>

          {/* Main composition */}
          <div className="relative mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-2 py-8 md:grid-cols-[1fr_0.95fr] md:gap-10 md:py-24 lg:gap-20">
            {/* Left: identity */}
            <section className="relative z-10 flex w-full flex-col items-center md:items-start">
              <HeroIdentity onOpenAbout={handleOpenAbout} />
            </section>

            {/* Right: featured work carousel */}
            <section className="relative flex items-center justify-center">
              <FeaturedWork
                projects={projects}
                activeIndex={activeIndex}
                onActiveIndexChange={handleActiveIndexChange}
                closing={closing}
                onOpen={handleOpen}
                onPrefetch={handlePrefetch}
                aboutExit={aboutExiting}
                onAboutExit={handleAboutLeft}
                showCarousel={true}
              />
            </section>
          </div>
        </div>
      </main>
    </IntroProvider>
  );
}
