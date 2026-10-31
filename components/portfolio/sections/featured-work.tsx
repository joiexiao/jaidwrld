"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, type Variants } from "framer-motion";
import ProjectCarousel from "@/components/ui/ProjectCarousel";
import { isPhaseAtLeast, useIntro } from "@/components/portfolio/intro";
import {
  setCarouselBounds,
  CAROUSEL_EXIT_DURATION,
  subscribeNavAnimation,
  peekTransitionContext,
  type AnimationPhase,
} from "@/components/portfolio/nav-intent";
import type { Project } from "@/types/project";

type FeaturedWorkProps = {
  projects: Project[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  closing: boolean;
  onOpen: () => void;
  onCollapseComplete?: () => void;
  onPrefetch: () => void;
  aboutExit?: boolean;
  onAboutExit?: () => void;
  showCarousel?: boolean;
};

const FAN_CLOSE_MS = 300;
const PROJECT_RETURN_MORPH_MS = 1000;

type ReturnFanPhase = "closed" | "idle";

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 48, x: 0 },
  visible: { opacity: 1, y: 0, x: 0 },
  aboutReturnSlideIn: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exitRight: {
    opacity: 0,
    x: "110vw",
    transition: {
      duration: CAROUSEL_EXIT_DURATION / 1000,
      ease: [0.45, 0, 0.55, 1],
    },
  },
};

const dotsGroupVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.6,
      staggerChildren: 0.12,
    },
  },
};

const dotVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function FeaturedWork({
  projects,
  activeIndex,
  onActiveIndexChange,
  closing,
  onOpen,
  onCollapseComplete,
  onPrefetch,
  aboutExit = false,
  onAboutExit,
  showCarousel = true,
}: FeaturedWorkProps) {
  const { phase, active, advance } = useIntro();
  const isCard = isPhaseAtLeast(phase, "card");

  const initialIntent = peekTransitionContext()?.intent;
  const [coldReturn, setColdReturn] = useState(
    () => initialIntent === "home-from-project",
  );
  const [aboutReturn, setAboutReturn] = useState(
    () => initialIntent === "home-cold",
  );
  const [returnAnimationKey, setReturnAnimationKey] = useState(() =>
    initialIntent === "home-from-project" || initialIntent === "home-cold"
      ? 1
      : 0,
  );

  const carouselWrapperRef = useRef<HTMLDivElement>(null);
  const [fanClosed, setFanClosed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === "undefined"
      ? true
      : window.matchMedia("(min-width: 768px)").matches,
  );
  const [returnFanPhase, setReturnFanPhase] =
    useState<ReturnFanPhase>("closed");
  const [orchestratedExit, setOrchestratedExit] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  // Restart timer setiap kali kembali dari project, termasuk saat Home
  // dipulihkan dari route cache dan state coldReturn sebelumnya masih true.
  useEffect(() => {
    if (!coldReturn) return;

    setReturnFanPhase("closed");
    const timer = window.setTimeout(() => {
      setReturnFanPhase("idle");
    }, PROJECT_RETURN_MORPH_MS);

    return () => window.clearTimeout(timer);
  }, [coldReturn, returnAnimationKey]);

  const fanOpen = coldReturn
    ? false
    : active && isPhaseAtLeast(phase, "reveal") && !fanClosed;

  // panel-exit hanya menggerakkan carousel untuk Home → About.
  // Project → Home menggunakan shared card transition, bukan exitRight.
  useEffect(() => {
    const unsubscribe = subscribeNavAnimation((navPhase: AnimationPhase) => {
      const intent = peekTransitionContext()?.intent;

      if (navPhase === "panel-exit" && intent === "about-cold") {
        setOrchestratedExit(true);
        return;
      }

      if (navPhase !== "navigating") return;

      setOrchestratedExit(false);

      if (intent === "home-from-project") {
        setColdReturn(true);
        setAboutReturn(false);
        setReturnFanPhase("closed");
        setReturnAnimationKey((key) => key + 1);
      } else if (intent === "home-cold") {
        setColdReturn(false);
        setAboutReturn(true);
        setReturnAnimationKey((key) => key + 1);
      }
    });

    return unsubscribe;
  }, []);

  const fanCloseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (fanCloseTimerRef.current !== null) {
        window.clearTimeout(fanCloseTimerRef.current);
      }
    };
  }, []);

  const handleCardRiseStart = useCallback(() => {
    if (fanCloseTimerRef.current !== null) {
      window.clearTimeout(fanCloseTimerRef.current);
      fanCloseTimerRef.current = null;
    }
  }, []);

  const handleCardRiseComplete = useCallback(() => {
    setFanClosed(true);

    if (fanCloseTimerRef.current !== null) {
      window.clearTimeout(fanCloseTimerRef.current);
    }

    fanCloseTimerRef.current = window.setTimeout(() => {
      advance("card");
      fanCloseTimerRef.current = null;
    }, FAN_CLOSE_MS);
  }, [advance]);

  useEffect(() => {
    if (aboutExit && carouselWrapperRef.current) {
      const rect = carouselWrapperRef.current.getBoundingClientRect();

      setCarouselBounds({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        centerY: rect.top + rect.height / 2,
      });
    }
  }, [aboutExit]);

  const activeProject = projects[activeIndex];
  if (!activeProject) return null;

  const returnClosing = coldReturn && returnFanPhase === "closed";

  return (
    <div
      ref={carouselWrapperRef}
      className="relative flex w-full flex-col items-center"
    >
      <div className="relative w-full">
        <motion.div
          key={returnAnimationKey}
          className="relative z-10 w-full"
          initial={
            !showCarousel
              ? { opacity: 1, x: 0 }
              : coldReturn
                ? { opacity: 1, y: 0, x: 0 }
                : aboutReturn
                  ? { opacity: 1, x: "100vw" }
                  : active
                    ? "hidden"
                    : false
          }
          animate={
            aboutExit || orchestratedExit
              ? "exitRight"
              : aboutReturn
                ? "aboutReturnSlideIn"
                : coldReturn
                  ? "visible"
                  : isCard
                    ? "visible"
                    : "hidden"
          }
          variants={cardVariants}
          transition={{
            layout: {
              duration: 1.4,
              ease: [0.16, 1, 0.3, 1],
            },
          }}
          onAnimationComplete={(definition) => {
            if (definition === "exitRight") {
              setOrchestratedExit(false);
              onAboutExit?.();
              return;
            }

            if (definition === "visible") {
              handleCardRiseComplete();
            }
          }}
          onAnimationStart={(definition) => {
            if (definition === "visible" && !coldReturn) {
              handleCardRiseStart();
            }
          }}
        >
          <ProjectCarousel
            projects={projects}
            activeIndex={activeIndex}
            onActiveIndexChange={onActiveIndexChange}
            closing={closing || returnClosing}
            onOpen={onOpen}
            onCollapseComplete={onCollapseComplete}
            onPrefetch={onPrefetch}
            previewFan={fanOpen}
            enableLayoutId={!aboutReturn}
          />
        </motion.div>
      </div>

      {projects.length > 1 && (
        <motion.div
          key={`desktop-dots-${returnAnimationKey}`}
          className="absolute top-1/2 right-0 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex"
          initial={active ? "hidden" : false}
          animate={
            aboutExit || orchestratedExit
              ? "hidden"
              : isCard
                ? "visible"
                : "hidden"
          }
          variants={dotsGroupVariants}
        >
          {projects.map((project, index) => (
            <motion.button
              key={project.slug}
              type="button"
              variants={dotVariants}
              aria-label={`Show ${project.name}`}
              aria-current={activeIndex === index ? "true" : undefined}
              onClick={() => onActiveIndexChange(index)}
              className={`size-1.5 rounded-full transition-all duration-300 ${
                activeIndex === index
                  ? "bg-foreground scale-110"
                  : "bg-border hover:bg-muted"
              }`}
            />
          ))}
        </motion.div>
      )}

      {projects.length > 1 && (
        <motion.div
          key={`mobile-dots-${returnAnimationKey}`}
          className="absolute top-1/2 right-0 flex -translate-y-1/2 flex-col items-center gap-3 md:hidden"
          initial={active ? "hidden" : false}
          animate={
            aboutExit || orchestratedExit
              ? "hidden"
              : isCard
                ? "visible"
                : "hidden"
          }
          variants={dotsGroupVariants}
        >
          {projects.map((project, index) => (
            <motion.button
              key={project.slug}
              type="button"
              variants={dotVariants}
              aria-label={`Show ${project.name}`}
              aria-current={activeIndex === index ? "true" : undefined}
              onClick={() => onActiveIndexChange(index)}
              className={`size-1.5 rounded-full transition-all ${
                activeIndex === index ? "bg-foreground" : "bg-border"
              }`}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
