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
  /** Buka halaman About. */
  onOpenAbout: () => void;

  /** Kontrol visibility tombol saat kembali dari About. */
  showActions?: boolean;

  /** Aktif ketika homepage sedang membuka halaman project. */
  projectExiting?: boolean;

  /** Dipanggil setelah heading dan tombol selesai keluar. */
  onProjectExitComplete?: () => void;
};

/** Animasi tombol saat intro homepage asli. */
const groupVariants: Variants = {
  hidden: {
    transition: {
      staggerChildren: 0,
      staggerDirection: -1,
    },
  },
  visible: {
    transition: {
      staggerChildren: 0,
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

/** Animasi tombol saat kembali dari halaman project. */
const coldReturnItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 0,
    y: 12,
    scale: 1,
  },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.8, 0.25, 1],
    },
  },
};

/** Animasi khusus tombol saat kembali dari About. */
const aboutReturnItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -56,
    y: 0,
    scale: 1,
  },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.48,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

/** Parent tidak menambahkan stagger saat tombol kembali. */
const coldReturnGroupVariants: Variants = {
  idle: {},
  hidden: {},
  visible: {},
  exit: {},
};

/** Animasi khusus transisi homepage ⇄ detail project. */
const projectTransitionItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 0,
    y: 18,
    scale: 1,
  },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.48,
      ease: [0.25, 0.8, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    x: 0,
    y: 34,
    scale: 1,
    transition: {
      duration: 0.24,
      ease: [0.4, 0, 0.6, 1],
    },
  },
};

const projectTransitionGroupVariants: Variants = {
  idle: {},
  hidden: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0,
      staggerDirection: -1,
    },
  },
};

/** Spring untuk perpindahan layout khusus mobile. */
const layoutTransition = {
  type: "spring" as const,
  stiffness: 150,
  damping: 20,
  mass: 1,
};

export default function HeroIdentity({
  onOpenAbout,
  showActions = true,
  projectExiting = false,
  onProjectExitComplete,
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

  const [actionsPhase, setActionsPhase] = useState<
    "idle" | "exiting" | "dismissed"
  >("idle");

  // Simpan intent sebelum context dibersihkan.
  const [returnIntent] = useState(
    () => peekTransitionContext()?.intent ?? null,
  );

  const isProjectReturn = returnIntent === "home-from-project";
  const isAboutReturn = returnIntent === "home-cold";

  const actionsRef = useRef<HTMLDivElement>(null);
  const menuWasOpenRef = useRef(false);
  const navStartedRef = useRef(false);

  /** Tracking penyelesaian animasi heading dan tombol. */
  const headingExitDoneRef = useRef(false);
  const actionsExitDoneRef = useRef(false);
  const exitReportedRef = useRef(false);

  useEffect(() => {
    clearTransitionContext();
  }, []);

  useEffect(() => {
    if (projectExiting) {
      setActionsPhase("idle");
      navStartedRef.current = false;
      menuWasOpenRef.current = false;
    }
  }, [projectExiting]);

  useEffect(() => {
    if (!projectExiting) {
      headingExitDoneRef.current = false;
      actionsExitDoneRef.current = false;
      exitReportedRef.current = false;
    }
  }, [projectExiting]);

  const reportProjectExitIfComplete = useCallback(() => {
    if (
      !projectExiting ||
      !headingExitDoneRef.current ||
      !actionsExitDoneRef.current ||
      exitReportedRef.current
    ) {
      return;
    }

    exitReportedRef.current = true;
    onProjectExitComplete?.();
  }, [projectExiting, onProjectExitComplete]);

  const handleHeadingExitComplete = useCallback(() => {
    headingExitDoneRef.current = true;
    reportProjectExitIfComplete();
  }, [reportProjectExitIfComplete]);

  const handleActionsExitComplete = useCallback(() => {
    actionsExitDoneRef.current = true;
    reportProjectExitIfComplete();
  }, [reportProjectExitIfComplete]);

  const navigateCold = useCallback(() => {
    setActionsPhase("dismissed");
    onOpenAbout();
  }, [onOpenAbout]);

  const handleAboutClick = useCallback(() => {
    if (navStartedRef.current || actionsPhase !== "idle") {
      return;
    }

    menuWasOpenRef.current = false;

    const node = actionsRef.current;

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

    orchestrateExitToAbout(() => {
      navigateCold();
    }, exitAnimations);
  }, [actionsPhase, navigateCold]);

  const isProjectTransition = projectExiting;
  const isColdReturn = isProjectReturn && !projectExiting;
  const isAboutHomeReturn = isAboutReturn && !projectExiting;

  const actionsVariants = isProjectTransition
    ? projectTransitionGroupVariants
    : isColdReturn || isAboutHomeReturn
      ? coldReturnGroupVariants
      : groupVariants;

  const actionItemVariants = isProjectTransition
    ? projectTransitionItemVariants
    : isAboutHomeReturn
      ? aboutReturnItemVariants
      : isColdReturn
        ? coldReturnItemVariants
        : itemVariants;

  const shouldAnimateReturn = isColdReturn || isAboutHomeReturn;

  return (
    <div className="relative flex w-full flex-col items-center text-center md:items-start md:text-left">
      <Link
        href="#top"
        className="text-muted mb-10 hidden text-[10px] font-medium tracking-[0.28em] uppercase"
      >
        JAIDWRLD
      </Link>

      <IdentityHeading
        projectExiting={projectExiting}
        coldReturn={isColdReturn}
        onProjectExitComplete={handleHeadingExitComplete}
      />

      {/* Wrapper positioning */}
      <div className="fixed inset-x-0 bottom-6 z-40 flex w-full justify-center md:relative md:inset-auto md:z-auto md:block md:w-auto">
        <div
          className={
            projectExiting
              ? undefined
              : actionsPhase === "dismissed"
                ? "pointer-events-none -translate-x-[200vw]"
                : actionsPhase === "exiting"
                  ? "pointer-events-none"
                  : undefined
          }
        >
          <LayoutGroup id="hero-identity-actions">
            <motion.div
              ref={actionsRef}
              layout={projectExiting ? false : isMobile ? "position" : false}
              transition={
                !projectExiting && isMobile
                  ? { layout: layoutTransition }
                  : undefined
              }
              className="mt-0 flex items-center gap-2 md:mt-12"
              initial={
                projectExiting
                  ? false
                  : active || shouldAnimateReturn
                    ? "hidden"
                    : false
              }
              animate={
                projectExiting
                  ? "exit"
                  : shouldAnimateReturn
                    ? "visible"
                    : showButtons
                      ? "visible"
                      : "hidden"
              }
              variants={actionsVariants}
              style={
                projectExiting
                  ? {
                      x: 0,
                      translateX: 0,
                    }
                  : undefined
              }
              onAnimationComplete={(definition) => {
                if (definition === "exit" && projectExiting) {
                  handleActionsExitComplete();
                }

                if (
                  definition === "visible" &&
                  !projectExiting &&
                  !shouldAnimateReturn
                ) {
                  advance("chrome");
                }
              }}
            >
              {/* About */}
              <motion.div
                data-menu-dismiss-ignore
                variants={actionItemVariants}
                initial={projectExiting ? false : undefined}
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

              {/* Contact */}
              <motion.div
                variants={actionItemVariants}
                initial={projectExiting ? false : undefined}
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
