// app/(portfolio)/about/page.tsx — halaman About (route /about).
// Fungsi: SERVER COMPONENT sebagai data boundary; ambil project + teks About
//         di sini lalu turunkan sebagai props ke <AboutSection /> (client).

import type { Metadata } from "next";
import AboutSection from "@/components/portfolio/sections/about-section";
import { getAllProjects } from "@/content/projects";
import { about } from "@/content/about";

export const metadata: Metadata = {
  title: "About — jaidwrld",
  description:
    "Tentang Mujahid Azzam Darmawan — product designer, graphic designer, dan frontend developer.",
};

export default function AboutPage() {
  const projects = getAllProjects();

  return <AboutSection projects={projects} about={about} />;
}
