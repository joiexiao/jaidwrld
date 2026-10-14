"use client";

import ProjectCarousel from "@/components/ui/ProjectCarousel";
import type { Project } from "@/types/project";

type FeaturedWorkProps = {
  projects: Project[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  /** Fase menutup fan sebelum navigasi (diteruskan ke PortfolioCard). */
  closing: boolean;
  /** Klik card → tutup fan lalu navigasi ke detail. */
  onOpen: () => void;
  /** Prefetch route detail saat hover (morph butuh halaman siap). */
  onPrefetch: () => void;
};

// Kolom kanan home (collapsed): card carousel + dots navigasi.
export default function FeaturedWork({
  projects,
  activeIndex,
  onActiveIndexChange,
  closing,
  onOpen,
  onPrefetch,
}: FeaturedWorkProps) {
  const activeProject = projects[activeIndex];

  if (!activeProject) return null;

  return (
    <div className="relative flex w-full flex-col items-center">
      <ProjectCarousel
        projects={projects}
        activeIndex={activeIndex}
        onActiveIndexChange={onActiveIndexChange}
        closing={closing}
        onOpen={onOpen}
        onPrefetch={onPrefetch}
      />

      {/* Dots desktop — di tepi kanan kolom */}
      {projects.length > 1 && (
        <div className="absolute top-1/2 right-0 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex">
          {projects.map((project, index) => (
            <button
              key={project.slug}
              type="button"
              aria-label={`Show ${project.name}`}
              aria-current={activeIndex === index ? "true" : undefined}
              onClick={() => onActiveIndexChange(index)}
              className={`size-1.5 rounded-full transition-all duration-300 ${
                activeIndex === index
                  ? "bg-foreground scale-110"
                  : "bg-border hover:bg-muted"
              }`}
            />
          ))}
        </div>
      )}

      {/* Dots mobile */}
      {projects.length > 1 && (
        <div className="mt-8 flex items-center gap-3 md:hidden">
          {projects.map((project, index) => (
            <button
              key={project.slug}
              type="button"
              aria-label={`Show ${project.name}`}
              aria-current={activeIndex === index ? "true" : undefined}
              onClick={() => onActiveIndexChange(index)}
              className={`size-1.5 rounded-full transition-all ${
                activeIndex === index ? "bg-foreground" : "bg-border"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
