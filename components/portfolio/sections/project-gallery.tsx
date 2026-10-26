"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { ViewTransition } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Project } from "@/types/project";

gsap.registerPlugin(ScrollTrigger);

type ProjectGalleryProps = {
  project: Project;
  view: "gallery" | "detail";
};

export default function ProjectGallery({ project, view }: ProjectGalleryProps) {
  const galleryRef = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    if (view !== "gallery" || !galleryRef.current) return;

    const gallery = galleryRef.current;
    const items = gallery.querySelectorAll<HTMLElement>("[data-gallery-item]");

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      gsap.set(items, { clearProps: "all" });
      return;
    }

    // Di desktop panel kanan yang jadi scroller; di mobile halaman yang scroll,
    // jadi biarkan ScrollTrigger pakai viewport (scroller default).
    const scrollContainer = window.matchMedia("(min-width: 768px)").matches
      ? (gallery.closest(".project-gallery-scroll") as HTMLElement | null)
      : null;

    const context = gsap.context(() => {
      // Kecualikan kartu pertama (index 0) dari animasi entrance GSAP
      // karena kartu pertama di-handle oleh ViewTransition.
      const otherItems = Array.from(items).slice(1);

      gsap.fromTo(
        otherItems,
        {
          autoAlpha: 0,
          y: 48, // Jarak geser dari bawah yang lebih dalam agar pergerakannya lebih terasa
        },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          delay: 0.45,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: gallery,
            scroller: scrollContainer ?? undefined,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        },
      );
    }, gallery);

    return () => context.revert();
  }, [project.slug, view]);

  // Isi panel "Detail": empat kartu dengan kategori berbeda.
  const detailSections = [
    { title: "About project", body: project.about },
    { title: "Challenge", body: project.challenge },
    { title: "Solution", body: project.solution },
    { title: "Result", body: project.result },
  ];

  return (
    // Empat kartu detail: judul di atas, teks di bawah.
    // Ukuran & radius menyamai kartu gambar galeri (aspect-square + rounded-3xl).
    <ViewTransition
      key={view}
      name="gallery-view"
      share="auto"
      enter="auto"
      default="none"
    >
      {view === "gallery" ? (
        <ul
          ref={galleryRef}
          className="flex w-full flex-col gap-3 pb-24 sm:pt-0 md:pt-8 md:pb-0"
        >
          {project.images.map((src, index) => (
            <li
              key={src}
              data-gallery-item
              className="relative aspect-square w-full shrink-0 overflow-hidden rounded-[34px]"
            >
              {index === 0 ? (
                <ViewTransition
                  name={`project-${project.slug}-cover`}
                  share="morph"
                  default="none"
                >
                  <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-[34px]">
                    <Image
                      src={src}
                      alt={`${project.name} — gambar ${index + 1}`}
                      fill
                      sizes="(min-width: 1024px) 40vw, 90vw"
                      className="object-cover"
                    />
                  </div>
                </ViewTransition>
              ) : (
                <Image
                  src={src}
                  alt={`${project.name} — gambar ${index + 1}`}
                  fill
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  className="object-cover"
                />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex w-full flex-col gap-3 pt-8 pb-24 md:pb-0">
          {detailSections.map(({ title, body }) => (
            <article
              key={title}
              className="bg-solid text-foreground relative flex aspect-square w-full flex-col overflow-hidden rounded-[34px] p-8 shadow-sm sm:p-10"
            >
              <h3 className="text-foreground/60 text-xs">{title}</h3>
              <p className="mt-4 text-base leading-relaxed">{body}</p>
            </article>
          ))}
        </div>
      )}
    </ViewTransition>
  );
}
