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
import {
  subscribeNavAnimation,
  clearTransitionContext,
  peekTransitionContext,
} from "@/components/portfolio/nav-intent";
import type { Project } from "@/types/project";

type HeroSectionProps = {
  projects: Project[];
};

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
  const navigationStartedRef = useRef(false);

  const activeProject = projects[activeIndex];

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const handleActiveIndexChange = useCallback(
    (index: number) => {
      if (closing) return;

      setActiveIndex(index);

      const next = projects[index];
      if (next) {
        setActiveSlug(next.slug);
      }
    },
    [closing, projects, setActiveSlug],
  );

  const handleOpen = useCallback(() => {
    if (!activeProject || closing || navigationStartedRef.current) {
      return;
    }

    navigationStartedRef.current = true;
    setClosing(true);

    clearCloseTimer();

    router.push(`/project/${activeProject.slug}` as Route, {
      transitionTypes: ["project-open"],
    });
  }, [activeProject, closing, router, clearCloseTimer]);

  const handleCollapseComplete = useCallback(() => {
    // No-op: navigation already started immediately on click.
  }, []);

  // Reset state saat kembali dari project detail.
  useEffect(() => {
    const unsubscribe = subscribeNavAnimation((phase) => {
      if (phase !== "navigating") return;

      const intent = peekTransitionContext()?.intent;

      if (intent === "home-from-project") {
        clearCloseTimer();
        navigationStartedRef.current = false;
        setClosing(false);
      }

      if (intent === "home-cold") {
        aboutNavigatingRef.current = false;
        setAboutExiting(false);
      }
    });

    return unsubscribe;
  }, [clearCloseTimer]);

  // Home dapat dipulihkan dari route cache. Reset state exit ketika Project
  // Detail / About memberi sinyal bahwa navigasi kembali ke Home akan dimulai.
  // (Duplicate useEffect removed - handled by the one above)

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

  useEffect(() => clearCloseTimer, [clearCloseTimer]);

  return (
    <IntroProvider>
      <main
        id="top"
        className="bg-surface text-foreground relative min-h-[100svh] w-full overflow-x-clip md:min-h-[200svh]"
      >
        <div className="relative flex min-h-[100svh] w-full items-center px-6 sm:px-10 md:sticky md:top-0 md:h-[100svh] md:min-h-0 lg:px-48">
          <div className="fixed top-5 right-5 z-50">
            <ThemeCta />
          </div>

          <div className="relative mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-2 py-8 md:grid-cols-[1fr_0.95fr] md:gap-10 md:py-24 lg:gap-20">
            {/* Jangan jadikan seluruh HeroIdentity satu View Transition snapshot.
                Heading dan actions tetap dikelola oleh Framer Motion. */}
            <section className="relative z-10 flex w-full flex-col items-center md:items-start">
              <HeroIdentity
                onOpenAbout={handleOpenAbout}
              />
            </section>

            <section className="relative flex items-center justify-center">
              <FeaturedWork
                projects={projects}
                activeIndex={activeIndex}
                onActiveIndexChange={handleActiveIndexChange}
                closing={closing}
                onOpen={handleOpen}
                onCollapseComplete={handleCollapseComplete}
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
