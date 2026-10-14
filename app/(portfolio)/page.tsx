// app/(portfolio)/page.tsx — halaman beranda portfolio, di-render pada route "/".
// Isi: blok identitas (kiri) + ProjectCarousel (kanan) yang menampilkan PortfolioCard.
// Data proyek diambil dari content/projects.ts (satu sumber kebenaran).

"use client";

import Link from "next/link";
import PortfolioButton from "@/components/ui/PortfolioButton";
import MenuButton from "@/components/ui/menu-button";
import ProjectCarousel from "@/components/ui/ProjectCarousel";
import ThemeCta from "@/components/ui/theme-cta";
import { AtSign, GitBranch, IdCard, Mail, UserRoundSearch } from "lucide-react";
import { projects } from "@/content/projects";
import TextType from "@/components/animation/TextType";

export default function HomePage() {
  return (
    <main
      id="top"
      className="bg-surface text-foreground relative flex min-h-[100svh] w-full items-center overflow-hidden px-6 sm:px-10 lg:px-48"
    >
      {/* Theme switch CTA */}
      <div className="fixed top-5 right-5 z-50">
        <ThemeCta />
      </div>

      {/* Main composition */}
      <div className="relative mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-12 py-24 md:grid-cols-[1fr_0.95fr] md:gap-10 lg:gap-20">
        {/* Left: identity */}
        <section className="relative z-10 flex w-full flex-col items-start">
          <Link
            href="#top"
            className="text-muted mb-10 text-[10px] font-medium tracking-[0.28em] uppercase md:hidden"
          >
            JAIDWRLD
          </Link>

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
            {/* Icon only */}
            <PortfolioButton
              text={false}
              icon={IdCard}
              aria-label="Open project"
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
        </section>

        {/* Right: featured project carousel */}
        <section className="relative flex items-center justify-center">
          <ProjectCarousel projects={projects} />
        </section>
      </div>
    </main>
  );
}
