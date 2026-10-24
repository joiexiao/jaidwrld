"use client";

import { useCallback, ViewTransition } from "react";
import { motion, type Variants } from "framer-motion";
import TextType from "@/components/animation/TextType";
import { isPhaseAtLeast, useIntro } from "@/components/portfolio/intro";

// identity-heading.tsx — blok heading identitas (status, nama, role).
// Fungsi: dipakai bersama oleh home (HeroIdentity) dan About supaya tampilannya
//         PERSIS sama. Dibungkus shared View Transition `project-info` supaya
//         heading mengalir mulus saat pindah home ⇄ About (share="auto" =
//         crossfade + interpolasi posisi).
// Intro home (lihat components/portfolio/intro.tsx): blok zoom dari kecil ke
//         0.5 (fase "name"), role diketik di 0.5 (fase "role"), lalu zoom ke 1
//         (fase "reveal"), baru status muncul (fase "chrome"). Di luar provider
//         (About) intro tidak aktif → dirender normal tanpa animasi.
const headingVariants: Variants = {
  hidden: { opacity: 0, scale: 0.4 },
  // Nama muncul pertama: zoom sengaja lebih lambat.
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

const statusVariants: Variants = {
  hidden: { opacity: 0, x: -24, scale: 0.92 },
  visible: { opacity: 1, x: 0, scale: 1 },
};

export default function IdentityHeading() {
  const { phase, active, advance } = useIntro();

  const handleRoleComplete = useCallback(() => advance("role"), [advance]);

  const headingState = isPhaseAtLeast(phase, "reveal")
    ? "full"
    : isPhaseAtLeast(phase, "name")
      ? "half"
      : "hidden";

  const showStatus = isPhaseAtLeast(phase, "chrome");

  return (
    <ViewTransition name="project-info" share="auto" default="none">
      <motion.div
        className="w-full text-center md:text-left"
        style={{ transformOrigin: "center top" }}
        initial={active ? "hidden" : false}
        animate={headingState}
        variants={headingVariants}
        onAnimationComplete={(definition) => {
          if (definition === "half") {
            advance("name");
          } else if (definition === "full") {
            advance("reveal");
          }
        }}
      >
        <motion.div
          className="text-muted mb-4 hidden items-center gap-2 text-[10px] tracking-[0.18em] uppercase md:flex"
          initial={active ? "hidden" : false}
          animate={showStatus ? "visible" : "hidden"}
          variants={statusVariants}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="bg-accent size-2 rounded-full" />
          Available for work
        </motion.div>

        <h1 className="font-regular text-2xl sm:text-3xl md:w-[125%] md:text-4xl lg:w-[140%] lg:text-4xl">
          Mujahid Azzam Darmawan
        </h1>

        <TextType
          as="p"
          text={["Product Designer", "Graphic Designer", "Frontend Developer"]}
          typingSpeed={75}
          deletingSpeed={35}
          pauseDuration={1800}
          initialDelay={500}
          loop
          active={isPhaseAtLeast(phase, "role")}
          onFirstComplete={handleRoleComplete}
          className="font-regular text-muted mt-2 text-xl sm:text-2xl md:text-3xl lg:text-4xl"
        />
      </motion.div>
    </ViewTransition>
  );
}
