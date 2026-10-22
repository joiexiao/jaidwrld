// types/project.ts — tipe entitas Project untuk konten portfolio.
// Fungsi: kontrak data proyek, dipakai content/projects.ts (dan nanti API Go).
// Catatan: `theme` & `accent` = kelas Tailwind palet BRAND per-project
//          (bukan token chrome tema), dipakai untuk kartu di homepage.

export type ProjectLink = {
  label: string;
  href: string;
};

export type Project = {
  slug: string;
  number: string;
  name: string;
  category: string;
  year: string;
  description: string;
  /** Isi kartu "About project" di panel detail. */
  about: string;
  /** Isi kartu "Challenge" di panel detail. */
  challenge: string;
  /** Isi kartu "Solution" di panel detail. */
  solution: string;
  /** Isi kartu "Result" di panel detail. */
  result: string;
  role: string;
  tech: string[];
  links: ProjectLink[];
  theme: string;
  accent: string;
  /** Galeri gambar project (berurutan). Index 0 = cover. */
  images: string[];
};
