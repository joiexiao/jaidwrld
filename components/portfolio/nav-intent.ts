
/* nav-intent.ts — flag modul sekali-pakai untuk koreografi slide home ⇄ About.
 *
 * Fungsi: memberi tahu sisi penerima navigasi supaya memainkan slide masuk
 * (menu About dari kanan / tombol hero dari kiri) pada "jalur dingin".
 *
 * Kenapa bukan class enter/exit View Transition? Hasil bisect (V1–V6):
 * di kombinasi Next 16 + React 19 ini hanya pair morph (name stabil) dan
 * crossfade root yang pernah terpasang; class enter/exit single-element tidak
 * pernah di-apply dan transitionTypes dari router tidak sampai ke
 * pendingTransitionTypes. Karena itu koreografi dijalankan di level DOM
 * (WAAPI untuk slide keluar, keyframes `cold-in-*` untuk slide masuk) dengan
 * flag modul ini sebagai penanda lintas navigasi.
 *
 * Pola aman StrictMode: set sekali tepat sebelum `router.push`, dibaca saat
 * render mount (useState initializer), lalu dibersihkan dari effect.
 */

// Timing constants untuk sinkronisasi transisi Home ⇄ About.
// Satu durasi untuk tombol + panel supaya keduanya berhenti bareng (satu gesture).
const TRANSITION_MS = 720;
export const CAROUSEL_EXIT_DURATION = TRANSITION_MS; // Carousel slide right + fade
export const GHOST_CARD_DURATION = TRANSITION_MS; // Ghost card slide in dari kanan
export const BUTTON_EXIT_DURATION = TRANSITION_MS; // Tombol slide out

// Jeda mulai panel setelah tombol mulai bergerak (ilusi "didorong").
export const PANEL_EXIT_DELAY = 30;

export type NavIntent = "about-cold" | "home-cold";

// Animation orchestrator — single source of truth untuk koordinasi transisi
export type AnimationPhase =
  | "idle" // Tidak ada transisi
  | "button-exit" // Tombol mulai slide out
  | "panel-exit" // Carousel/placeholder mulai animasi
  | "navigating"; // Navigasi akan dieksekusi

type PhaseListener = (phase: AnimationPhase) => void;

const phaseListeners = new Set<PhaseListener>();
let currentPhase: AnimationPhase = "idle";

/** Subscribe ke perubahan phase animasi. Returns cleanup function. */
export function subscribeNavAnimation(
  callback: PhaseListener
): () => void {
  phaseListeners.add(callback);
  return () => phaseListeners.delete(callback);
}

/** Baca phase saat ini tanpa subscribe. */
export function getNavAnimationPhase(): AnimationPhase {
  return currentPhase;
}

/** Emit phase baru ke semua subscriber. */
function emitPhase(phase: AnimationPhase): void {
  currentPhase = phase;
  phaseListeners.forEach((callback) => callback(phase));
}

/** Reset phase ke idle (dipanggil setelah navigasi selesai). */
export function resetNavAnimation(): void {
  currentPhase = "idle";
  phaseListeners.forEach((callback) => callback("idle"));
}

/** Trigger koreografi animasi dari Home ke About. */
export function orchestrateExitToAbout(
  onNavigate: () => void
): void {
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    onNavigate();
    return;
  }

  // Phase 1: Button exit
  emitPhase("button-exit");

  // Phase 2: Panel exit, sedikit setelah button mulai bergerak
  setTimeout(() => {
    emitPhase("panel-exit");
  }, PANEL_EXIT_DELAY);

  // Phase 3: Navigate ketika carousel selesai
  setTimeout(() => {
    emitPhase("navigating");
    onNavigate();
  }, PANEL_EXIT_DELAY + CAROUSEL_EXIT_DURATION);
}

/** Trigger koreografi animasi dari About ke Home. */
export function orchestrateExitToHome(
  onNavigate: () => void
): void {
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    onNavigate();
    return;
  }

  // Button dan carousel mulai pada phase yang sama
  emitPhase("button-exit");
  emitPhase("panel-exit");

  // Navigate ketika ghost card selesai
  setTimeout(() => {
    emitPhase("navigating");
    onNavigate();
  }, GHOST_CARD_DURATION);
}

export type CarouselBounds = {
  top: number;
  left: number;
  width: number;
  height: number;
  centerY: number; // clientY center relative to viewport
};

let intent: NavIntent | null = null;
let carouselBounds: CarouselBounds | null = null;

/** Set tepat sebelum `router.push` — dibaca halaman tujuan saat mount. */
export function setNavIntent(next: NavIntent): void {
  intent = next;
}

/** Baca tanpa menghapus (render-safe, boleh dipanggil berkali-kali). */
export function peekNavIntent(): NavIntent | null {
  return intent;
}

/** Bersihkan dari effect setelah dibaca (sekali pakai per navigasi). */
export function clearNavIntent(): void {
  intent = null;
}

/** Set carousel bounds sebelum navigasi ke About. */
export function setCarouselBounds(
  bounds: CarouselBounds
): void {
  carouselBounds = bounds;
}

/** Baca carousel bounds saat About mount. */
export function peekCarouselBounds(): CarouselBounds | null {
  return carouselBounds;
}

/** Bersihkan carousel bounds setelah dibaca. */
export function clearCarouselBounds(): void {
  carouselBounds = null;
}
