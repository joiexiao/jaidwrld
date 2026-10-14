"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ViewTransition } from "react";
import { ArrowLeft, ExternalLink, LayoutList } from "lucide-react";
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
        className="relative mx-auto grid w-full max-w-[1440px] grid-cols-1 items-stretch gap-8 sm:gap-10 md:h-full md:grid-cols-[1fr_0.95fr] md:grid-rows-1 md:gap-10 lg:gap-20"
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

              <h1 className="font-regular text-3xl tracking-[-0.03em] sm:text-4xl md:text-5xl">
                {project.name}
              </h1>

              <p className="font-regular text-muted mt-2 text-xl sm:text-2xl md:text-3xl">
                {project.role}
              </p>

              <div className="mt-12 hidden items-center gap-2 md:flex">
                <PortfolioButton
                  text
                  icon={LayoutList}
                  onClick={handleToggleView}
                >
                  {view === "gallery" ? "Detail" : "Galeri"}
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

        {/* Right: gallery tanpa container visual */}

        <section className="relative w-full md:h-full md:min-h-0">
          <ViewTransition
            name={`project-${project.slug}`}
            share="morph"
            default="none"
          >
            <div className="project-gallery-scroll w-full md:h-full md:min-h-0 md:[scrollbar-width:none] md:overflow-y-auto md:overscroll-contain md:[&::-webkit-scrollbar]:hidden">
              <ProjectGallery project={project} view={view} />
            </div>
          </ViewTransition>
        </section>
      </div>

      {/* Mobile dock */}
      <div
        data-detail-chrome
        className="border-border bg-background/90 fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-2 border-t px-4 py-3 backdrop-blur md:hidden"
      >
        <PortfolioButton
          text={false}
          icon={ArrowLeft}
          aria-label="Kembali"
          onClick={handleBack}
        />

        <PortfolioButton text icon={LayoutList} onClick={handleToggleView}>
          {view === "gallery" ? "Detail" : "Galeri"}
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
