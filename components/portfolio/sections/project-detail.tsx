"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  ViewTransition,
} from "react";
import { flushSync } from "react-dom";

import { useRouter } from "next/navigation";

import { ArrowLeft, ExternalLink, Images, TextInitial } from "lucide-react";

import { motion, type AnimationDefinition, type Variants } from "framer-motion";

import type { CSSProperties } from "react";

import PortfolioButton from "@/components/ui/PortfolioButton";

import ProjectGallery, {
  type ProjectGalleryHandle,
} from "@/components/portfolio/sections/project-gallery";

import ThemeCta from "@/components/ui/theme-cta";

import { useProjectSelection } from "@/components/portfolio/project-selection";

import {
  clearTransitionContext,
  orchestrateExitToHome,
} from "@/components/portfolio/nav-intent";

import type { Project } from "@/types/project";

type ProjectDetailProps = {
  project: Project;
};

const BACK_BUTTON_ENTER_DURATION = 1;
const BACK_BUTTON_EXIT_DURATION = 1;

const BACK_BUTTON_EASE = [0.16, 1, 0.3, 1] as const;

const GALLERY_COMMIT_FALLBACK_MS = 500;
const VIEW_TRANSITION_FALLBACK_MS = 1000;
const TEXT_EXIT_FALLBACK_MS = 1200;
const BACK_BUTTON_EXIT_FALLBACK_MS = 1300;
const SCROLL_FALLBACK_MS = 1400;

const SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
  "Spacebar",
]);

const infoContainerVariants: Variants = {
  hidden: {},

  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },

  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
      delayChildren: 0,
    },
  },
};

const infoItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
  },

  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.48,
      ease: [0.25, 0.8, 0.25, 1],
    },
  },

  exit: {
    opacity: 0,
    y: 34,
    transition: {
      duration: 0.24,
      ease: [0.4, 0, 0.6, 1],
    },
  },
};

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

