"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import MenuButton from "@/components/ui/menu-button";
import { contactOptions } from "@/content/contact";
import ThemeCta from "@/components/ui/theme-cta";
import IdentityHeading from "@/components/portfolio/identity-heading";
import Lanyard from "@/components/animation/lanyard";
import { useTheme } from "@/hooks/use-theme";
import {
  clearNavIntent,
  peekNavIntent,
  setNavIntent,
  peekCarouselBounds,
  clearCarouselBounds,
  BUTTON_EXIT_DURATION,
  GHOST_CARD_DURATION,
  subscribeNavAnimation,
  orchestrateExitToHome,
  type AnimationPhase,
} from "@/components/portfolio/nav-intent";
import { useProjectSelection } from "@/components/portfolio/project-selection";
import PortfolioCard from "@/components/ui/PortfolioCard";
import PaperCrumple from "@/components/animation/PaperCrumple";
import type { Project } from "@/types/project";
import type { About } from "@/content/about";

type AboutSectionProps = {
  projects: Project[];
  about: About;
};

// Durasi slide keluar menu About sebelum navigasi balik (sinkron dengan BUTTON_EXIT_DURATION).
const MENU_OUT_MS = BUTTON_EXIT_DURATION;

// Card About→Home: masuk dari kanan menimpa kertas yang sudah memudar.
const cardEnterVariants: Variants = {
  hidden: { x: "110vw" },
  enter: {
    x: 0,
    transition: {
      duration: GHOST_CARD_DURATION / 1000,
      ease: [0.45, 0, 0.55, 1],
    },
  },
};

// Ghost card yang meluncur dari kanan sebelum navigasi balik ke home.
function EnterCard({
  project,
  onReady,
  carouselCenterY,
}: {
  project: Project;
  onReady: () => void;
  carouselCenterY?: number;
}) {
  // Geser vertikal supaya center ghost card sama dengan center carousel home
  // (posisi carousel asli tidak persis di tengah viewport karena padding hero).
  const offsetY =
    carouselCenterY === undefined || typeof window === "undefined"
      ? 0
      : carouselCenterY - window.innerHeight / 2;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-1/2 z-40 flex -translate-y-1/2 justify-center"
      style={{ marginTop: offsetY }}
    >
      <motion.div
        aria-hidden="true"
        initial="hidden"
        animate="enter"
        variants={cardEnterVariants}
        onAnimationComplete={(definition) => {
          if (definition === "enter") onReady();
        }}
      >
        <PortfolioCard project={project} />
      </motion.div>
    </div>
  );
}

