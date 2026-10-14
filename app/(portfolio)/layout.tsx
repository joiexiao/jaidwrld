// app/(portfolio)/layout.tsx — shell area PORTFOLIO (URL: /).
// Fungsi: membungkus semua halaman publik portfolio. Tanda kurung (…) = route group,
//         jadi TIDAK mengubah URL ("/" tetap "/").
// Isi: ProjectSelectionProvider (state project aktif antar-route) + wrapper flex.
//      Layout ini TIDAK unmount saat navigasi home ⇄ detail, jadi state di dalam
//      provider bertahan dan `name` shared View Transition tetap konsisten.
import { ProjectSelectionProvider } from "@/components/portfolio/project-selection";

export default function PortfolioLayout({ children }: LayoutProps<"/">) {
  return (
    <ProjectSelectionProvider>
      <div className="flex flex-1 flex-col">{children}</div>
    </ProjectSelectionProvider>
  );
}
