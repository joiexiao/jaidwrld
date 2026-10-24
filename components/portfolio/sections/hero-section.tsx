"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import HeroIdentity from "@/components/portfolio/sections/hero-identity";
import FeaturedWork from "@/components/portfolio/sections/featured-work";
import ThemeCta from "@/components/ui/theme-cta";
import { IntroProvider } from "@/components/portfolio/intro";
import { useProjectSelection } from "@/components/portfolio/project-selection";
import { resetNavAnimation } from "@/components/portfolio/nav-intent";
import { about } from "@/content/about";
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
  // Card sedang bergeser ke kanan (menyingkap kertas) sebelum pindah ke About.
  const [aboutExiting, setAboutExiting] = useState(false);

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cegah navigasi About terpicu berulang selama transisi berjalan.
  const aboutNavigatingRef = useRef(false);
  // Aset About cukup dihangatkan sekali (route + tekstur kertas).
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

    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

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
      router.push("/about" as Route, { transitionTypes: ["to-about"] });
      return;
    }

    // Card bergeser ke kanan dulu; navigasi baru setelah selesai (onAboutExit).
    setAboutExiting(true);
  }, [router]);

  const handleAboutLeft = useCallback(() => {
    router.push("/about" as Route, { transitionTypes: ["to-about"] });
  }, [router]);

  const handlePrefetch = useCallback(() => {
    if (activeProject) {
      router.prefetch(`/project/${activeProject.slug}` as Route);
    }

    // Hangatkan About di hover card: route + tekstur kertas, supaya shader
    // PaperCrumple tidak menunggu decode gambar saat transisi.
    router.prefetch("/about" as Route);
    if (!aboutWarmRef.current) {
      aboutWarmRef.current = true;
      const image = new window.Image();
      image.decoding = "async";
      image.src = about.paperImage;
    }
  }, [activeProject, router]);

  // Simpan slug aktif sejak mount supaya halaman About bisa merender ghost
  // card yang sama saat kembali ke home.
  useEffect(() => {
    if (activeProject) setActiveSlug(activeProject.slug);
  }, [activeProject, setActiveSlug]);

  // Prefetch halaman About biar shared View Transition `project-info`
  // jalan di commit yang sama (tanpa fallback) saat diklik.
  useEffect(() => {
    router.prefetch("/about" as Route);
  }, [router]);

  // Bersihkan timer saat unmount.
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  return (
    <IntroProvider>
      <main
        id="top"
        className="bg-surface text-foreground relative flex min-h-[100svh] w-full items-center overflow-x-clip px-6 sm:px-10 lg:px-48"
      >
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

          {/* Right: collapsed card carousel.
              Arah About: card bergeser ke kanan menyingkap kertas di belakang,
              lalu navigasi. Kembali dari About: card ghost meluncur dari kanan. */}
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
      </main>
    </IntroProvider>
  );
}
