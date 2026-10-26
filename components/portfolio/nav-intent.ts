/**
 * nav-intent.ts — Navigation Intent & Transition Coordinator
 *
 * Fungsi:
 * 1. Navigation Context: identitas navigasi eksplisit (id, source, destination, intent).
 * 2. Transition Coordinator: orkestrasi exit animations, completion signals, lalu navigate.
 * 3. Phase emitter: untuk listener animasi (WAAPI exit, dll) yang perlu sinkron.
 */

export type NavIntent = "about-cold" | "home-cold";

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
    /**
     * Runtime validation:
     * Mencegah error jika object yang diterima tidak memiliki
     * fungsi run yang valid.
     */
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

export async function waitForExitAnimations(): Promise<void> {
  if (currentExitAnimations.length === 0) return;

  setContextStatus("exiting");

  const promises = currentExitAnimations.map(
    async ({ name, animation }) => {
      if (!animation) return;

      try {
        await animation.finished;
      } catch (error) {
        /**
         * Animation.finished dapat reject ketika animasi dibatalkan.
         * Cancellation ditangani di sini agar tidak menghasilkan
         * unhandled Promise rejection.
         */
        if (process.env.NODE_ENV === "development") {
          console.debug(
            `[nav-intent] Animation "${name}" cancelled:`,
            error,
          );
        }
      }
    },
  );

  await Promise.all(promises);

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

  await waitForExitAnimations();

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

  /**
   * Reduced motion:
   * Context tetap dibuat agar destination dapat membaca intent.
   * Exit animation tidak dijalankan.
   */
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
): Promise<void> {
  setTransitionContext(
    createTransitionContext("about", "home", "home-cold"),
  );

  /**
   * Reduced motion:
   * Context tetap dibuat agar destination dapat membaca intent.
   * Exit animation tidak dijalankan.
   */
  if (prefersReducedMotion()) {
    currentExitAnimations = [];

    setContextStatus("navigating");
    emitPhase("navigating");

    onNavigate();
    return;
  }

  registerExitAnimations(exitAnimations);

  await completeExitTransition(onNavigate);
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