/**
 * Memberi batas waktu pada sebuah Promise.
 * Timer dibersihkan ketika Promise selesai lebih awal.
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T | undefined> {
  let timeoutId: number | undefined;

  const timeoutPromise = new Promise<undefined>((resolve) => {
    timeoutId = window.setTimeout(() => {
      resolve(undefined);
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  });
}

export default function ProjectDetail({ project }: ProjectDetailProps) {
  const router = useRouter();
  const { setActiveSlug } = useProjectSelection();

  const [view, setView] = useState<"gallery" | "detail">("gallery");
  const [exiting, setExiting] = useState(false);

  const [, startTransition] = useTransition();

  const stageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLDivElement>(null);

  const projectGalleryRef = useRef<ProjectGalleryHandle>(null);

  const exitingRef = useRef(false);
  const backSequencePendingRef = useRef(false);
  const mountedRef = useRef(true);

  // Mengontrol input selama seluruh proses Back.
  const backInputUnlockRef = useRef<(() => void) | null>(null);

  const exitTextResolveRef = useRef<(() => void) | null>(null);
  const completedExitInfoItemsRef = useRef(new Set<string>());

  const galleryCommitResolveRef = useRef<(() => void) | null>(null);
  const galleryCommitPendingRef = useRef(false);

  useEffect(() => {
    setActiveSlug(project.slug);
  }, [project.slug, setActiveSlug]);

  useEffect(() => {
    clearTransitionContext();
  }, []);

  useEffect(() => {
    router.prefetch("/");
  }, [router]);

  /**
   * Cleanup ketika component meninggalkan halaman.
   */
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      galleryCommitPendingRef.current = false;

      galleryCommitResolveRef.current?.();
      galleryCommitResolveRef.current = null;

      projectGalleryRef.current?.cancelScroll();

      exitTextResolveRef.current?.();
      exitTextResolveRef.current = null;

      backInputUnlockRef.current?.();
      backInputUnlockRef.current = null;
    };
  }, []);

  const hasLive = project.links.some(
    (link) => link.label.toLowerCase() === "live",
  );

  /* -----------------------------------------------------------------------
     Lock scroll input
  ----------------------------------------------------------------------- */

  const lockBackInput = useCallback(() => {
    if (backInputUnlockRef.current) {
      return;
    }

    const scroller = scrollRef.current;
    const root = document.documentElement;

    const previousOverflowY = scroller?.style.overflowY ?? "";
    const previousScrollerBehavior = scroller?.style.scrollBehavior ?? "";
    const previousRootBehavior = root.style.scrollBehavior;

    if (scroller) {
      // ScrollTop tetap dapat diubah secara programatis oleh GSAP.
      scroller.style.overflowY = "hidden";
      scroller.style.scrollBehavior = "auto";
    }

    root.style.scrollBehavior = "auto";

    const preventScroll = (event: Event) => {
      if (event.cancelable) {
        event.preventDefault();
      }
    };

    const preventScrollKeys = (event: KeyboardEvent) => {
      if (!SCROLL_KEYS.has(event.key)) {
        return;
      }

      const target = event.target;

      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.matches("input, textarea, select, [contenteditable='true']"))
      ) {
        return;
      }

      event.preventDefault();
    };

    window.addEventListener("wheel", preventScroll, {
      capture: true,
      passive: false,
    });

    window.addEventListener("touchmove", preventScroll, {
      capture: true,
      passive: false,
    });

    window.addEventListener("keydown", preventScrollKeys, true);

    let released = false;

    const unlock = () => {
      if (released) {
        return;
      }

      released = true;

      window.removeEventListener("wheel", preventScroll, true);
      window.removeEventListener("touchmove", preventScroll, true);
      window.removeEventListener("keydown", preventScrollKeys, true);

      if (scroller) {
        scroller.style.overflowY = previousOverflowY;
        scroller.style.scrollBehavior = previousScrollerBehavior;
      }

      root.style.scrollBehavior = previousRootBehavior;

      if (backInputUnlockRef.current === unlock) {
        backInputUnlockRef.current = null;
      }
    };

    backInputUnlockRef.current = unlock;
  }, []);

  /* -----------------------------------------------------------------------
     Safe auto-scroll
  ----------------------------------------------------------------------- */

  const scrollToFirstCardSafely = useCallback(async (smooth: boolean) => {
    const gallery = projectGalleryRef.current;

    if (!gallery) {
      return;
    }

    const scrollPromise = gallery
      .scrollToFirstCard({ smooth })
      .then(() => true);

    const completed = await withTimeout(scrollPromise, SCROLL_FALLBACK_MS);

    if (completed === true) {
      return;
    }

    // Fallback jika tween scroll tidak selesai.
    gallery.cancelScroll();

    if (!mountedRef.current || exitingRef.current) {
      return;
    }

    await gallery.scrollToFirstCard({ smooth: false });
  }, []);

  /* -----------------------------------------------------------------------
     Wait for Gallery DOM/layout commit
  ----------------------------------------------------------------------- */

  useLayoutEffect(() => {
    if (view !== "gallery" || !galleryCommitPendingRef.current) {
      return;
    }

    galleryCommitPendingRef.current = false;
    galleryCommitResolveRef.current?.();
    galleryCommitResolveRef.current = null;
  }, [view]);

  const switchToGalleryAndWait = useCallback(async () => {
    const galleryCommitPromise = new Promise<void>((resolve) => {
      galleryCommitPendingRef.current = true;
      galleryCommitResolveRef.current = resolve;
    });

    // Commit sinkron agar Gallery siap sebelum extra-card exit dimulai.
    flushSync(() => {
      setView("gallery");
    });

    const committed = await withTimeout(
      galleryCommitPromise.then(() => true),
      GALLERY_COMMIT_FALLBACK_MS,
    );

    if (committed !== true) {
      await nextFrame();
    }
  }, []);

  /* -----------------------------------------------------------------------
     Track completion animasi exit informasi.
  ----------------------------------------------------------------------- */

  const handleInfoItemAnimationComplete = useCallback(
    (itemId: string, definition: AnimationDefinition) => {
      if (definition !== "exit" || !exitingRef.current) {
        return;
      }

      const completedItems = completedExitInfoItemsRef.current;

      completedItems.add(itemId);

      if (completedItems.size >= 4) {
        exitTextResolveRef.current?.();
        exitTextResolveRef.current = null;
      }
    },
    [],
  );

  /* -----------------------------------------------------------------------
     Memulai exit transition menuju Home.

     Animasi tombol menggunakan CSS translate property,
     agar tidak bentrok dengan transform milik Framer Motion.
  ----------------------------------------------------------------------- */

  const startBackExit = useCallback(() => {
    if (exitingRef.current) {
      return;
    }

    exitingRef.current = true;
    setExiting(true);

    // Tidak boleh ada tween scroll yang tertinggal.
    projectGalleryRef.current?.cancelScroll();

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Biarkan orchestrator mengatur intent dan navigasi,
    // termasuk ketika prefers-reduced-motion aktif.
    if (reduceMotion) {
      void orchestrateExitToHome(
        () =>
          router.push("/", {
            transitionTypes: ["project-close"],
          }),
        [],
        [],
        "project",
      );

      return;
    }

    completedExitInfoItemsRef.current.clear();

    const textExitPromise = new Promise<void>((resolve) => {
      exitTextResolveRef.current = resolve;
    });

    const boundedTextExit = withTimeout(
      textExitPromise,
      TEXT_EXIT_FALLBACK_MS,
    ).then(() => undefined);

    /**
     * Animasi tombol Back.
     * Gunakan translate, bukan transform, karena elemen ini
     * juga dikontrol oleh Framer Motion.
     */
    let boundedButtonExit: Promise<void> = Promise.resolve();

    const backNode = backButtonRef.current;

    if (backNode) {
      try {
        const animation = backNode.animate(
          [
            {
              opacity: 1,
              translate: "0px 0px",
            },
            {
              opacity: 1,
              translate: "80px 0px",
            },
          ],
          {
            duration: BACK_BUTTON_EXIT_DURATION * 1000,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            fill: "forwards",
          },
        );

        boundedButtonExit = withTimeout(
          animation.finished.then(
            () => undefined,
            () => undefined,
          ),
          BACK_BUTTON_EXIT_FALLBACK_MS,
        ).then(() => undefined);
      } catch (error) {
        console.error("Back button exit animation failed:", error);
      }
    }

    /**
     * Navigator menunggu kedua animasi:
     * - Exit teks informasi.
     * - Exit tombol Back.
     *
     * Jadi halaman tidak berpindah saat tombol masih bergerak.
     */
    void orchestrateExitToHome(
      () =>
        router.push("/", {
          transitionTypes: ["project-close"],
        }),
      [],
      [boundedTextExit, boundedButtonExit],
      "project",
    );
  }, [router]);

  /**
   * Menunggu animasi React View Transition yang masih aktif.
   */
  const waitForViewTransition = useCallback(async () => {
    await nextFrame();
    await nextFrame();

    const transitionAnimations = document
      .getAnimations()
      .filter((animation) => {
        const effect = animation.effect;

        if (!(effect instanceof KeyframeEffect)) {
          return false;
        }

        const pseudoElement = effect.pseudoElement;

        return (
          typeof pseudoElement === "string" &&
          pseudoElement.startsWith("::view-transition") &&
          animation.playState !== "finished" &&
          animation.playState !== "idle"
        );
      });

    if (transitionAnimations.length > 0) {
      await withTimeout(
        Promise.all(
          transitionAnimations.map((animation) =>
            animation.finished.then(
              () => undefined,
              () => undefined,
            ),
          ),
        ),
        VIEW_TRANSITION_FALLBACK_MS,
      );
    }

    await nextFrame();
  }, []);

  /* -----------------------------------------------------------------------
     Back sequence

     Gallery view:
     1. Extra cards exit ke bawah.
     2. Auto-scroll ke first gallery card berjalan bersamaan.
     3. Setelah keduanya selesai, card morph + panel exit mulai bersama.

     Detail view:
     1. Auto-scroll ke first detail card.
     2. Switch ke Gallery.
     3. Extra cards exit sambil first gallery card disejajarkan.
     4. Card morph + panel exit mulai bersama.
  ----------------------------------------------------------------------- */

  const handleBack = useCallback(async () => {
    if (exitingRef.current || backSequencePendingRef.current) {
      return;
    }

    backSequencePendingRef.current = true;
    lockBackInput();

    try {
      if (view === "detail") {
        // Pertama, sejajarkan konten Detail agar handoff ke Gallery akurat.
        await scrollToFirstCardSafely(true);

        if (exitingRef.current || !mountedRef.current) {
          return;
        }

        // Pastikan Gallery ter-render sebelum meminta extra cards keluar.
        await switchToGalleryAndWait();
      }

      if (exitingRef.current || !mountedRef.current) {
        return;
      }

      const gallery = projectGalleryRef.current;

      // Extra cards turun dan menghilang bersamaan dengan auto-scroll.
      const extrasExitPromise = gallery
        ? gallery.animateExtraCardsOut()
        : Promise.resolve();

      const scrollPromise = scrollToFirstCardSafely(true);

      await Promise.all([extrasExitPromise, scrollPromise]);

      if (exitingRef.current || !mountedRef.current) {
        return;
      }

      backSequencePendingRef.current = false;
      startBackExit();
    } catch (error) {
      console.error("Back sequence failed:", error);

      projectGalleryRef.current?.cancelScroll();

      if (mountedRef.current && !exitingRef.current) {
        backSequencePendingRef.current = false;
        backInputUnlockRef.current?.();
        backInputUnlockRef.current = null;
      }
    } finally {
      if (!exitingRef.current) {
        backSequencePendingRef.current = false;
      }
    }
  }, [
    view,
    lockBackInput,
    scrollToFirstCardSafely,
    switchToGalleryAndWait,
    startBackExit,
  ]);

  /* -----------------------------------------------------------------------
     Toggle Gallery / Detail
  ----------------------------------------------------------------------- */

  const handleToggleView = useCallback(() => {
    if (exitingRef.current || backSequencePendingRef.current) {
      return;
    }

    projectGalleryRef.current?.cancelScroll();

    startTransition(() => {
      setView((current) => (current === "gallery" ? "detail" : "gallery"));
    });
  }, [startTransition]);

  /* -----------------------------------------------------------------------
     Live Preview
  ----------------------------------------------------------------------- */

  const handleLivePreview = useCallback(() => {
    if (exitingRef.current || backSequencePendingRef.current) {
      return;
    }

    const live = project.links.find(
      (link) => link.label.toLowerCase() === "live",
    );

    if (!live?.href || live.href === "#") {
      return;
    }

    window.open(live.href, "_blank", "noopener,noreferrer");
  }, [project]);

  /* -----------------------------------------------------------------------
     Keyboard / outside click
  ----------------------------------------------------------------------- */

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        void handleBack();
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;

      if (!target) {
        return;
      }

      if (stageRef.current?.contains(target)) {
        return;
      }

      if (target.closest("[data-detail-chrome]")) {
        return;
      }

      void handleBack();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [handleBack]);

  /* -----------------------------------------------------------------------
     Desktop scrolling
  ----------------------------------------------------------------------- */

  useEffect(() => {
    const isDesktop = () => window.matchMedia("(min-width: 768px)").matches;

    const canScroll = (element: HTMLElement) =>
      element.scrollHeight > element.clientHeight;

    const handleWheel = (event: WheelEvent) => {
      const scroller = scrollRef.current;

      if (backSequencePendingRef.current || exitingRef.current) {
        return;
      }

      if (!scroller || event.ctrlKey) {
        return;
      }

      if (!isDesktop() || !canScroll(scroller)) {
        return;
      }

      if (scroller.contains(event.target as Node)) {
        return;
      }

      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        return;
      }

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

      if (backSequencePendingRef.current || exitingRef.current) {
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (!scroller || !isDesktop() || !canScroll(scroller)) {
        return;
      }

      if (scroller.contains(event.target as Node)) {
        return;
      }

      const active = document.activeElement as HTMLElement | null;

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

    document.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("wheel", handleWheel);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toggleIcon = view === "gallery" ? TextInitial : Images;
  const toggleLabel = view === "gallery" ? "Detail" : "Gallery";

  // Nama View Transition selalu tersedia: new snapshot dipakai saat expanded,
  // old snapshot dipakai saat collapsed. Keduanya memakai satu timeline CSS.
  const infoCategoryStyle: CSSProperties = {
    viewTransitionName: "project-info-category",
  };

  const infoTitleStyle: CSSProperties = {
    viewTransitionName: "project-info-title",
  };

  const infoRoleStyle: CSSProperties = {
    viewTransitionName: "project-info-role",
  };

  const infoActionsStyle: CSSProperties = {
    viewTransitionName: "project-info-actions",
  };

  const backButtonStyle: CSSProperties = {
    viewTransitionName: "project-back-button",
  };

  const mobileDockStyle: CSSProperties = {
    viewTransitionName: "project-mobile-dock",
  };

  return (
    <main
      id="top"
      className="bg-surface text-foreground relative min-h-[100svh] w-full overflow-x-clip pr-4 pl-6 sm:pr-6 sm:pl-10 md:h-[100svh] md:overflow-hidden lg:pr-12 lg:pl-48"
    >
      <div data-detail-chrome className="fixed top-5 right-5 z-50">
        <ThemeCta />
      </div>

      <div
        ref={stageRef}
        className="relative mr-0 ml-auto grid w-full max-w-[1600px] grid-cols-1 items-stretch gap-0 md:h-full md:grid-cols-[0.85fr_1.15fr] md:grid-rows-1 md:gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20"
      >
        {/* Left: project information */}
        <section className="relative z-0 flex w-full flex-col items-start py-16 md:justify-center md:py-24">
          {/* Desktop Back button */}
          <div className="absolute top-1/2 right-0 hidden translate-x-[calc(100%+0.75rem)] -translate-y-1/2 md:block lg:translate-x-[calc(100%+1rem)]">
            <motion.div
              ref={backButtonRef}
              initial={{ x: 80 }}
              animate={{ x: 0 }}
              transition={{
                duration: BACK_BUTTON_ENTER_DURATION,
                ease: BACK_BUTTON_EASE,
              }}
              className="relative"
            >
              <PortfolioButton
                text={false}
                icon={ArrowLeft}
                aria-label="Kembali"
                onClick={handleBack}
              />
            </motion.div>
          </div>

          <ViewTransition name="project-info" share="auto" default="none">
            <div className="w-full">
              <motion.div
                initial="hidden"
                animate={exiting ? "exit" : "visible"}
                variants={infoContainerVariants}
              >
                <motion.div
                  variants={infoItemVariants}
                  onAnimationComplete={(definition) =>
                    handleInfoItemAnimationComplete("category", definition)
                  }
                  className="text-muted mb-4 flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase"
                >
                  {project.category} — {project.year}
                </motion.div>

                <motion.h1
                  variants={infoItemVariants}
                  onAnimationComplete={(definition) =>
                    handleInfoItemAnimationComplete("title", definition)
                  }
                  className="font-regular text-2xl sm:text-3xl md:text-4xl lg:text-4xl"
                >
                  {project.name}
                </motion.h1>

                <motion.p
                  variants={infoItemVariants}
                  onAnimationComplete={(definition) =>
                    handleInfoItemAnimationComplete("role", definition)
                  }
                  className="font-regular text-muted text-2xl sm:text-3xl md:text-4xl lg:text-4xl"
                >
                  {project.role}
                </motion.p>

                {/* Desktop actions */}
                <motion.div
                  variants={infoItemVariants}
                  onAnimationComplete={(definition) =>
                    handleInfoItemAnimationComplete("actions", definition)
                  }
                  className="mt-12 hidden items-center gap-2 md:flex"
                >
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
                </motion.div>
              </motion.div>
            </div>
          </ViewTransition>
        </section>

        {/* Right: gallery */}
        <section className="relative z-20 w-full md:h-full md:min-h-0">
          <motion.div
            ref={scrollRef}
            layoutScroll
            className="project-gallery-scroll w-full md:h-full md:min-h-0 md:[scrollbar-width:none] md:overflow-y-auto md:overscroll-contain md:[&::-webkit-scrollbar]:hidden"
          >
            <ProjectGallery
              ref={projectGalleryRef}
              project={project}
              view={view}
              onToggleView={handleToggleView}
            />
          </motion.div>
        </section>
      </div>

      {/* Mobile dock */}
      <motion.div
        data-detail-chrome
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-2 px-4 py-3 md:hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={exiting ? { opacity: 0, y: 34 } : { opacity: 1, y: 0 }}
        transition={{
          duration: exiting ? 0.24 : 0.48,
          ease: exiting ? [0.4, 0, 0.6, 1] : [0.25, 0.8, 0.25, 1],
        }}
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
      </motion.div>
    </main>
  );
}