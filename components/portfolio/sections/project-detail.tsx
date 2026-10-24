"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ViewTransition } from "react";
import { ArrowLeft, ExternalLink, Images, TextInitial } from "lucide-react";

import PortfolioButton from "@/components/ui/PortfolioButton";
import ProjectGallery from "@/components/portfolio/sections/project-gallery";
import ThemeCta from "@/components/ui/theme-cta";
import { useProjectSelection } from "@/components/portfolio/project-selection";

import type { Project } from "@/types/project";

type ProjectDetailProps = {
  project: Project;
};

export default function ProjectDetail({ project }: ProjectDetailProps) {
  const router = useRouter();
  const { setActiveSlug } = useProjectSelection();

  const [view, setView] = useState<"gallery" | "detail">("gallery");
  const [, startTransition] = useTransition();

  const stageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveSlug(project.slug);
  }, [project.slug, setActiveSlug]);

  const hasLive = project.links.some(
    (link) => link.label.toLowerCase() === "live",
  );

  useEffect(() => {
    router.prefetch("/");
  }, [router]);

  const handleBack = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleToggleView = useCallback(() => {
    startTransition(() => {
      setView((current) => (current === "gallery" ? "detail" : "gallery"));
    });
  }, [startTransition]);

  const handleLivePreview = useCallback(() => {
    const live = project.links.find(
      (link) => link.label.toLowerCase() === "live",
    );

    if (!live?.href || live.href === "#") return;

    window.open(live.href, "_blank", "noopener,noreferrer");
  }, [project]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleBack();
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;

      if (!target) return;
      if (stageRef.current?.contains(target)) return;
      if (target.closest("[data-detail-chrome]")) return;

      handleBack();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [handleBack]);

  // Panel kanan (galeri) satu-satunya area yang scroll di desktop. Kalau
  // cursor/fokus ada di panel kiri, wheel & tombol keyboard tidak menggerakkan
  // apa pun (dokumen di-clip), jadi teruskan ke scroller panel kanan.
  useEffect(() => {
    const isDesktop = () => window.matchMedia("(min-width: 768px)").matches;
    const canScroll = (el: HTMLElement) => el.scrollHeight > el.clientHeight;

    const handleWheel = (event: WheelEvent) => {
      const scroller = scrollRef.current;

      if (!scroller || event.ctrlKey) return; // ctrl = zoom browser
      if (!isDesktop() || !canScroll(scroller)) return;
      if (scroller.contains(event.target as Node)) return; // native di panel kanan
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return; // horizontal

      event.preventDefault();

      const unit =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? scroller.clientHeight
            : 1;

      scroller.scrollTop += event.deltaY * unit;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const scroller = scrollRef.current;

      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (!scroller || !isDesktop() || !canScroll(scroller)) return;
      if (scroller.contains(event.target as Node)) return;

      const active = document.activeElement as HTMLElement | null;

      // Jangan rebut tombol/link/input yang sedang fokus (Space = klik).
      if (
        active &&
        (active.tagName === "BUTTON" ||
          active.tagName === "A" ||
          active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.tagName === "SELECT" ||
          active.isContentEditable)
      ) {
        return;
      }

      const page = scroller.clientHeight * 0.875;
      let delta: number;

      switch (event.key) {
        case "ArrowDown":
          delta = 40;
          break;
        case "ArrowUp":
          delta = -40;
          break;
        case "PageDown":
          delta = page;
          break;
        case "PageUp":
          delta = -page;
          break;
        case "Home":
          delta = -scroller.scrollTop;
          break;
        case "End":
          delta =
            scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop;
          break;
        case " ":
        case "Spacebar":
          delta = event.shiftKey ? -page : page;
          break;
        default:
          return;
      }

      event.preventDefault();
      scroller.scrollTop += delta;
    };

    document.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("wheel", handleWheel);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Icon and label both follow the current view.
  const toggleIcon = view === "gallery" ? TextInitial : Images;
  const toggleLabel = view === "gallery" ? "Detail" : "Gallery";

  return (
    <main
      id="top"
      className="bg-surface text-foreground relative min-h-[100svh] w-full overflow-x-clip px-6 sm:px-10 md:h-[100svh] md:overflow-hidden lg:px-48"
    >
      <div data-detail-chrome className="fixed top-5 right-5 z-50">
        <ThemeCta />
      </div>

      <div
        ref={stageRef}
        className="gap- relative mx-auto grid w-full max-w-[1440px] grid-cols-1 items-stretch sm:gap-0 md:h-full md:grid-cols-[1fr_0.95fr] md:grid-rows-1 md:gap-10 lg:gap-20"
      >
        {/* Left: project information */}
        <section className="relative z-10 flex w-full flex-col items-start py-16 md:justify-center md:py-24">
          <div className="absolute top-1/2 right-0 hidden translate-x-[calc(100%+0.75rem)] -translate-y-1/2 md:block lg:translate-x-[calc(100%+1rem)]">
            <PortfolioButton
              text={false}
              icon={ArrowLeft}
              aria-label="Kembali"
              onClick={handleBack}
            />
          </div>

          <ViewTransition name="project-info" share="auto" default="none">
            <div className="w-full">
              <div className="text-muted mb-4 flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase">
                <span className="bg-accent size-2 rounded-full" />
                {project.category} · {project.year}
              </div>

              <h1 className="font-regular text-2xl sm:text-3xl md:text-4xl lg:text-4xl">
                {project.name}
              </h1>

              <p className="font-regular text-muted text-2xl sm:text-3xl md:text-4xl lg:text-4xl">
                {project.role}
              </p>

              <ul className="mt-6 flex flex-wrap gap-2">
                {project.tech.map((item) => (
                  <li
                    key={item}
                    className="border-border rounded-full border px-3 py-1 text-xs"
                  >
                    {item}
                  </li>
                ))}
              </ul>

              {/* Desktop actions */}
              <div className="mt-12 hidden items-center gap-2 md:flex">
                <PortfolioButton
                  text
                  icon={toggleIcon}
                  iconPosition="left"
                  colour={view === "detail" ? "dark" : "light"}
                  onClick={handleToggleView}
                >
                  {toggleLabel}
                </PortfolioButton>

                <PortfolioButton
                  text
                  icon={ExternalLink}
                  disabled={!hasLive}
                  onClick={handleLivePreview}
                >
                  Live Preview
                </PortfolioButton>
              </div>
            </div>
          </ViewTransition>
        </section>

        {/* Right: gallery */}
        <section className="relative w-full md:h-full md:min-h-0">
          <ViewTransition
            name={`project-${project.slug}`}
            share="morph"
            default="none"
          >
            <div
              ref={scrollRef}
              className="project-gallery-scroll w-full md:h-full md:min-h-0 md:[scrollbar-width:none] md:overflow-y-auto md:overscroll-contain md:[&::-webkit-scrollbar]:hidden"
            >
              <ProjectGallery project={project} view={view} />
            </div>
          </ViewTransition>
        </section>
      </div>

      {/* Mobile dock */}
      <div
        data-detail-chrome
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-2 px-4 py-3 md:hidden"
      >
        <PortfolioButton
          text={false}
          icon={ArrowLeft}
          aria-label="Kembali"
          onClick={handleBack}
        />

        <PortfolioButton
          text
          icon={toggleIcon}
          iconPosition="left"
          colour={view === "detail" ? "dark" : "light"}
          onClick={handleToggleView}
        >
          {toggleLabel}
        </PortfolioButton>

        <PortfolioButton
          text
          icon={ExternalLink}
          disabled={!hasLive}
          onClick={handleLivePreview}
        >
          Live Preview
        </PortfolioButton>
      </div>
    </main>
  );
}
