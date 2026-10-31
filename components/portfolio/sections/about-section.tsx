"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import MenuButton from "@/components/ui/menu-button";
import { contactOptions } from "@/content/contact";
import ThemeCta from "@/components/ui/theme-cta";
import IdentityHeading from "@/components/portfolio/identity-heading";
import Lanyard from "@/components/animation/lanyard";
import FlipCard from "@/components/animation/Flipcard";
import { useTheme } from "@/hooks/use-theme";

import { useProjectSelection } from "@/components/portfolio/project-selection";

import {
  clearTransitionContext,
  peekTransitionContext,
  peekCarouselBounds,
  clearCarouselBounds,
  setTransitionContext,
  BUTTON_EXIT_DURATION,
  GHOST_CARD_DURATION,
  subscribeNavAnimation,
  orchestrateExitToHome,
  type AnimationPhase,
} from "@/components/portfolio/nav-intent";

import PortfolioCard from "@/components/ui/PortfolioCard";
import PaperCrumple from "@/components/animation/PaperCrumple";

import type { Project } from "@/types/project";
import type { About } from "@/content/about";

type AboutSectionProps = {
  projects: Project[];
  about: About;
};

// Durasi slide keluar menu About sebelum navigasi balik.
const MENU_OUT_MS = BUTTON_EXIT_DURATION;

// Card About → Home: masuk dari kanan menimpa kertas yang sudah memudar.
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

