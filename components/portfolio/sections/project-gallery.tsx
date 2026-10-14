"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { Project } from "@/types/project";

type ProjectGalleryProps = {
  project: Project;
  view: "gallery" | "detail";
};

// Isi panel kanan saat mode expand: galeri gambar (linear, scroll) atau deskripsi.
export default function ProjectGallery({ project, view }: ProjectGalleryProps) {
  return (
    <div className="bg-surface-2 h-full w-full overflow-hidden rounded-[34px]">
      <AnimatePresence mode="wait" initial={false}>
        {view === "gallery" ? (
          <motion.ul
            key="gallery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-full w-full flex-col gap-3 overflow-y-auto p-3"
          >
            {project.images.map((src, index) => (
              <li
                key={src}
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
          </motion.ul>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-foreground h-full w-full overflow-y-auto p-8 sm:p-10"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
