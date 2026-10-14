// app/(portfolio)/page.tsx — halaman beranda portfolio, di-render pada route "/".
// Fungsi: SERVER COMPONENT yang menyatukan section (composition layer).
// Data diambil di sini (data boundary) lalu diturunkan sebagai props ke section,
// sehingga saat backend Go siap cukup ganti sumber data tanpa menyentuh UI section.

import HeroSection from "@/components/portfolio/sections/hero-section";
import { getAllProjects } from "@/content/projects";

export default function HomePage() {
  const projects = getAllProjects();

  return <HeroSection projects={projects} />;
}
