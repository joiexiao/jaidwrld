// app/(portfolio)/project/[slug]/page.tsx — route dinamis detail proyek (/project/:slug).
// Fungsi: ambil data proyek by slug, generate metadata, dan prerender tiap slug.
// Tampilan diserahkan ke <ProjectDetail /> (client) — komposisi 2 panel yang
// di-share View Transition dengan card di home.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectDetail from "@/components/portfolio/sections/project-detail";
import { getAllProjects, getProjectBySlug } from "@/content/projects";

export function generateStaticParams() {
  return getAllProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/project/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) return {};

  return {
    title: `${project.name} — jaidwrld`,
    description: project.description,
  };
}

export default async function WorkDetailPage({
  params,
}: PageProps<"/project/[slug]">) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) notFound();

  return <ProjectDetail project={project} />;
}
