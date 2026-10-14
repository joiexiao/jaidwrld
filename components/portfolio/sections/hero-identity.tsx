"use client";

import { ViewTransition } from "react";
import Link from "next/link";
import {
  AtSign,
  GitBranch,
  IdCard,
  Mail,
  UserRoundSearch,
} from "lucide-react";
import PortfolioButton from "@/components/ui/PortfolioButton";
import MenuButton from "@/components/ui/menu-button";
import TextType from "@/components/animation/TextType";

type HeroIdentityProps = {
  /** Buka project aktif (menutup fan lalu navigasi ke detail). */
  onOpen: () => void;
};

// Panel kiri home: identitas. Dipasangkan dengan meta proyek di halaman detail
// lewat shared View Transition `project-info` (crossfade, bukan morph).
export default function HeroIdentity({ onOpen }: HeroIdentityProps) {
  return (
    <div className="relative flex w-full flex-col items-start">
      <Link
        href="#top"
        className="text-muted mb-10 text-[10px] font-medium tracking-[0.28em] uppercase md:hidden"
      >
        JAIDWRLD
      </Link>

      <ViewTransition name="project-info" share="auto" default="none">
        <div className="w-full">
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
              onClick={onOpen}
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
        </div>
      </ViewTransition>
    </div>
  );
}
