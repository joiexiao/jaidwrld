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
    about:
      "Placeholder — latar belakang SIDSNEAKS dan alasan membangun satu sistem desain untuk dashboard operasional.",
    challenge:
      "Placeholder — tantangan menyatukan komponen, token warna, dan alur data yang tadinya tersebar dan tidak konsisten.",
    solution:
      "Placeholder — solusi: design system dengan komponen reusable, token warna terpusat, dan dokumentasi alur data.",
    result:
      "Placeholder — hasil: tim lebih cepat membangun fitur baru tanpa redesign, tampilan jadi konsisten.",
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
    name: "Kala Loop",
    category: "Combat Sports Platform",
    year: "2026",
    description:
      "Platform combat sports dengan identitas visual yang tegas — membangun pengalaman 'Common Ground' yang menghubungkan atlet, event, dan komunitas.",
    about:
      "Placeholder — latar belakang Kala Loop sebagai platform combat sports dengan identitas visual yang tegas.",
    challenge:
      "Placeholder — tantangan menyatukan atlet, event, dan komunitas dalam satu pengalaman 'Common Ground'.",
    solution:
      "Placeholder — solusi: sistem identitas visual dan alur platform yang konsisten di seluruh touchpoint.",
    result:
      "Placeholder — hasil: identitas yang kuat dan pengalaman pengguna yang kohesif di seluruh platform.",
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
    name: "Heulaulabs",
    category: "Reservation Platform",
    year: "2025",
    description:
      "Pengalaman reservasi penginapan yang tenang dan dekat dengan alam — alur pemesanan sederhana dengan penekanan pada kejelasan dan kenyamanan.",
    about:
      "Placeholder — latar belakang Heulaulabs sebagai platform reservasi penginapan yang tenang dan dekat dengan alam.",
    challenge:
      "Placeholder — tantangan menjaga alur pemesanan tetap sederhana tanpa mengorbankan informasi penting.",
    solution:
      "Placeholder — solusi: alur booking ringkas dengan penekanan pada kejelasan dan kenyamanan pengguna.",
    result:
      "Placeholder — hasil: proses reservasi yang lebih cepat dipahami dan nyaman digunakan.",
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