// Halaman About: layar pertama = home (identity center + box seukuran card di
// posisi yang sama). Scroll normal (identity & teks ikut scroll 1:1); teks About
// nge-peek ~1.5 baris sebagai petunjuk. Panel kanan sticky (diam) sepanjang scroll.
export default function AboutSection({ projects, about }: AboutSectionProps) {
  const router = useRouter();
  const { activeSlug } = useProjectSelection();
  const { resolvedTheme } = useTheme();
  // Card yang akan "naik dari dock" saat kembali ke home.
  const ghostProject =
    projects.find((project) => project.slug === activeSlug) ?? projects[0];

  // Scroll-ke-atas sebelum navigasi (biar back dari bawah layar terasa smooth).
  const scrollFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollCleanupRef = useRef<(() => void) | null>(null);
  const navigatingRef = useRef(false);

  // Koreografi slide untuk menu About (mekanisme sama dengan hero-identity:
  // class enter/exit View Transition tidak terpasang di lingkungan ini).
  // - keluar (to-home): WAAPI slide kanan + fade, lalu wrapper digeser ke luar
  //   viewport supaya pair `contact-menu` tidak terbentuk — back ke home jadi
  //   crossfade root murni + tombol hero meluncur masuk dari kiri.
  // - masuk (to-about, jalur dingin): class `cold-in-right`.
  const [coldEnter] = useState(() => peekNavIntent() === "about-cold");
  const [carouselBounds] = useState(() => peekCarouselBounds());
  const [menuPhase, setMenuPhase] = useState<"idle" | "exiting" | "dismissed">(
    "idle",
  );
  // Card ghost: "leaving" = kertas memudar + card meluncur dari kanan.
  const [leaving, setLeaving] = useState(false);
  // Card sudah sampai di posisi (tinggal tunggu menu slide selesai).
  const [cardLanded, setCardLanded] = useState(false);

  // Ghost hanya dirender di SATU container (desktop / mobile) supaya
  // `view-transition-name` project tidak duplikat di halaman yang sama.
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === "undefined"
      ? true
      : window.matchMedia("(min-width: 768px)").matches,
  );
  const menuRef = useRef<HTMLDivElement>(null);

  // Intent sekali pakai (lihat nav-intent.ts) — bersihkan setelah dibaca.
  useEffect(() => {
    clearNavIntent();
    clearCarouselBounds();
  }, []);

  useEffect(() => {
    router.prefetch("/");
  }, [router]);

  // Ikuti breakpoint yang sama dengan layout (md = 768px).
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    return () => {
      if (scrollFallbackRef.current) clearTimeout(scrollFallbackRef.current);
      scrollCleanupRef.current?.();
    };
  }, []);

  // Push ke home — dipanggil setelah slide keluar menu selesai (navigateBack).
  const finishBack = useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;

    if (scrollFallbackRef.current) clearTimeout(scrollFallbackRef.current);
    scrollCleanupRef.current?.();

    router.push("/", { transitionTypes: ["to-home"] });
  }, [router]);

  // Kertas memudar + card ghost meluncur dari kanan; navigasi setelah keduanya
  const navigateBack = useCallback(() => {
    if (menuPhase !== "idle" || leaving) return;

    setNavIntent("home-cold");

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      finishBack();
      return;
    }

    setLeaving(true);

    if (!ghostProject) {
      setCardLanded(true);
      setMenuPhase("dismissed");
      return;
    }

    setMenuPhase("exiting");

    orchestrateExitToHome(() => {
      setMenuPhase("dismissed");
    });
  }, [menuPhase, leaving, ghostProject, finishBack]);

  // Subscribe ke orchestrator untuk jalankan WAAPI menu keluar saat button-exit
  useEffect(() => {
    const unsubscribe = subscribeNavAnimation((phase: AnimationPhase) => {
      if (phase === "button-exit") {
        const node = menuRef.current;
        if (!node) return;

        const out = node.animate(
          [
            { opacity: 1, transform: "translateX(0px)" },
            { opacity: 0, transform: "translateX(56px)" },
          ],
          {
            duration: MENU_OUT_MS,
            easing: "cubic-bezier(0.45, 0, 0.55, 1)",
            fill: "forwards",
          },
        );

        out.finished.then(
          () => setMenuPhase("dismissed"),
          () => {},
        );
      }
    });

    return unsubscribe;
  }, []);

  // Navigasi baru setelah menu keluar DAN card ghost sampai di posisinya.
  useEffect(() => {
    if (menuPhase === "dismissed" && cardLanded) finishBack();
  }, [menuPhase, cardLanded, finishBack]);

  // Back: kalau user sedang scroll ke bawah, scroll balik ke atas dulu (smooth),
  // baru slide keluar menu → navigasi. Kalau sudah di atas / reduce-motion,
  // langsung ke slide keluar.
  const handleBackHome = useCallback(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion || window.scrollY <= 4) {
      navigateBack();
      return;
    }

    if ("onscrollend" in window) {
      const onScrollEnd = () => navigateBack();
      window.addEventListener("scrollend", onScrollEnd, { once: true });
      scrollCleanupRef.current = () =>
        window.removeEventListener("scrollend", onScrollEnd);
      // Fallback kalau scrollend tak fire (mis. scroll sudah nyampe duluan).
      scrollFallbackRef.current = setTimeout(navigateBack, 1000);
    } else {
      scrollFallbackRef.current = setTimeout(navigateBack, 700);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [navigateBack]);

  return (
    <main
      id="top"
      className="bg-surface text-foreground relative w-full overflow-x-clip px-6 sm:px-10 lg:px-48"
    >
      <div className="fixed top-5 right-5 z-50">
        <ThemeCta />
      </div>

      {/* Fade tipis di bawah panel kiri — teks About meredup ke tepi layar */}
      <div
        aria-hidden="true"
        className="from-surface pointer-events-none fixed inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-t to-transparent"
      />

      <div className="relative mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-8 sm:gap-10 md:grid-cols-[1fr_0.95fr] md:gap-10 lg:gap-20">
        {/* Left: layar pertama (identity center) + teks About di bawahnya */}
        <section className="relative z-10 flex w-full flex-col items-start">
          <div className="flex min-h-[100svh] w-full flex-col items-start justify-center">
            <Link
              href="#top"
              className="text-muted mb-10 text-[10px] font-medium tracking-[0.28em] uppercase md:hidden"
            >
              JAIDWRLD
            </Link>

            <IdentityHeading />

            {/* Wrapper koreografi (lihat menuPhase di atas). */}
            <div
              className={
                menuPhase === "dismissed"
                  ? "pointer-events-none -translate-x-[200vw]"
                  : menuPhase === "exiting"
                    ? "pointer-events-none"
                    : coldEnter
                      ? "cold-in-right"
                      : undefined
              }
            >
              <div ref={menuRef} className="mt-12 flex items-center gap-2">
                <MenuButton
                  defaultOpen
                  onMainClick={handleBackHome}
                  // Menu panel kiri About bersifat permanen: klik di luar tidak
                  // menutupnya, dan Escape = back ke home (bukan menutup menu).
                  dismissOnOutsideClick={false}
                  onEscape={handleBackHome}
                  triggerIcon={ChevronLeft}
                  activeIcon={ChevronLeft}
                  triggerLabel="Home"
                  options={contactOptions}
                  viewTransitionName="contact-menu"
                />
              </div>
            </div>
          </div>

          {/* Teks About — nge-peek ~1.5 baris sebagai petunjuk scroll */}
          <div className="-mt-[42px] w-full pb-24 md:-mt-[54px]">
            <p className="font-regular text-xl sm:text-2xl md:text-3xl lg:text-3xl">
              {about.intro}
            </p>

            <div className="mt-10">
              <p className="text-muted text-xs tracking-[0.18em]">Projects:</p>

              <ul className="font-regular text-muted mt-3 flex flex-col gap-1 text-xl sm:text-2xl md:text-3xl lg:text-3xl">
                {projects.map((project) => (
                  <li key={project.slug}>{project.name}</li>
                ))}
              </ul>
            </div>

            <p className="font-regular text-muted mt-10 text-xl sm:text-2xl md:text-3xl lg:text-3xl">
              {about.closing}
            </p>

            <p className="text-muted mt-16 text-xs">{about.footer}</p>
          </div>
        </section>

        {/* Right: Lanyard sticky (framer-motion fade-out sinkron dengan EnterCard).
            Back ke home: lanyard memudar lalu ghost card meluncur dari kanan. */}
        <section className="relative hidden w-full md:block">
          <div className="sticky top-0 flex h-[100svh] items-center justify-center">
            <motion.div
              initial={false}
              animate={leaving ? { opacity: 0 } : { opacity: 1 }}
              transition={{
                duration: GHOST_CARD_DURATION / 1000,
                ease: [0.45, 0, 0.55, 1],
              }}
              className="fixed inset-0 z-[5]"
            >
              <Lanyard
                theme={resolvedTheme}
                strapLength={0.5}
                interactive={true}
                size={0.6}
              />
            </motion.div>
            {leaving && ghostProject && isDesktop && (
              <EnterCard
                project={ghostProject}
                onReady={() => setCardLanded(true)}
                carouselCenterY={carouselBounds?.centerY}
              />
            )}
          </div>
        </section>
      </div>

      {/* Mobile: kertas di bawah konten (non-interaktif agar scroll tidak terblokir) */}
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-24 md:hidden">
        <div className="relative mx-auto w-full max-w-[270px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
          >
            <PaperCrumple
              src={about.paperImage}
              alt="Sidsneaks"
              width={270}
              height={450}
              disabled
              detail={32}
              style={{ height: "auto", width: "100%", maxWidth: "270px" }}
              className={`transition-opacity duration-[820ms] ease-[cubic-bezier(0.33,1,0.68,1)] ${
                leaving ? "opacity-0" : "opacity-100"
              }`}
            />
          </motion.div>
          {leaving && ghostProject && !isDesktop && (
            <EnterCard
              project={ghostProject}
              onReady={() => setCardLanded(true)}
            />
          )}
        </div>
      </div>
    </main>
  );
}
