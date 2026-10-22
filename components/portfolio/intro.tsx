"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// intro.tsx — orkestrasi animasi intro home.
// Fungsi: state machine fase intro yang dibagi ke IdentityHeading, tombol, dan
//         carousel lewat context. Anak memanggil `advance(fase)` saat animasi
//         fasenya selesai; provider memajukan ke fase berikutnya.
// Urutan: blank → name → role → reveal → chrome → card → done.
// Catatan layer: ini komponen area `portfolio/`; `ui/` & `animation/` TIDAK
//         mengimpornya — nilai intro ke sana diturunkan lewat props
//         (mis. PortfolioCard.previewFan). Di luar provider (About), context
//         default = `done` sehingga heading dirender normal (tanpa animasi).

export type IntroPhase =
  "blank" | "name" | "role" | "reveal" | "chrome" | "card" | "done";

const PHASE_ORDER: IntroPhase[] = [
  "blank",
  "name",
  "role",
  "reveal",
  "chrome",
  "card",
  "done",
];

type IntroContextValue = {
  phase: IntroPhase;
  /** Intro masih berjalan (belum "done"). */
  active: boolean;
  /** Majukan fase berikutnya, hanya bila `from` = fase saat ini. */
  advance: (from: IntroPhase) => void;
};

const IntroContext = createContext<IntroContextValue>({
  phase: "done",
  active: false,
  advance: () => {},
});

/** True bila `phase` sudah mencapai (atau melewati) `target`. */
export function isPhaseAtLeast(phase: IntroPhase, target: IntroPhase): boolean {
  return PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf(target);
}

// Intro home hanya boleh main bila document ini di-load pertama kali di
// homepage (hard refresh di "/"). Bila entry document-nya route lain, intro
// dianggap sudah lewat sehingga kembali ke home via navigasi tidak mengulang.
// `window.__jaidEntry` dicatat skrip inline (lihat app/layout.tsx) saat HTML
// parse — jadi nilainya route awal untuk semua route, termasuk yang tidak
// memuat modul ini saat boot.
let introPlayed = false;

declare global {
  interface Window {
    /** Route saat document pertama dimuat (diisi app/layout.tsx). */
    __jaidEntry?: string;
  }
}

if (typeof window !== "undefined") {
  const entry = window.__jaidEntry ?? window.location.pathname;
  introPlayed = entry !== "/";
}

// Jeda canvas kosong sebelum fase "name".
const BLANK_MS = 420;

type IntroProviderProps = {
  children: ReactNode;
};

export function IntroProvider({ children }: IntroProviderProps) {
  // Server selalu merender "blank" (effect tidak jalan di server) → cocok
  // dengan render client pertama. Navigasi client berikutnya membaca flag
  // modul sehingga langsung "done" (tanpa kedip).
  const [phase, setPhase] = useState<IntroPhase>(
    introPlayed ? "done" : "blank",
  );

  const advance = useCallback((from: IntroPhase) => {
    setPhase((current) => {
      if (current !== from) return current;

      const nextIndex = PHASE_ORDER.indexOf(from) + 1;
      return PHASE_ORDER[Math.min(nextIndex, PHASE_ORDER.length - 1)];
    });
  }, []);

  useEffect(() => {
    if (phase !== "blank") return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Tanpa animasi: lompat langsung ke "done" (tetap lewat timer agar tidak
    // setState sinkron di dalam effect — lihat aturan react-hooks).
    const delay = reduceMotion ? 0 : BLANK_MS;

    const timer = window.setTimeout(() => {
      setPhase((current) => {
        if (current !== "blank") return current;
        return reduceMotion ? "done" : "name";
      });
    }, delay);

    return () => window.clearTimeout(timer);
  }, [phase]);

  // Begitu intro benar-benar berjalan (lewat fase "blank"), tandai sudah main:
  // intro yang diinterupsi (user pindah sebelum selesai) tidak diulang saat
  // kembali ke home. Aman double-mount StrictMode karena saat itu fase "blank".
  useEffect(() => {
    if (phase !== "blank") introPlayed = true;
  }, [phase]);

  const value: IntroContextValue = {
    phase,
    active: phase !== "done",
    advance,
  };

  return (
    <IntroContext.Provider value={value}>{children}</IntroContext.Provider>
  );
}

export function useIntro(): IntroContextValue {
  return useContext(IntroContext);
}
