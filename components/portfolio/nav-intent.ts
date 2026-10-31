
/**
 * nav-intent.ts — Navigation Intent & Transition Coordinator
 *
 * Fungsi:
 * 1. Navigation Context: identitas navigasi eksplisit.
 * 2. Transition Coordinator: orkestrasi exit animations, completion signals,
 *    lalu navigate.
 * 3. Phase emitter: untuk listener animasi yang perlu sinkron.
 */

export type NavIntent =
  | "about-cold"
  | "home-cold"
  | "home-from-project";

export type TransitionStatus =
  | "idle"
  | "preparing"
  | "exiting"
  | "navigating"
  | "entering"
  | "completed"
  | "cancelled";

export interface NavigationContext {
  id: string;
  source: string;
  destination: string;
  intent: NavIntent;
  status: TransitionStatus;
  timestamp: number;
}

let transitionContext: NavigationContext | null = null;

let currentExitAnimations: Array<{
  name: string;
  animation: Animation | null;
}> = [];

const phaseListeners = new Set<(phase: AnimationPhase) => void>();

function generateNavigationId(): string {
  return `nav_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function emitPhase(phase: AnimationPhase): void {
  phaseListeners.forEach((callback) => callback(phase));
}

function setContextStatus(status: TransitionStatus): void {
  if (transitionContext) {
    transitionContext = {
      ...transitionContext,
      status,
    };
  }
}

// ============================================================================
// Phase Emitter
// ============================================================================

export type AnimationPhase =
  | "idle"
  | "button-exit"
  | "panel-exit"
  | "navigating";

export function subscribeNavAnimation(
  callback: (phase: AnimationPhase) => void,
): () => void {
  phaseListeners.add(callback);

  return () => {
    phaseListeners.delete(callback);
  };
}

export function getNavAnimationPhase(): AnimationPhase {
  if (!transitionContext) return "idle";

  switch (transitionContext.status) {
    case "exiting":
      return "button-exit";

    case "navigating":
      return "navigating";

    default:
      return "idle";
  }
}

// ============================================================================
// Navigation Context API
// ============================================================================

export function setTransitionContext(ctx: NavigationContext): void {
  transitionContext = ctx;
}

export function peekTransitionContext(): NavigationContext | null {
  return transitionContext;
}

export function clearTransitionContext(): void {
  transitionContext = null;
  currentExitAnimations = [];
}

// ============================================================================
// Animation Registration
// ============================================================================

export interface ExitAnimation {
  name: string;
  run: () => Animation | null | undefined;
}

export function registerExitAnimations(
  animations: ExitAnimation[],
): void {
  currentExitAnimations = animations.map((a) => {
    if (!a || typeof a.run !== "function") {
      console.error(
        "[nav-intent] Invalid animation object:",
        a?.name ?? "unknown",
        a,
      );

      return {
        name: a?.name ?? "unknown",
        animation: null,
      };
    }

    try {
      return {
        name: a.name,
        animation: a.run() ?? null,
      };
    } catch (error) {
      console.error(
        `[nav-intent] Failed to start animation "${a.name}":`,
        error,
      );

      return {
        name: a.name,
        animation: null,
      };
    }
  });
}

/**
 * Menunggu seluruh animasi WAAPI yang terdaftar dan completion
 * Promise tambahan, misalnya animasi exit dari Framer Motion.
 */
export async function waitForExitAnimations(
  completionPromises: Promise<unknown>[] = [],
): Promise<void> {
  setContextStatus("exiting");

  const animationPromises = currentExitAnimations.map(
    async ({ name, animation }) => {
      if (!animation) return;

      try {
        await animation.finished;
      } catch (error) {
        // Animation.finished dapat reject ketika animasi dibatalkan.
        if (process.env.NODE_ENV === "development") {
          console.debug(
            `[nav-intent] Animation "${name}" cancelled:`,
            error,
          );
        }
      }
    },
  );

  const additionalPromises = completionPromises.map((promise) =>
    promise.catch((error) => {
      if (process.env.NODE_ENV === "development") {
        console.debug(
          "[nav-intent] Additional exit completion rejected:",
          error,
        );
      }
    }),
  );

  await Promise.all([
    ...animationPromises,
    ...additionalPromises,
  ]);

  currentExitAnimations = [];
}

// ============================================================================
// Transition Coordinator
// ============================================================================

const PANEL_TRANSITION_MS = 720;

export const CAROUSEL_EXIT_DURATION = PANEL_TRANSITION_MS;
export const GHOST_CARD_DURATION = PANEL_TRANSITION_MS;

export const BUTTON_EXIT_DURATION = 320;
export const PANEL_EXIT_DELAY = 30;

function createTransitionContext(
  source: NavigationContext["source"],
  destination: NavigationContext["destination"],
  intent: NavIntent,
): NavigationContext {
  return {
    id: generateNavigationId(),
    source,
    destination,
    intent,
    status: "preparing",
    timestamp: Date.now(),
  };
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

async function completeExitTransition(
  onNavigate: () => void,
  options?: {
    emitPanelExit?: boolean;
    completionPromises?: Promise<unknown>[];
  },
): Promise<void> {
  emitPhase("button-exit");

  if (options?.emitPanelExit) {
    setTimeout(() => {
      emitPhase("panel-exit");
    }, PANEL_EXIT_DELAY);
  } else {
    emitPhase("panel-exit");
  }

  await waitForExitAnimations(options?.completionPromises);

  setContextStatus("navigating");
  emitPhase("navigating");

  onNavigate();
}

export async function orchestrateExitToAbout(
  onNavigate: () => void,
  exitAnimations: ExitAnimation[],
): Promise<void> {
  setTransitionContext(
    createTransitionContext("home", "about", "about-cold"),
  );

  if (prefersReducedMotion()) {
    currentExitAnimations = [];

    setContextStatus("navigating");
    emitPhase("navigating");

    onNavigate();
    return;
  }

  registerExitAnimations(exitAnimations);

  await completeExitTransition(onNavigate, {
    emitPanelExit: true,
  });
}

export async function orchestrateExitToHome(
  onNavigate: () => void,
  exitAnimations: ExitAnimation[],
  completionPromises: Promise<unknown>[] = [],
  source: "about" | "project" = "about",
): Promise<void> {
  setTransitionContext(
    createTransitionContext(
      source,
      "home",
      source === "project" ? "home-from-project" : "home-cold",
    ),
  );

  if (prefersReducedMotion()) {
    currentExitAnimations = [];

    setContextStatus("navigating");
    emitPhase("navigating");

    onNavigate();
    return;
  }

  registerExitAnimations(exitAnimations);

  await completeExitTransition(onNavigate, {
    completionPromises,
  });
}

// ============================================================================
// Carousel Bounds
// ============================================================================

export type CarouselBounds = {
  top: number;
  left: number;
  width: number;
  height: number;
  centerY: number;
};

let carouselBounds: CarouselBounds | null = null;

export function setCarouselBounds(bounds: CarouselBounds): void {
  carouselBounds = bounds;
}

export function peekCarouselBounds(): CarouselBounds | null {
  return carouselBounds;
}

export function clearCarouselBounds(): void {
  carouselBounds = null;
}

// ============================================================================
// Reset
// ============================================================================

export function resetNavAnimation(): void {
  transitionContext = null;
  currentExitAnimations = [];

  phaseListeners.forEach((callback) => callback("idle"));
}

