"use client";

import Link from "next/link";
import {
  AtSign,
  ExternalLink,
  GitBranch,
  IdCard,
  LayoutList,
  Mail,
  UserRoundSearch,
} from "lucide-react";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import PortfolioButton from "@/components/ui/PortfolioButton";
import MenuButton from "@/components/ui/menu-button";
import TextType from "@/components/animation/TextType";
import type { Project } from "@/types/project";

type HeroIdentityProps = {
  expanded: boolean;
  project: Project;
  view: "gallery" | "detail";
  onExpand: () => void;
  onToggleView: () => void;
  onLivePreview: () => void;
};

const PANEL_TRANSITION: Transition = { duration: 0.35, ease: [0.22, 1, 0.36, 1] };

export default function HeroIdentity({
  expanded,
  project,
  view,
  onExpand,
  onToggleView,
  onLivePreview,
}: HeroIdentityProps) {
  const hasLive = project.links.some(
    (link) => link.label.toLowerCase() === "live",
  );

  return (
    <div className="relative flex w-full flex-col items-start">
      <Link
        href="#top"
        className="text-muted mb-10 text-[10px] font-medium tracking-[0.28em] uppercase md:hidden"
      >
        JAIDWRLD
      </Link>

      <AnimatePresence mode="wait" initial={false}>
        {expanded ? (
          <motion.div
            key="project"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={PANEL_TRANSITION}
            className="w-full"
          >
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

            {/* CTA desktop — di mobile pindah ke dock bawah */}
            <div className="mt-12 hidden items-center gap-2 md:flex">
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
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="identity"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={PANEL_TRANSITION}
            className="w-full"
          >
            <div className="text-muted mb-4 hidden items-center gap-2 text-[10px] tracking-[0.18em] uppercase md:flex">
              <span className="bg-accent size-2 rounded-full" />
              Available for work
            </div>

            <p className="font-regular text-2xl sm:text-3xl md:text-4xl lg:text-4xl">
              Mujahid Azzam Darmawan
            </p>

            <TextType
              as="p"
              text={[
                "Product Designer",
                "Graphic Designer",
                "Frontend Developer",
              ]}
              typingSpeed={75}
              deletingSpeed={35}
              pauseDuration={1800}
              initialDelay={500}
              loop
              className="font-regular text-muted mt-2 text-xl sm:text-2xl md:text-3xl lg:text-4xl"
            />

            <div className="mt-12 flex items-center gap-2">
              {/* Icon only — buka project aktif */}
              <PortfolioButton
                text={false}
                icon={IdCard}
                aria-label="Open project"
                onClick={onExpand}
              />

              {/* Menu: trigger + opsi yang muncul dari samping */}
              <MenuButton
                triggerIcon={UserRoundSearch}
                triggerLabel="Contact"
                options={[
                  {
                    icon: Mail,
                    ariaLabel: "Email",
                    showHoverLabel: true,
                    hoverLabel: "click to copy",
                    onClick: async () => {
                      await navigator.clipboard.writeText("email@domain.com");
                    },
                  },
                  { icon: AtSign, ariaLabel: "LinkedIn" },
                  { icon: GitBranch, ariaLabel: "GitHub" },
                ]}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
