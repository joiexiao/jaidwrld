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
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

// Durasi slide keluar kedua tombol sebelum navigasi (sinkron dengan BUTTON_EXIT_DURATION).
const ACTIONS_OUT_MS = BUTTON_EXIT_DURATION;

// Panel kiri home: identitas. Heading di-share dengan halaman About lewat
// `project-info` (lihat IdentityHeading); tombol IdCard menuju /about.
// Intro: tombol baru muncul saat fase "chrome" (setelah status).
export default function HeroIdentity({
  onOpenAbout,
  showActions = true,
}: HeroIdentityProps) {
  const { phase, active, advance } = useIntro();
  const showButtons = isPhaseAtLeast(phase, "chrome") && showActions;
  const [menuOpen, setMenuOpen] = useState(false);

  // Koreografi slide home ⇄ About untuk kedua tombol panel kiri.
  // Catatan mekanisme: class enter/exit View Transition tidak pernah terpasang
  // di kombinasi Next 16 + React 19 ini (hanya pair morph & crossfade root),
  // jadi slide dijalankan di level DOM:
  // - keluar (to-about): WAAPI slide kiri + fade, lalu wrapper digeser jauh ke
  //   luar viewport — rect di luar viewport membuat React melepas nama
  //   view-transition, sehingga pair `contact-menu` tidak ikut terbentuk
  //   (tanpa "balon" morph dari tombol kecil ke menu About yang lebar).
  // - masuk (to-home): class `cold-in-left` (tertahan di posisi awal selama
  //   crossfade root, lalu meluncur masuk dari kiri).
  // Saat menu home TERBUKA, klik About navigasi langsung — shared morph
  // `contact-menu` yang mengambil alih (perilaku referensi).
  const [actionsPhase, setActionsPhase] = useState<
    "idle" | "exiting" | "dismissed"
  >("idle");
  const [coldReturn] = useState(() => peekNavIntent() === "home-cold");
  const actionsRef = useRef<HTMLDivElement>(null);

  // Snapshot status menu saat interaksi dimulai. MenuButton menutup menu pada
  // `pointerdown` (listener outside-click) — yaitu SEBELUM event `click` sampai
  // ke handler ini — sehingga `menuOpen` sudah false saat klik diproses.
  // Nilai ini menjaga jalur referensi (menu terbuka → push langsung) tetap
  // terdeteksi walau state-nya sudah berubah.
  const menuWasOpenRef = useRef(false);

  // Jalur referensi tidak mengubah `actionsPhase`, jadi klik berulang dicegah
  // eksplisit di sini (satu klik = satu navigasi).
  const navStartedRef = useRef(false);

  // Intent sekali pakai (lihat nav-intent.ts) — bersihkan setelah dibaca.
  useEffect(() => {
    clearNavIntent();
  }, []);

  // Jalur dingin (menu tertutup): tandai dulu supaya menu About meluncur masuk.
  const navigateCold = useCallback(() => {
    setNavIntent("about-cold");
    onOpenAbout();
  }, [onOpenAbout]);

  // Subscribe ke animation phase untuk jalankan WAAPI saat button-exit
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
          () => {}, // dibatalkan (unmount / navigasi lain) — abaikan
        );
      }
    });

    return unsubscribe;
  }, []);

  const handleAboutClick = useCallback(() => {
    if (navStartedRef.current || actionsPhase !== "idle") return;

    // Menu terbuka saat interaksi dimulai: jalankan animasi exit yang sama
    // seperti jalur dingin untuk konsistensi visual (button slide keluar).
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

    // Jalur dingin: trigger orchestrator untuk sinkronisasi semua animasi
    navStartedRef.current = true;
    setActionsPhase("exiting");

    orchestrateExitToAbout(() => {
      setActionsPhase("dismissed");
      navigateCold();
    });
  }, [actionsPhase, menuOpen, navigateCold, onOpenAbout]);

  return (
    <div className="relative flex w-full flex-col items-start">
      <Link
        href="#top"
        className="text-muted mb-10 text-[10px] font-medium tracking-[0.28em] uppercase md:hidden"
      >
        JAIDWRLD
      </Link>

      <IdentityHeading />

      {/* Wrapper koreografi: digeser ke luar viewport saat keluar (agar pair
          morph tidak terbentuk), `cold-in-left` saat kembali dari About. */}
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
        <motion.div
          ref={actionsRef}
          className="mt-12 flex items-center gap-2"
          initial={active ? "hidden" : false}
          animate={showButtons ? "visible" : "hidden"}
          variants={groupVariants}
        >
          {/* Icon only — buka halaman About */}
          <motion.div
            variants={itemVariants}
            // Simpan status menu sebelum outside-click MenuButton menutupnya.
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

          {/* Menu: trigger + opsi yang muncul dari samping. Nama
              `contact-menu` dibuat STATIS — mengubah-ubahnya saat menu
              buka/tutup mematikan tracking pair React (hasil bisect), jadi
              gating jalur dingin dilakukan lewat wrapper di atas. */}
          <motion.div
            variants={itemVariants}
            onAnimationComplete={(definition) => {
              if (definition === "visible") advance("chrome");
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
  );
}
