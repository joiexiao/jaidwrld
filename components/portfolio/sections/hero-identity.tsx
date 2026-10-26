"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LayoutGroup, motion, type Variants } from "framer-motion";
import { MailPen, UserRoundSearch, X } from "lucide-react";

import PortfolioButton from "@/components/ui/PortfolioButton";
import MenuButton from "@/components/ui/menu-button";
import { contactOptions } from "@/content/contact";
import IdentityHeading from "@/components/portfolio/identity-heading";

import { isPhaseAtLeast, useIntro } from "@/components/portfolio/intro";

import {
  clearTransitionContext,
  peekTransitionContext,
  BUTTON_EXIT_DURATION,
  orchestrateExitToAbout,
  type ExitAnimation,
} from "@/components/portfolio/nav-intent";

type HeroIdentityProps = {
  /** Buka halaman About (menggantikan aksi card). */
  onOpenAbout: () => void;

  /** Kontrol visibility tombol saat kembali dari About. */
  showActions?: boolean;
};

// Gaya muncul tombol: fade + slide dari kiri + stagger.
const groupVariants: Variants = {
  hidden: {
    transition: {
      staggerChildren: 0.08,
      staggerDirection: -1,
    },
  },

  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -24,
    scale: 0.92,
  },

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

const coldReturnItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 0,
    scale: 1,
  },

  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0,
    },
  },
};

// Spring untuk perpindahan layout khusus mobile.
const layoutTransition = {
  type: "spring" as const,
  stiffness: 150,
  damping: 20,
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
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();

    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Koreografi slide home ⇄ About untuk kedua tombol panel kiri.
  const [actionsPhase, setActionsPhase] = useState<
    "idle" | "exiting" | "dismissed"
  >("idle");

  const [coldReturn] = useState(
    () => peekTransitionContext()?.intent === "home-cold",
  );

  const actionsRef = useRef<HTMLDivElement>(null);

  // Snapshot status menu saat interaksi dimulai.
  const menuWasOpenRef = useRef(false);

  // Mencegah navigasi About berulang.
  const navStartedRef = useRef(false);

  // Intent sekali pakai.
  useEffect(() => {
    clearTransitionContext();
  }, []);

  /**
   * Navigasi dilakukan setelah coordinator menyelesaikan exit animation.
   * State dismissed diset sebelum route navigation.
   */
  const navigateCold = useCallback(() => {
    setActionsPhase("dismissed");
    onOpenAbout();
  }, [onOpenAbout]);

  const handleAboutClick = useCallback(() => {
    /**
     * Abaikan klik kedua ketika transisi sudah dimulai.
     */
    if (navStartedRef.current || actionsPhase !== "idle") {
      return;
    }

    // Reset snapshot menu setelah dipakai untuk deteksi state awal.
    menuWasOpenRef.current = false;

    const node = actionsRef.current;

    /**
     * Exit animation didaftarkan sebagai ExitAnimation.
     *
     * Jangan membuat Animation instance di luar coordinator.
     * Coordinator akan memanggil run(), lalu menunggu animation.finished.
     */
    const exitAnimations: ExitAnimation[] = node
      ? [
          {
            name: "button-exit",

            run: () => {
              const currentNode = actionsRef.current;

              if (!currentNode) {
                return null;
              }

              return currentNode.animate(
                [
                  {
                    opacity: 1,
                    transform: "translateX(0px)",
                  },
                  {
                    opacity: 0,
                    transform: "translateX(-56px)",
                  },
                ],
                {
                  duration: BUTTON_EXIT_DURATION,
                  easing: "cubic-bezier(0.45, 0, 0.55, 1)",
                  fill: "forwards",
                },
              );
            },
          },
        ]
      : [];

    navStartedRef.current = true;
    setActionsPhase("exiting");

    /**
     * Satu entry point ke navigation orchestrator untuk semua skenario
     * (About click saat menu tertutup / menu terbuka).
     *
     * Wrapper actionsRef membungkus seluruh grup actions (About button +
     * menu options), sehingga jalur ini meliputi:
     * - Menu tertutup -> exit animation hanya memproses About button.
     * - Menu terbuka  -> menu options ikut ter-exit bersama wrapper,
     *   lalu About button melanjutkan transisi menuju state About.
     *
     * Orchestrator menunggu completion seluruh registered exit animation
     * sebelum memanggil onNavigate, memenuhi prinsip exit-before-removal
     * dan mencegah animasi duplikat pada elemen yang sama.
     */
    orchestrateExitToAbout(() => {
      navigateCold();
    }, exitAnimations);
  }, [actionsPhase, navigateCold]);

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
          <LayoutGroup id="hero-identity-actions">
            {/* Parent menangani perpindahan layout grup di mobile */}
            <motion.div
              ref={actionsRef}
              layout={isMobile ? "position" : false}
              transition={{
                layout: layoutTransition,
              }}
              className="mt-0 flex items-center gap-2 md:mt-12"
              initial={active ? "hidden" : false}
              animate={showButtons ? "visible" : "hidden"}
              variants={groupVariants}
            >
              {/* Icon only — buka halaman About */}
              <motion.div
                data-menu-dismiss-ignore
                variants={coldReturn ? coldReturnItemVariants : itemVariants}
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
                variants={coldReturn ? coldReturnItemVariants : itemVariants}
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
          </LayoutGroup>
        </div>
      </div>
    </div>
  );
}
