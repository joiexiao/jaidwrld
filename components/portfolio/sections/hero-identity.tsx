"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { MailPen, UserRoundSearch, X } from "lucide-react";

import PortfolioButton from "@/components/ui/PortfolioButton";
import MenuButton from "@/components/ui/menu-button";
import { contactOptions } from "@/content/contact";
import IdentityHeading from "@/components/portfolio/identity-heading";

import { isPhaseAtLeast, useIntro } from "@/components/portfolio/intro";

import {
  clearNavIntent,
  peekNavIntent,
  setNavIntent,
  BUTTON_EXIT_DURATION,
  CAROUSEL_EXIT_DURATION,
  subscribeNavAnimation,
  orchestrateExitToAbout,
  type AnimationPhase,
} from "@/components/portfolio/nav-intent";

type HeroIdentityProps = {
  /** Buka halaman About (menggantikan aksi card). */
  onOpenAbout: () => void;

  /** Kontrol visibility tombol saat kembali dari About. */
  showActions?: boolean;
};

// Gaya muncul tombol mengikuti menu-button: fade + slide dari kiri + stagger.
const groupVariants: Variants = {
  hidden: {
    transition: { staggerChildren: 0.08, staggerDirection: -1 },
  },
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -24, scale: 0.92 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Durasi slide keluar kedua tombol sebelum navigasi.
const ACTIONS_OUT_MS = BUTTON_EXIT_DURATION;

// Transition layout untuk perpindahan posisi button (hanya aktif di mobile).
const openLayoutTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 28,
  mass: 1,
};

const closeLayoutTransition = {
  type: "spring" as const,
  stiffness: 260,
  damping: 32,
  mass: 1,
};

// Panel kiri home: identitas.
export default function HeroIdentity({
  onOpenAbout,
  showActions = true,
}: HeroIdentityProps) {
  const { phase, active, advance } = useIntro();

  const showButtons = isPhaseAtLeast(phase, "chrome") && showActions;

  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Koreografi slide home ⇄ About untuk kedua tombol panel kiri.
  const [actionsPhase, setActionsPhase] = useState<
    "idle" | "exiting" | "dismissed"
  >("idle");

  const [coldReturn] = useState(() => peekNavIntent() === "home-cold");

  const actionsRef = useRef<HTMLDivElement>(null);

  // Snapshot status menu saat interaksi dimulai.
  const menuWasOpenRef = useRef(false);

  // Mencegah navigasi About berulang.
  const navStartedRef = useRef(false);

  // Intent sekali pakai.
  useEffect(() => {
    clearNavIntent();
  }, []);

  // Jalur dingin: tandai dulu supaya menu About meluncur masuk.
  const navigateCold = useCallback(() => {
    setNavIntent("about-cold");
    onOpenAbout();
  }, [onOpenAbout]);

  // Subscribe ke animation phase untuk menjalankan WAAPI saat button-exit.
  useEffect(() => {
    const unsubscribe = subscribeNavAnimation((phase: AnimationPhase) => {
      if (phase === "button-exit") {
        const node = actionsRef.current;

        if (!node) return;

        const out = node.animate(
          [
            { opacity: 1, transform: "translateX(0px)" },
            { opacity: 0, transform: "translateX(-56px)" },
          ],
          {
            duration: BUTTON_EXIT_DURATION,
            easing: "cubic-bezier(0.45, 0, 0.55, 1)",
            fill: "forwards",
          },
        );

        out.finished.then(
          () => setActionsPhase("dismissed"),
          () => {},
        );
      }
    });

    return unsubscribe;
  }, []);

  const handleAboutClick = useCallback(() => {
    if (navStartedRef.current || actionsPhase !== "idle") return;

    // Menu terbuka saat interaksi dimulai.
    const wasMenuOpen = menuOpen || menuWasOpenRef.current;

    menuWasOpenRef.current = false;

    if (wasMenuOpen) {
      navStartedRef.current = true;
      setActionsPhase("exiting");

      orchestrateExitToAbout(() => {
        setActionsPhase("dismissed");
        navigateCold();
      });

      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      setActionsPhase("dismissed");
      navigateCold();
      return;
    }

    // Jalur dingin: trigger orchestrator untuk sinkronisasi animasi.
    navStartedRef.current = true;
    setActionsPhase("exiting");

    orchestrateExitToAbout(() => {
      setActionsPhase("dismissed");
      navigateCold();
    });
  }, [actionsPhase, menuOpen, navigateCold]);

  return (
    <div className="relative flex w-full flex-col items-center text-center md:items-start md:text-left">
      <Link
        href="#top"
        className="text-muted mb-10 hidden text-[10px] font-medium tracking-[0.28em] uppercase"
      >
        JAIDWRLD
      </Link>

      <IdentityHeading />

      {/* Wrapper positioning */}
      <div className="fixed inset-x-0 bottom-6 z-40 flex w-full justify-center md:relative md:inset-auto md:z-auto md:block md:w-auto">
        {/* Wrapper koreografi */}
        <div
          className={
            actionsPhase === "dismissed"
              ? "pointer-events-none -translate-x-[200vw]"
              : actionsPhase === "exiting"
                ? "pointer-events-none"
                : coldReturn
                  ? "cold-in-left"
                  : undefined
          }
        >
          {/* Button group dengan layout animation */}
          <motion.div
            ref={actionsRef}
            layout={isMobile ? "position" : false}
            layoutDependency={menuOpen}
            className="mt-0 flex items-center gap-2 md:mt-12"
            initial={active ? "hidden" : false}
            animate={showButtons ? "visible" : "hidden"}
            variants={groupVariants}
            transition={{
              layout: menuOpen ? openLayoutTransition : closeLayoutTransition,
            }}
          >
            {/* Icon only — buka halaman About */}
            <motion.div
              layout={isMobile ? "position" : false}
              layoutDependency={menuOpen}
              transition={{
                layout: menuOpen ? openLayoutTransition : closeLayoutTransition,
              }}
              variants={itemVariants}
              onPointerDownCapture={() => {
                menuWasOpenRef.current = menuOpen;
              }}
            >
              <PortfolioButton
                text={false}
                icon={UserRoundSearch}
                aria-label="About"
                onClick={handleAboutClick}
              />
            </motion.div>

            {/* Contact MenuButton */}
            <motion.div
              layout={isMobile ? "position" : false}
              layoutDependency={menuOpen}
              transition={{
                layout: menuOpen ? openLayoutTransition : closeLayoutTransition,
              }}
              variants={itemVariants}
              onAnimationComplete={(definition) => {
                if (definition === "visible") {
                  advance("chrome");
                }
              }}
            >
              <MenuButton
                triggerIcon={MailPen}
                activeIcon={X}
                triggerLabel="Contact"
                options={contactOptions}
                open={menuOpen}
                onOpenChange={setMenuOpen}
                viewTransitionName="contact-menu"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