// Ghost card yang meluncur dari kanan sebelum navigasi balik ke Home.
function EnterCard({
  project,
  onReady,
  carouselCenterY,
}: {
  project: Project;
  onReady: () => void;
  carouselCenterY?: number;
}) {
  // Geser vertikal supaya center ghost card sama dengan center carousel Home.
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

// Halaman About:
// - Viewport About tetap fixed.
// - Konten About scroll di dalam container.
// - Overscroll tidak diteruskan ke halaman di belakangnya.
// - Panel kanan Lanyard tetap sticky sepanjang scroll.
export default function AboutSection({ projects, about }: AboutSectionProps) {
  const router = useRouter();
  const { activeSlug } = useProjectSelection();
  const { resolvedTheme } = useTheme();

  // Container scroll internal About.
  const aboutScrollRef = useRef<HTMLDivElement>(null);

  // Card yang akan naik dari dock saat kembali ke Home.
  const ghostProject =
    projects.find((project) => project.slug === activeSlug) ?? projects[0];

  // Scroll ke atas sebelum navigasi.
  const scrollFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollCleanupRef = useRef<(() => void) | null>(null);
  const navigatingRef = useRef(false);

  // Koreografi slide untuk menu About.
  const [coldEnter] = useState(
    () => peekTransitionContext()?.intent === "about-cold",
  );
  const [carouselBounds] = useState(() => peekCarouselBounds());

  const [menuPhase, setMenuPhase] = useState<"idle" | "exiting" | "dismissed">(
    "idle",
  );

  // Card ghost: leaving = kertas memudar + card meluncur dari kanan.
  const [leaving, setLeaving] = useState(false);

  // Card sudah sampai di posisi.
  const [cardLanded, setCardLanded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);

  // Ghost hanya dirender di satu container (desktop/mobile).
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === "undefined"
      ? true
      : window.matchMedia("(min-width: 768px)").matches,
  );

  // FlipCard mobile entrance animation state.
  const [showFlipcardEnter, setShowFlipcardEnter] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Intent sekali pakai — bersihkan setelah dibaca.
  useEffect(() => {
    clearTransitionContext();
    clearCarouselBounds();
  }, []);

  // Kunci scroll body agar hanya container About yang bisa scroll.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousOverscrollBehavior = document.body.style.overscrollBehaviorY;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehaviorY = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehaviorY = previousOverscrollBehavior;
    };
  }, []);

  // Buka scroll internal setelah animasi masuk (cold-in-right 420ms) selesai.
  useEffect(() => {
    if (!coldEnter) {
      setIsTransitioning(false);
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      setIsTransitioning(false);
      return;
    }

    const timer = setTimeout(() => setIsTransitioning(false), 450);

    return () => clearTimeout(timer);
  }, [coldEnter]);

  useEffect(() => {
    router.prefetch("/");
  }, [router]);

  // Ikuti breakpoint layout md = 768px.
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  // FlipCard mobile entrance: trigger on mount for mobile only.
  useEffect(() => {
    if (isDesktop) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      setShowFlipcardEnter(true);
      return;
    }

    // Small delay to ensure render before animation starts.
    const timer = setTimeout(() => setShowFlipcardEnter(true), 0);
    return () => clearTimeout(timer);
  }, [isDesktop]);

  useEffect(() => {
    return () => {
      if (scrollFallbackRef.current) {
        clearTimeout(scrollFallbackRef.current);
      }

      scrollCleanupRef.current?.();
    };
  }, []);

  // ============================================================
  // FIX: Wheel scroll tetap bekerja saat cursor berada di Lanyard.
  // ============================================================
  useEffect(() => {
    const scrollContainer = aboutScrollRef.current;

    if (!scrollContainer) return;

    const handleWheel = (event: WheelEvent) => {
      // Jangan scroll selama animasi transisi.
      if (isTransitioning) {
        event.preventDefault();
        return;
      }

      // Abaikan horizontal scroll.
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        return;
      }

      // Tidak ada konten yang bisa di-scroll.
      if (scrollContainer.scrollHeight <= scrollContainer.clientHeight) {
        return;
      }

      // Ambil alih wheel event dari elemen di dalam container,
      // termasuk canvas Lanyard.
      event.preventDefault();
      event.stopPropagation();

      scrollContainer.scrollTop += event.deltaY;
    };

    scrollContainer.addEventListener("wheel", handleWheel, {
      passive: false,
      capture: true,
    });

    return () => {
      scrollContainer.removeEventListener("wheel", handleWheel, {
        capture: true,
      });
    };
  }, [isTransitioning]);

  // Push ke Home setelah slide keluar menu selesai.
  const finishBack = useCallback(() => {
    if (navigatingRef.current) return;

    navigatingRef.current = true;

    if (scrollFallbackRef.current) {
      clearTimeout(scrollFallbackRef.current);
    }

    scrollCleanupRef.current?.();

    router.push("/", { transitionTypes: ["to-home"] });
  }, [router]);

  // Kertas memudar + card ghost meluncur dari kanan.
  const navigateBack = useCallback(() => {
    if (menuPhase !== "idle" || leaving) return;

    const node = menuRef.current;
    let exitAnim: Animation | undefined;

    if (node) {
      exitAnim = node.animate(
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
      exitAnim.finished.then(
        () => setMenuPhase("dismissed"),
        () => {},
      );
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      orchestrateExitToHome(finishBack, []);
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
      setCardLanded(true);
    }, [
      {
        name: "about-menu-exit",
        run: () => exitAnim ?? null,
      },
    ]);
  }, [menuPhase, leaving, ghostProject, finishBack]);

  // Subscribe ke orchestrator untuk menjalankan WAAPI menu keluar (jika dipicu phase eksternal).
  useEffect(() => {
    const unsubscribe = subscribeNavAnimation((phase: AnimationPhase) => {
      if (phase === "button-exit" && menuPhase === "idle") {
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
  }, [menuPhase]);

  // Navigasi setelah menu keluar dan card ghost sampai di posisinya.
  useEffect(() => {
    if (menuPhase === "dismissed" && cardLanded) {
      finishBack();
    }
  }, [menuPhase, cardLanded, finishBack]);

  // Back: scroll container About ke atas dulu jika user sedang berada di bawah.
  const handleBackHome = useCallback(() => {
    const scrollContainer = aboutScrollRef.current;

    if (!scrollContainer) {
      navigateBack();
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion || scrollContainer.scrollTop <= 4) {
      navigateBack();
      return;
    }

    const clearScrollWait = () => {
      if (scrollFallbackRef.current) {
        clearTimeout(scrollFallbackRef.current);
        scrollFallbackRef.current = null;
      }

      scrollCleanupRef.current?.();
      scrollCleanupRef.current = null;
    };

    const onScrollEnd = () => {
      clearScrollWait();
      navigateBack();
    };

    if ("onscrollend" in scrollContainer) {
      scrollContainer.addEventListener("scrollend", onScrollEnd, {
        once: true,
      });

      scrollCleanupRef.current = () => {
        scrollContainer.removeEventListener("scrollend", onScrollEnd);
      };

      // Fallback kalau scrollend tidak fire.
      scrollFallbackRef.current = setTimeout(() => {
        clearScrollWait();
        navigateBack();
      }, 1000);
    } else {
      scrollFallbackRef.current = setTimeout(() => {
        clearScrollWait();
        navigateBack();
      }, 700);
    }

    scrollContainer.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [navigateBack]);

  return (
    <main
      id="top"
      className="bg-surface text-foreground fixed inset-0 h-dvh w-full overflow-hidden"
    >
      <div className="fixed top-5 right-5 z-50">
        <ThemeCta />
      </div>

      {/* Internal About scroll viewport */}
      <div
        ref={aboutScrollRef}
        className={[
          "absolute inset-0",
          "overflow-x-clip overflow-y-auto",
          "overscroll-y-contain",
          "touch-pan-y",
          "scrollbar-none",
          "px-6 sm:px-10 lg:px-48",
          isTransitioning ? "overflow-y-hidden" : "",
        ].join(" ")}
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorY: "contain",
        }}
      >
        {/* Main content */}
        <div className="relative mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-8 sm:gap-10 md:grid-cols-[1fr_0.95fr] md:gap-10 lg:gap-20">
          {/* Left: first screen + About text */}
          <section className="relative z-30 flex w-full flex-col items-center md:z-10 md:items-start">
            {/* First screen — mobile mengikuti layout Home/Hero */}
            <div className="flex min-h-[100svh] w-full items-center md:flex-col md:items-start md:justify-center">
              <div className="grid w-full grid-cols-1 items-center gap-2 pt-8 pb-4 md:block md:py-0">
                {/* Identity + menu */}
                <div className="w-full text-center md:text-left">
                  <IdentityHeading />

                  {/* Mobile fixed positioning, desktop normal positioning */}
                  <div
                    className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 md:relative md:bottom-auto md:left-auto md:z-auto md:translate-x-0"
                    style={{
                      paddingBottom: "env(safe-area-inset-bottom, 0px)",
                    }}
                  >
                    {/* Wrapper koreografi asli */}
                    <div
                      className={
                        menuPhase === "dismissed"
                          ? "pointer-events-none -translate-x-[200vw]"
                          : menuPhase === "exiting"
                            ? "pointer-events-none"
                            : coldEnter
                              ? "cold-in-right"
                              : ""
                      }
                    >
                      <div
                        ref={menuRef}
                        className="mt-0 flex items-center justify-center gap-2 md:mt-12 md:justify-start"
                      >
                        <MenuButton
                          defaultOpen
                          onMainClick={handleBackHome}
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
                </div>

                {/* Mobile: FlipCard interaktif */}
                <div className="mt-4 flex w-full flex-col items-center justify-center md:hidden">
                  <div
                    className={[
                      "w-full",
                      showFlipcardEnter ? "flipcard-enter" : "opacity-0",
                      leaving ? "flipcard-exit" : "",
                    ].join(" ")}
                  >
                    <FlipCard
                      front={
                        <div className="relative h-full w-full overflow-hidden rounded-[22px]">
                          <img
                            src={
                              resolvedTheme === "dark"
                                ? "/projects/front1-mobile.webp"
                                : "/projects/front2-mobile.webp"
                            }
                            alt="Front preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      }
                      back={
                        <div className="bg-foreground relative h-full w-full overflow-hidden rounded-[22px]">
                          <img
                            src={
                              resolvedTheme === "dark"
                                ? "/projects/back1-mobile.webp"
                                : "/projects/back2-mobile.webp"
                            }
                            alt="Back preview"
                            className="h-full w-full object-contain"
                          />
                        </div>
                      }
                      axis="x"
                      width={436}
                      height={296}
                      radius={22}
                      background={
                        resolvedTheme === "dark" ? "#1f1f1f" : "#e9e9e7"
                      }
                      color={resolvedTheme === "dark" ? "#ededed" : "#171717"}
                      shadow
                      glare
                      hoverScale={1.02}
                    />

                    <p className="text-muted mt-4 text-center text-xs md:hidden">
                      Tap the card
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Teks About — nge-peek sebagai petunjuk scroll */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={leaving ? { opacity: 0, y: -40 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="-mt-[42px] w-full pb-24 md:-mt-[54px] md:w-[125%] lg:w-[120%]"
            >
              <div
                className="font-regular text-xl sm:text-2xl md:text-3xl lg:text-3xl [&_em]:italic [&_strong]:font-semibold"
                dangerouslySetInnerHTML={{
                  __html: about.intro,
                }}
              />
              <div className="mt-10">
                <p className="font-regular text-sm">Worked with:</p>
                <ul className="font-regular text-muted mt-3 flex flex-col gap-1 text-xl sm:text-2xl md:text-2xl lg:text-3xl">
                  {about.collaborations.map((collab) => (
                    <li key={collab.slug}>
                      {collab.href ? (
                        <a
                          href={collab.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cursor-pointer transition-colors"
                          style={
                            collab.hoverColor
                              ? ({
                                  "--hover-color": collab.hoverColor,
                                } as React.CSSProperties)
                              : undefined
                          }
                          onMouseEnter={(e) => {
                            if (collab.hoverColor) {
                              e.currentTarget.style.color = collab.hoverColor;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (collab.hoverColor) {
                              e.currentTarget.style.color = "";
                            }
                          }}
                        >
                          {collab.name}
                        </a>
                      ) : (
                        <span className="text-muted cursor-default select-none">
                          {collab.name}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className="font-regular mt-10 text-xl sm:text-2xl md:text-2xl lg:text-3xl [&_em]:italic [&_strong]:font-semibold"
                dangerouslySetInnerHTML={{
                  __html: about.closing,
                }}
              />

              <div
                className="mt-16 text-xs [&_em]:italic [&_strong]:font-semibold"
                dangerouslySetInnerHTML={{
                  __html: about.footer,
                }}
              />
            </motion.div>

            {/* Fade mobile — lebih pendek, tetap menempel di bawah viewport */}
            <div
              aria-hidden="true"
              className="from-surface via-surface/80 pointer-events-none fixed inset-x-0 bottom-0 z-40 h-20 bg-gradient-to-t to-transparent md:hidden"
            />

            {/* Fade desktop — fixed di bawah viewport, panel kiri */}
            <div
              aria-hidden="true"
              className="from-surface pointer-events-none fixed inset-x-0 bottom-0 z-20 hidden h-24 bg-gradient-to-t to-transparent md:block"
            />
          </section>

          {/* Right: Lanyard sticky */}
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
                  interactive
                  size={0.6}
                />
              </motion.div>

              {/* Disabled EnterCard to prevent ghost card double animation */}
              {/* {leaving && ghostProject && isDesktop && (
                <EnterCard
                  project={ghostProject}
                  onReady={() => setCardLanded(true)}
                  carouselCenterY={carouselBounds?.centerY}
                />
              )} */}
            </div>
          </section>
        </div>

        {/* Mobile: kertas di bawah konten */}
        <div className="mx-auto w-full max-w-[1440px] px-4 pb-24 md:hidden">
          <div className="relative mx-auto w-full max-w-[270px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.5,
                ease: [0.33, 1, 0.68, 1],
              }}
            >
              <PaperCrumple
                src={about.paperImage}
                alt="Sidsneaks"
                width={270}
                height={450}
                disabled
                detail={32}
                style={{
                  height: "auto",
                  width: "100%",
                  maxWidth: "270px",
                }}
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
      </div>
    </main>
  );
}
