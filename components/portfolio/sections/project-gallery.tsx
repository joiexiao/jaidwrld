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
      gsap.fromTo(
        items,
        {
          autoAlpha: 0.7,
          y: 18,
        },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: "power2.out",
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

  return (
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
          className="flex w-full flex-col gap-3 pt-8 pb-24 md:pb-0"
        >
          {project.images.map((src, index) => (
            <li
              key={src}
              data-gallery-item
              className="relative aspect-square w-full shrink-0 overflow-hidden rounded-3xl"
            >
              <Image
                src={src}
                alt={`${project.name} — gambar ${index + 1}`}
                fill
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover"
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-foreground w-full p-8 pb-24 sm:p-10 md:pb-10">
          <p className="text-muted text-[10px] tracking-[0.18em] uppercase">
            {project.category} · {project.year}
          </p>

          <h3 className="mt-3 text-2xl font-medium tracking-[-0.03em]">
            {project.name}
          </h3>

          <p className="mt-6 text-base leading-relaxed">
            {project.description}
          </p>

          <div className="border-border mt-8 border-t pt-6">
            <p className="text-muted text-[10px] tracking-[0.18em] uppercase">
              Role
            </p>
            <p className="mt-1 text-sm">{project.role}</p>
          </div>

          <div className="border-border mt-6 border-t pt-6">
            <p className="text-muted text-[10px] tracking-[0.18em] uppercase">
              Tech
            </p>

            <ul className="mt-3 flex flex-wrap gap-2">
              {project.tech.map((item) => (
                <li
                  key={item}
                  className="border-border rounded-full border px-3 py-1 text-xs"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </ViewTransition>
  );
}
