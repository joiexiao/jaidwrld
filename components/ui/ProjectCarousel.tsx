"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PortfolioCard from "@/components/ui/PortfolioCard";
import type { Project } from "@/types/project";

type ProjectCarouselProps = {
  projects: Project[];
  className?: string;
  enableWheel?: boolean;
};

export default function ProjectCarousel({
  projects,
  className = "",
  enableWheel = true,
}: ProjectCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeIndexRef = useRef(0);
  const wheelLockedRef = useRef(false);
  const wheelDeltaRef = useRef(0);
  const wheelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const projectCount = projects.length;
  const activeProject = projects[activeIndex];

  const changeProject = useCallback(
    (index: number) => {
      if (projectCount === 0) return;

      const nextIndex = (index + projectCount) % projectCount;

      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    },
    [projectCount],
  );

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
      setActiveIndex(nextIndex);
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
  }, [enableWheel, projectCount]);

  if (!activeProject) return null;

  return (
    <section
      aria-label="Featured projects"
      className={`relative flex w-full flex-col items-center ${className}`}
    >
      <div className="relative w-full max-w-[288px] sm:max-w-[312px] lg:max-w-[352px]">
        <PortfolioCard key={activeProject.slug} project={activeProject} />
      </div>

      {/* Desktop navigation dots — at the right edge of the container */}
      {projectCount > 1 && (
        <div className="absolute top-1/2 right-0 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex">
          {projects.map((project, index) => (
            <button
              key={project.slug}
              type="button"
              aria-label={`Show ${project.name}`}
              aria-current={activeIndex === index ? "true" : undefined}
              onClick={() => changeProject(index)}
              className={`size-1.5 rounded-full transition-all duration-300 ${
                activeIndex === index
                  ? "bg-foreground scale-110"
                  : "bg-border hover:bg-muted"
              }`}
            />
          ))}
        </div>
      )}

      {/* Mobile navigation dots */}
      {projectCount > 1 && (
        <div className="mt-8 flex items-center gap-3 md:hidden">
          {projects.map((project, index) => (
            <button
              key={project.slug}
              type="button"
              aria-label={`Show ${project.name}`}
              aria-current={activeIndex === index ? "true" : undefined}
              onClick={() => changeProject(index)}
              className={`size-1.5 rounded-full transition-all ${
                activeIndex === index ? "bg-foreground" : "bg-border"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
