"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import { ArrowLeft, ExternalLink, LayoutList } from "lucide-react";
import PortfolioButton from "@/components/ui/PortfolioButton";
import ProjectCarousel from "@/components/ui/ProjectCarousel";
import ProjectGallery from "@/components/portfolio/sections/project-gallery";
import type { Project } from "@/types/project";

type FeaturedWorkProps = {
  projects: Project[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  expanded: boolean;
  closing: boolean;
  view: "gallery" | "detail";
  onExpand: () => void;
  onCollapse: () => void;
  onToggleView: () => void;
  onLivePreview: () => void;
};

// Ukuran shell saat collapsed (kartu) — sinkron dengan PortfolioCard CARD_SIZE.
const COLLAPSED_SIZE =
  "h-[296px] w-[288px] sm:h-[320px] sm:w-[312px] lg:h-[362px] lg:w-[352px]";

// Shell saat expanded: mengisi panel kanan; tinggi dibatasi agar muat di viewport
// (12rem = padding vertikal grid py-24) dan tidak melebihi 80svh di layar tinggi.
const EXPANDED_SIZE =
  "h-[calc(100svh-12rem)] max-h-[80svh] w-full overflow-hidden rounded-[34px]";

const SHELL_TRANSITION: Transition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] };
const FADE_TRANSITION: Transition = { duration: 0.35, ease: [0.22, 1, 0.36, 1] };

export default function FeaturedWork({
  projects,
  activeIndex,
  onActiveIndexChange,
  expanded,
  closing,
  view,
  onExpand,
  onCollapse,
  onToggleView,
  onLivePreview,
}: FeaturedWorkProps) {
  const reduceMotion = useReducedMotion();
  const activeProject = projects[activeIndex];

  if (!activeProject) return null;

  const hasLive = activeProject.links.some(
    (link) => link.label.toLowerCase() === "live",
  );

  const shellTransition: Transition = reduceMotion
    ? { duration: 0 }
    : SHELL_TRANSITION;
  const fadeTransition: Transition = reduceMotion
    ? { duration: 0 }
    : FADE_TRANSITION;

  return (
    <div className="relative flex w-full flex-col items-center">
      <motion.div
        layout
        transition={shellTransition}
        className={`relative ${expanded ? EXPANDED_SIZE : `${COLLAPSED_SIZE} overflow-visible`}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {expanded ? (
            <motion.div
              key="gallery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fadeTransition}
              className="h-full w-full"
            >
              <ProjectGallery project={activeProject} view={view} />
            </motion.div>
          ) : (
            <motion.div
              key="card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fadeTransition}
              className="flex h-full w-full items-center justify-center"
            >
              <ProjectCarousel
                projects={projects}
                activeIndex={activeIndex}
                onActiveIndexChange={onActiveIndexChange}
                expanded={expanded}
                closing={closing}
                onExpand={onExpand}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Dots desktop (collapsed) — di tepi kanan kolom */}
      {!expanded && projects.length > 1 && (
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

      {/* Dots mobile (collapsed) */}
      {!expanded && projects.length > 1 && (
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

      {/* Floating back (desktop) — mengambang di kiri panel expand */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="back"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={fadeTransition}
            className="absolute top-1/2 left-0 z-30 hidden -translate-x-1/2 -translate-y-1/2 md:block"
          >
            <PortfolioButton
              text={false}
              icon={ArrowLeft}
              aria-label="Kembali"
              onClick={onCollapse}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom dock (mobile) — semua CTA pindah ke bawah saat expand */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="dock"
            initial={{ y: "120%" }}
            animate={{ y: 0 }}
            exit={{ y: "120%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="border-border bg-background/90 fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-2 border-t px-4 py-3 backdrop-blur md:hidden"
          >
            <PortfolioButton
              text={false}
              icon={ArrowLeft}
              aria-label="Kembali"
              onClick={onCollapse}
            />
            <PortfolioButton text icon={LayoutList} onClick={onToggleView}>
              {view === "gallery" ? "Detail" : "Galeri"}
            </PortfolioButton>
            <PortfolioButton
              text
              icon={ExternalLink}
              disabled={!hasLive}
              onClick={onLivePreview}
            >
              Live Preview
            </PortfolioButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
