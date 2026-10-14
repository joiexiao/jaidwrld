// app/(portfolio)/project/[slug]/page.tsx — route dinamis detail proyek (/project/:slug).
// Fungsi: ambil data proyek by slug, generate metadata, dan prerender tiap slug.
// Catatan: TAMPILAN MASIH MINIMAL — desain final menyusul. Markup sengaja
//          seadanya, tapi sudah pakai token tema (bukan hex).

import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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

  return (
    <article className="text-foreground mx-auto w-full max-w-3xl px-6 py-24">
      <Link href="/" className="text-muted text-xs tracking-wide uppercase">
        ← Back
      </Link>

      <p className="text-muted mt-8 text-xs tracking-[0.18em] uppercase">
        {project.number} · {project.category} · {project.year}
      </p>

      <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">
        {project.name}
      </h1>

      <p className="mt-6 text-base leading-relaxed">{project.description}</p>

      <dl className="border-border mt-10 grid gap-6 border-t pt-8 sm:grid-cols-2">
        <div>
          <dt className="text-muted text-xs tracking-[0.18em] uppercase">
            Role
          </dt>
          <dd className="mt-1">{project.role}</dd>
        </div>

        <div>
          <dt className="text-muted text-xs tracking-[0.18em] uppercase">
            Tech
          </dt>
          <dd className="mt-1">{project.tech.join(", ")}</dd>
        </div>
      </dl>

      {project.links.length > 0 && (
        <ul className="mt-10 flex flex-wrap gap-3">
          {project.links.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href as Route}
                className="border-border hover:bg-surface-2 inline-flex rounded-full border px-4 py-2 text-sm transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
