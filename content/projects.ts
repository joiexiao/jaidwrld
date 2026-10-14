// content/projects.ts — sumber data statis proyek portfolio (type-safe).
// Fungsi: satu sumber kebenaran data proyek; gampang dipindah ke API Go nanti.
// Catatan: field description/role/tech/links masih PLACEHOLDER — silakan edit.

import type { Project } from "@/types/project";

export const projects: Project[] = [
  {
    slug: "sidsneaks",
    number: "01",
    name: "SIDSNEAKS",
    category: "Dashboard Design System",
    year: "2026",
    description:
      "Design system untuk dashboard operasional SIDSNEAKS: komponen yang konsisten, token warna, dan alur data yang memudahkan tim membangun fitur baru tanpa redesign.",
    role: "UI/UX Designer",
    tech: ["Figma", "Design Tokens", "Component Library", "Dashboard UI"],
    links: [
      { label: "Live", href: "#" },
      { label: "Case Study", href: "#" },
    ],
    theme: "bg-[#d7d9d5]",
    accent: "bg-[#252822]",
    images: [
      "/projects/sidsneaks-1.jpg",
      "/projects/sidsneaks-2.jpg",
      "/projects/sidsneaks-3.jpg",
    ],
  },
  {
    slug: "kala-loop",
    number: "02",
    name: "KALA LOOP",
    category: "Combat Sports Platform",
    year: "2026",
    description:
      "Platform combat sports dengan identitas visual yang tegas — membangun pengalaman 'Common Ground' yang menghubungkan atlet, event, dan komunitas.",
    role: "UI/UX Designer",
    tech: ["Figma", "Brand Identity", "Web Design", "Prototyping"],
    links: [
      { label: "Live", href: "#" },
      { label: "Case Study", href: "#" },
    ],
    theme: "bg-[#242522]",
    accent: "bg-[#d8ff62]",
    images: [
      "/projects/kala-loop-1.jpg",
      "/projects/kala-loop-2.jpg",
      "/projects/kala-loop-3.jpg",
    ],
  },
  {
    slug: "heulaulabs",
    number: "03",
    name: "HEULAULABS",
    category: "Reservation Platform",
    year: "2025",
    description:
      "Pengalaman reservasi penginapan yang tenang dan dekat dengan alam — alur pemesanan sederhana dengan penekanan pada kejelasan dan kenyamanan.",
    role: "UI/UX Designer",
    tech: ["Figma", "UX Research", "Web Design", "Booking Flow"],
    links: [
      { label: "Live", href: "#" },
      { label: "Case Study", href: "#" },
    ],
    theme: "bg-[#d9e0df]",
    accent: "bg-[#536d69]",
    images: [
      "/projects/heulaulabs-1.jpg",
      "/projects/heulaulabs-2.jpg",
      "/projects/heulaulabs-3.jpg",
    ],
  },
];

export function getAllProjects(): Project[] {
  return projects;
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}
