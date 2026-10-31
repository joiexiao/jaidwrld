"use client";

import { useCallback } from "react";
import { ViewTransition } from "react";
import { motion, type Variants } from "framer-motion";

import TextType from "@/components/animation/TextType";
import { isPhaseAtLeast, useIntro } from "@/components/portfolio/intro";

type IdentityHeadingProps = {
  projectExiting?: boolean;
  coldReturn?: boolean;
  onProjectExitComplete?: () => void;
};

// INTRO AWAL HOMEPAGE — dipertahankan dari kode asli.
const headingVariants: Variants = {
  hidden: { opacity: 0, scale: 0.4 },

  half: {
    opacity: 1,
    scale: 0.5,
    transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] },
  },

  full: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

// Status intro asli — tidak diubah.
const statusVariants: Variants = {
  hidden: { opacity: 0, x: -24, scale: 0.92 },
  visible: { opacity: 1, x: 0, scale: 1 },
};

// Animasi terpisah khusus transisi homepage ⇄ detail project.
const transitionContainerVariants: Variants = {
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
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

const transitionItemVariants: Variants = {
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

// Dipakai hanya saat kembali dari detail project.
// Tidak mengubah headingVariants untuk intro awal.
const coldReturnHeadingVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 1,
  },

  full: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0,
    },
  },
};

export default function IdentityHeading({
  projectExiting = false,
  coldReturn = false,
  onProjectExitComplete,
}: IdentityHeadingProps) {
  const { phase, active, advance } = useIntro();

  const handleRoleComplete = useCallback(() => {
    advance("role");
  }, [advance]);

  // Fase intro asli tetap sama.
  const headingState = isPhaseAtLeast(phase, "reveal")
    ? "full"
    : isPhaseAtLeast(phase, "name")
      ? "half"
      : "hidden";

  const showStatus = isPhaseAtLeast(phase, "chrome");

  const transitionState = projectExiting
    ? "exit"
    : coldReturn && !projectExiting
      ? "visible"
      : "idle";

  return (
    <ViewTransition name="project-info" share="auto" default="none">
      <motion.div
        className="w-full text-center md:text-left"
        style={{ transformOrigin: "center top" }}
        initial={
          coldReturn && !projectExiting ? "hidden" : active ? "hidden" : false
        }
        animate={coldReturn && !projectExiting ? "full" : headingState}
        variants={
          coldReturn && !projectExiting
            ? coldReturnHeadingVariants
            : headingVariants
        }
        onAnimationComplete={(definition) => {
          // Intro awal tetap menjalankan urutan fase aslinya.
          if ((coldReturn && !projectExiting) || projectExiting) return;

          if (definition === "half") {
            advance("name");
          } else if (definition === "full") {
            advance("reveal");
          }
        }}
      >
        <motion.div
          className="w-full"
          variants={transitionContainerVariants}
          initial={coldReturn && !projectExiting ? "hidden" : false}
          animate={transitionState}
          onAnimationComplete={(definition) => {
            if (definition === "exit" && projectExiting) {
              onProjectExitComplete?.();
            }
          }}
        >
          {/* Status */}
          <motion.div
            className="text-muted mb-4 flex items-center justify-center gap-2 text-[10px] leading-none tracking-[0.18em] uppercase md:justify-start"
            initial={
              coldReturn && !projectExiting
                ? undefined
                : active
                  ? "hidden"
                  : false
            }
            animate={
              projectExiting
                ? "exit"
                : coldReturn
                  ? undefined
                  : showStatus
                    ? "visible"
                    : "hidden"
            }
            variants={
              projectExiting || (coldReturn && !projectExiting)
                ? transitionItemVariants
                : statusVariants
            }
            transition={{
              duration: 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <span className="relative inline-flex size-1.5 shrink-0 -translate-y-[1px]">
              {/* Outer Dot */}
              <motion.span
                className="bg-accent absolute inset-0 rounded-full"
                animate={
                  projectExiting
                    ? { scale: 1, opacity: 1 }
                    : {
                        scale: [1, 1.35, 1],
                        opacity: [0.45, 0.9, 0.45],
                      }
                }
                transition={
                  projectExiting
                    ? { duration: 0.1 }
                    : {
                        duration: 2.4,
                        ease: [0.45, 0, 0.55, 1],
                        repeat: Infinity,
                        repeatType: "mirror",
                      }
                }
              />

              {/* Inner Dot */}
              <motion.span
                className="bg-accent relative size-1.5 rounded-full"
                animate={
                  projectExiting
                    ? { opacity: 1, scale: 1 }
                    : {
                        opacity: [0.35, 1, 0.35],
                        scale: [0.85, 1, 0.85],
                      }
                }
                transition={
                  projectExiting
                    ? { duration: 0.1 }
                    : {
                        duration: 2.4,
                        ease: [0.45, 0, 0.55, 1],
                        repeat: Infinity,
                        repeatType: "mirror",
                        delay: 0.15,
                      }
                }
              />
            </span>

            <span className="inline-flex items-center leading-none">
              Available for work
            </span>
          </motion.div>

          {/* Name */}
          <motion.h1
            variants={transitionItemVariants}
            className="font-regular text-2xl sm:text-3xl md:w-[125%] md:text-4xl lg:w-[140%] lg:text-4xl"
          >
            Mujahid Azzam Darmawan
          </motion.h1>

          {/* Role */}
          <motion.div variants={transitionItemVariants} className="mt-2">
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
              active={
                (!projectExiting && coldReturn) || isPhaseAtLeast(phase, "role")
              }
              onFirstComplete={handleRoleComplete}
              className="font-regular text-muted text-xl sm:text-2xl md:text-3xl lg:text-4xl"
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </ViewTransition>
  );
}
